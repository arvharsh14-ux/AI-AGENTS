import { prisma } from '@/lib/prisma';
import { isActiveSubscription, PLAN_LIMITS, type PlanTier } from '@/lib/billing/plans';
import type { WorkflowDefinition } from '@/lib/types/workflow.types';

export class BillingService {
  async getSubscriptionForUser(userId: string) {
    return await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPlanForUser(userId: string): Promise<{
    tier: PlanTier;
    limits: (typeof PLAN_LIMITS)[PlanTier];
    subscription: Awaited<ReturnType<BillingService['getSubscriptionForUser']>>;
  }> {
    const subscription = await this.getSubscriptionForUser(userId);
    const tier: PlanTier = isActiveSubscription(subscription) ? 'pro' : 'free';

    return {
      tier,
      limits: PLAN_LIMITS[tier],
      subscription,
    };
  }

  async assertCanCreateWorkflow(userId: string): Promise<void> {
    const { tier, limits } = await this.getPlanForUser(userId);

    if (tier === 'pro') return;

    const workflowCount = await prisma.workflow.count({ where: { userId } });

    if (workflowCount >= limits.maxWorkflows) {
      throw new Error(
        `Free plan limit reached: max ${limits.maxWorkflows} workflows. Upgrade to Pro to create more.`
      );
    }
  }

  async assertCanPublishDefinition(userId: string, definition: WorkflowDefinition): Promise<void> {
    const { tier, limits } = await this.getPlanForUser(userId);

    if (tier === 'pro') return;

    const stepCount = definition.steps?.length ?? 0;

    if (stepCount > limits.maxStepsPerWorkflow) {
      throw new Error(
        `Free plan limit reached: max ${limits.maxStepsPerWorkflow} steps per workflow. Upgrade to Pro to publish larger workflows.`
      );
    }
  }

  async assertCanCreateConnector(userId: string, workflowId: string): Promise<void> {
    const { tier, limits } = await this.getPlanForUser(userId);

    if (tier === 'pro') return;

    const connectorCount = await prisma.connectorInstance.count({
      where: { workflowId },
    });

    if (connectorCount >= limits.maxConnectorsPerWorkflow) {
      throw new Error(
        `Free plan limit reached: max ${limits.maxConnectorsPerWorkflow} connectors per workflow. Upgrade to Pro to add more connectors.`
      );
    }
  }
}

export const billingService = new BillingService();
