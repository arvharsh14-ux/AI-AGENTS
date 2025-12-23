import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripeRequest } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing STRIPE_PRO_PRICE_ID' },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/settings/billing?checkout=success`;
    const cancelUrl = `${origin}/settings/billing?checkout=cancel`;

    const existingSub = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    let stripeCustomerId = existingSub?.stripeCustomerId || null;

    if (!stripeCustomerId) {
      const customer = await stripeRequest<{ id: string }>('customers', {
        email: session.user.email,
        name: session.user.name || undefined,
        'metadata[userId]': session.user.id,
      });

      stripeCustomerId = customer.id;

      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          stripeCustomerId,
          status: 'inactive',
        },
      });
    }

    const checkoutSession = await stripeRequest<{ url: string }>(
      'checkout/sessions',
      {
        mode: 'subscription',
        customer: stripeCustomerId,
        client_reference_id: session.user.id,
        'metadata[userId]': session.user.id,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': 1,
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        'subscription_data[metadata][userId]': session.user.id,
        'subscription_data[metadata][plan]': 'pro',
      }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
