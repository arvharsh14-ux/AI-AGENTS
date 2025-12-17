import { prisma } from '@/lib/prisma';
import axios from 'axios';

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  threshold: number;
  window?: number; // Time window in minutes
}

export async function evaluateAlertRules(workspaceId: string) {
  const rules = await prisma.alertRule.findMany({
    where: {
      workspaceId,
      enabled: true,
    },
    include: {
      workspace: {
        include: {
          alertChannels: {
            where: { enabled: true },
          },
        },
      },
    },
  });

  for (const rule of rules) {
    const shouldAlert = await evaluateRule(rule);
    if (shouldAlert) {
      await triggerAlert(rule);
    }
  }
}

async function evaluateRule(rule: any): Promise<boolean> {
  const conditions = rule.conditions as AlertCondition;

  switch (rule.type) {
    case 'execution_failure':
      return await evaluateExecutionFailure(rule.workspaceId, conditions);
    case 'rate_limit_breach':
      return await evaluateRateLimitBreach(rule.workspaceId, conditions);
    case 'quota_warning':
      return await evaluateQuotaWarning(rule.workspaceId, conditions);
    default:
      return false;
  }
}

async function evaluateExecutionFailure(
  workspaceId: string,
  conditions: AlertCondition
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - (conditions.window || 60));

  const failedCount = await prisma.execution.count({
    where: {
      workflowVersion: {
        workflow: {
          userId: {
            in: (
              await prisma.membership.findMany({
                where: { workspaceId },
                select: { userId: true },
              })
            ).map((m) => m.userId),
          },
        },
      },
      status: 'failed',
      startedAt: {
        gte: windowStart,
      },
    },
  });

  return failedCount > conditions.threshold;
}

async function evaluateRateLimitBreach(
  workspaceId: string,
  conditions: AlertCondition
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - (conditions.window || 60));

  const executionCount = await prisma.execution.count({
    where: {
      workflowVersion: {
        workflow: {
          userId: {
            in: (
              await prisma.membership.findMany({
                where: { workspaceId },
                select: { userId: true },
              })
            ).map((m) => m.userId),
          },
        },
      },
      startedAt: {
        gte: windowStart,
      },
    },
  });

  return executionCount > conditions.threshold;
}

async function evaluateQuotaWarning(
  workspaceId: string,
  conditions: AlertCondition
): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { billingPlan: true },
  });

  if (!workspace?.billingPlan) return false;

  // Get current month usage
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const executionCount = await prisma.execution.count({
    where: {
      workflowVersion: {
        workflow: {
          userId: {
            in: (
              await prisma.membership.findMany({
                where: { workspaceId },
                select: { userId: true },
              })
            ).map((m) => m.userId),
          },
        },
      },
      startedAt: {
        gte: monthStart,
      },
    },
  });

  const usagePercent =
    (executionCount / workspace.billingPlan.maxExecutionsPerMonth) * 100;
  return usagePercent > conditions.threshold;
}

async function triggerAlert(rule: any) {
  const channels = rule.workspace.alertChannels;

  const message = generateAlertMessage(rule);

  for (const channel of channels) {
    try {
      if (channel.type === 'email') {
        await sendEmailAlert(channel, message);
      } else if (channel.type === 'slack') {
        await sendSlackAlert(channel, message);
      }

      await prisma.alertNotification.create({
        data: {
          alertRuleId: rule.id,
          alertChannelId: channel.id,
          message,
          status: 'sent',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.alertNotification.create({
        data: {
          alertRuleId: rule.id,
          alertChannelId: channel.id,
          message,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

function generateAlertMessage(rule: any): string {
  const conditions = rule.conditions as AlertCondition;
  
  switch (rule.type) {
    case 'execution_failure':
      return `Alert: ${rule.name}\nExecution failures exceeded ${conditions.threshold} in the last ${conditions.window || 60} minutes.`;
    case 'rate_limit_breach':
      return `Alert: ${rule.name}\nRate limit exceeded: ${conditions.threshold} executions in ${conditions.window || 60} minutes.`;
    case 'quota_warning':
      return `Alert: ${rule.name}\nQuota usage exceeded ${conditions.threshold}% of monthly limit.`;
    default:
      return `Alert: ${rule.name}`;
  }
}

async function sendEmailAlert(channel: any, message: string) {
  // In production, integrate with email service (SendGrid, SES, etc.)
  console.log('Email alert:', { channel, message });
  // For now, we'll just log it
}

async function sendSlackAlert(channel: any, message: string) {
  const config = channel.config as { webhookUrl: string };
  
  await axios.post(config.webhookUrl, {
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  });
}
