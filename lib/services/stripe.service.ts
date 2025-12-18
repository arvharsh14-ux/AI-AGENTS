import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function createStripeCustomer(
  workspaceId: string,
  email: string,
  name: string
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { workspaceId },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

export async function createCheckoutSession(
  workspaceId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  let customerId = workspace.stripeCustomerId;

  if (!customerId) {
    const customer = await createStripeCustomer(
      workspaceId,
      `workspace-${workspaceId}@example.com`,
      workspace.name
    );
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { workspaceId },
  });

  return session;
}

export async function createBillingPortalSession(
  workspaceId: string,
  returnUrl: string
) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace?.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata.workspaceId;
  if (!workspaceId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const billingPlan = await prisma.billingPlan.findFirst({
    where: { stripePriceId: priceId },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      stripeSubscriptionId: subscription.id,
      billingPlanId: billingPlan?.id,
    },
  });
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata.workspaceId;
  if (!workspaceId) return;

  // Downgrade to free plan
  const freePlan = await prisma.billingPlan.findFirst({
    where: { name: 'Free' },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      stripeSubscriptionId: null,
      billingPlanId: freePlan?.id,
    },
  });
}
