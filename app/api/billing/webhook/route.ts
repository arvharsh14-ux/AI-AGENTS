import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStripeWebhookSignature } from '@/lib/billing/stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  try {
    verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: any;

  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session?.metadata?.userId || session?.client_reference_id;
        const customerId = session?.customer as string | undefined;
        const subscriptionId = session?.subscription as string | undefined;

        if (userId && customerId) {
          await prisma.subscription.upsert({
            where: { stripeCustomerId: customerId },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: 'active',
            },
            update: {
              userId,
              stripeSubscriptionId: subscriptionId,
            },
          });
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await upsertFromSubscription(subscription);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function upsertFromSubscription(subscription: any) {
  const stripeSubscriptionId = subscription.id as string;
  const stripeCustomerId = subscription.customer as string;

  const priceId =
    subscription.items?.data?.[0]?.price?.id ||
    subscription.items?.data?.[0]?.plan?.id;

  const currentPeriodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : null;

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

  const status = subscription.status as string;

  const userIdFromMetadata = subscription.metadata?.userId as string | undefined;

  const existingBySubId = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (existingBySubId) {
    await prisma.subscription.update({
      where: { id: existingBySubId.id },
      data: {
        stripeCustomerId,
        stripePriceId: priceId,
        status,
        currentPeriodStart: currentPeriodStart || undefined,
        currentPeriodEnd: currentPeriodEnd || undefined,
        cancelAtPeriodEnd,
      },
    });
    return;
  }

  const existingByCustomerId = await prisma.subscription.findUnique({
    where: { stripeCustomerId },
  });

  const userId = userIdFromMetadata || existingByCustomerId?.userId;

  if (!userId) {
    console.warn(
      'Stripe subscription webhook: unable to determine userId for customer',
      stripeCustomerId
    );
    return;
  }

  if (existingByCustomerId) {
    await prisma.subscription.update({
      where: { id: existingByCustomerId.id },
      data: {
        stripeSubscriptionId,
        stripePriceId: priceId,
        status,
        currentPeriodStart: currentPeriodStart || undefined,
        currentPeriodEnd: currentPeriodEnd || undefined,
        cancelAtPeriodEnd,
      },
    });
    return;
  }

  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: priceId,
      status,
      currentPeriodStart: currentPeriodStart || undefined,
      currentPeriodEnd: currentPeriodEnd || undefined,
      cancelAtPeriodEnd,
    },
  });
}
