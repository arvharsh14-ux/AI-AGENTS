import type { Subscription } from '@prisma/client';

export type PlanTier = 'free' | 'pro';

export const PLAN_LIMITS: Record<PlanTier, {
  maxWorkflows: number;
  maxStepsPerWorkflow: number;
  maxConnectorsPerWorkflow: number;
}> = {
  free: {
    maxWorkflows: 3,
    maxStepsPerWorkflow: 10,
    maxConnectorsPerWorkflow: 2,
  },
  pro: {
    maxWorkflows: Number.POSITIVE_INFINITY,
    maxStepsPerWorkflow: Number.POSITIVE_INFINITY,
    maxConnectorsPerWorkflow: Number.POSITIVE_INFINITY,
  },
};

export function isActiveSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (!['active', 'trialing'].includes(subscription.status)) return false;

  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() < Date.now()) {
    return false;
  }

  return true;
}
