import { prisma } from '@/lib/prisma';

export async function trackUsage(workspaceId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get workspace members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  const userIds = members.map((m) => m.userId);

  // Count executions today
  const executionCount = await prisma.execution.count({
    where: {
      workflowVersion: {
        workflow: {
          userId: { in: userIds },
        },
      },
      startedAt: {
        gte: today,
      },
    },
  });

  // Calculate run minutes
  const executions = await prisma.execution.findMany({
    where: {
      workflowVersion: {
        workflow: {
          userId: { in: userIds },
        },
      },
      startedAt: {
        gte: today,
      },
      durationMs: { not: null },
    },
    select: { durationMs: true },
  });

  const runMinutes =
    executions.reduce((sum, e) => sum + (e.durationMs || 0), 0) / 1000 / 60;

  // Count workflows and connectors
  const workflowCount = await prisma.workflow.count({
    where: {
      userId: { in: userIds },
    },
  });

  const connectorCount = await prisma.connectorInstance.count({
    where: {
      workflow: {
        userId: { in: userIds },
      },
    },
  });

  // Upsert usage record
  await prisma.usageRecord.upsert({
    where: {
      workspaceId_date: {
        workspaceId,
        date: today,
      },
    },
    create: {
      workspaceId,
      date: today,
      executionCount,
      runMinutes,
      connectorCount,
      workflowCount,
    },
    update: {
      executionCount,
      runMinutes,
      connectorCount,
      workflowCount,
    },
  });
}

export async function checkQuota(workspaceId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { billingPlan: true },
  });

  if (!workspace?.billingPlan) {
    return { allowed: true };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Get usage for current month
  const usageRecords = await prisma.usageRecord.findMany({
    where: {
      workspaceId,
      date: {
        gte: monthStart,
      },
    },
  });

  const totalExecutions = usageRecords.reduce((sum, r) => sum + r.executionCount, 0);
  const totalRunMinutes = usageRecords.reduce((sum, r) => sum + r.runMinutes, 0);

  const plan = workspace.billingPlan;

  if (totalExecutions >= plan.maxExecutionsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly execution limit reached (${plan.maxExecutionsPerMonth})`,
    };
  }

  if (totalRunMinutes >= plan.maxRunMinutesPerMonth) {
    return {
      allowed: false,
      reason: `Monthly run minutes limit reached (${plan.maxRunMinutesPerMonth})`,
    };
  }

  // Check workflow count
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  const workflowCount = await prisma.workflow.count({
    where: {
      userId: { in: members.map((m) => m.userId) },
    },
  });

  if (workflowCount >= plan.maxWorkflows) {
    return {
      allowed: false,
      reason: `Workflow limit reached (${plan.maxWorkflows})`,
    };
  }

  return { allowed: true };
}

export async function getCurrentUsage(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { billingPlan: true },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const usageRecords = await prisma.usageRecord.findMany({
    where: {
      workspaceId,
      date: {
        gte: monthStart,
      },
    },
  });

  const totalExecutions = usageRecords.reduce((sum, r) => sum + r.executionCount, 0);
  const totalRunMinutes = usageRecords.reduce((sum, r) => sum + r.runMinutes, 0);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
  });

  const workflowCount = await prisma.workflow.count({
    where: {
      userId: { in: members.map((m) => m.userId) },
    },
  });

  const connectorCount = await prisma.connectorInstance.count({
    where: {
      workflow: {
        userId: { in: members.map((m) => m.userId) },
      },
    },
  });

  const plan = workspace.billingPlan;

  return {
    executions: {
      current: totalExecutions,
      limit: plan?.maxExecutionsPerMonth ?? Infinity,
      percentage: plan
        ? (totalExecutions / plan.maxExecutionsPerMonth) * 100
        : 0,
    },
    runMinutes: {
      current: totalRunMinutes,
      limit: plan?.maxRunMinutesPerMonth ?? Infinity,
      percentage: plan
        ? (totalRunMinutes / plan.maxRunMinutesPerMonth) * 100
        : 0,
    },
    workflows: {
      current: workflowCount,
      limit: plan?.maxWorkflows ?? Infinity,
      percentage: plan ? (workflowCount / plan.maxWorkflows) * 100 : 0,
    },
    connectors: {
      current: connectorCount,
      limit: plan?.maxConnectors ?? Infinity,
      percentage: plan ? (connectorCount / plan.maxConnectors) * 100 : 0,
    },
    teamMembers: {
      current: members.length,
      limit: plan?.maxTeamMembers ?? Infinity,
      percentage: plan ? (members.length / plan.maxTeamMembers) * 100 : 0,
    },
  };
}
