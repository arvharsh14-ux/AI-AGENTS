import { prisma } from '@/lib/prisma';

export interface MetricsData {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
}

export async function aggregateExecutionMetrics(
  date: Date,
  hour?: number
): Promise<void> {
  const startDate = new Date(date);
  startDate.setHours(hour ?? 0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  if (hour !== undefined) {
    endDate.setHours(hour + 1);
  } else {
    endDate.setDate(endDate.getDate() + 1);
  }

  const executions = await prisma.execution.findMany({
    where: {
      startedAt: {
        gte: startDate,
        lt: endDate,
      },
      completedAt: { not: null },
    },
    select: {
      status: true,
      durationMs: true,
      workflowVersion: {
        select: {
          workflow: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  // Group by user
  const userMetrics = new Map<string, number[]>();
  
  for (const exec of executions) {
    const userId = exec.workflowVersion.workflow.userId;
    if (!userMetrics.has(userId)) {
      userMetrics.set(userId, []);
    }
    if (exec.durationMs) {
      userMetrics.get(userId)!.push(exec.durationMs);
    }
  }

  // Calculate and store metrics for each user
  for (const [userId, durations] of userMetrics.entries()) {
    const successful = executions.filter(
      (e) => e.workflowVersion.workflow.userId === userId && e.status === 'completed'
    ).length;
    const failed = executions.filter(
      (e) => e.workflowVersion.workflow.userId === userId && e.status === 'failed'
    ).length;

    const sortedDurations = durations.sort((a, b) => a - b);
    const metrics = calculatePercentiles(sortedDurations);

    await prisma.executionMetrics.upsert({
      where: {
        workspaceId_userId_date_hour: {
          workspaceId: undefined as any,
          userId,
          date: new Date(date.toISOString().split('T')[0]),
          hour: hour ?? undefined as any,
        },
      },
      create: {
        userId,
        date: new Date(date.toISOString().split('T')[0]),
        hour: hour ?? undefined,
        totalExecutions: successful + failed,
        successfulExecutions: successful,
        failedExecutions: failed,
        ...metrics,
      },
      update: {
        totalExecutions: successful + failed,
        successfulExecutions: successful,
        failedExecutions: failed,
        ...metrics,
      },
    });
  }
}

function calculatePercentiles(durations: number[]) {
  if (durations.length === 0) {
    return {
      totalDurationMs: BigInt(0),
      minDurationMs: null,
      maxDurationMs: null,
      avgDurationMs: null,
      p50DurationMs: null,
      p95DurationMs: null,
      p99DurationMs: null,
    };
  }

  const sum = durations.reduce((a, b) => a + b, 0);
  const total = BigInt(sum);
  const avg = sum / durations.length;
  
  const getPercentile = (p: number) => {
    const index = Math.ceil((p / 100) * durations.length) - 1;
    return durations[Math.max(0, index)];
  };

  return {
    totalDurationMs: total,
    minDurationMs: durations[0],
    maxDurationMs: durations[durations.length - 1],
    avgDurationMs: avg,
    p50DurationMs: getPercentile(50),
    p95DurationMs: getPercentile(95),
    p99DurationMs: getPercentile(99),
  };
}

export async function getMetricsForUser(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MetricsData[]> {
  const metrics = await prisma.executionMetrics.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return metrics.map((m) => ({
    totalExecutions: m.totalExecutions,
    successfulExecutions: m.successfulExecutions,
    failedExecutions: m.failedExecutions,
    avgDurationMs: m.avgDurationMs ?? 0,
    p50DurationMs: m.p50DurationMs ?? 0,
    p95DurationMs: m.p95DurationMs ?? 0,
    p99DurationMs: m.p99DurationMs ?? 0,
  }));
}

export async function getRealtimeMetrics(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const executions = await prisma.execution.findMany({
    where: {
      workflowVersion: {
        workflow: {
          userId,
        },
      },
      startedAt: {
        gte: today,
      },
    },
    select: {
      status: true,
      durationMs: true,
    },
  });

  const successful = executions.filter((e) => e.status === 'completed').length;
  const failed = executions.filter((e) => e.status === 'failed').length;
  const running = executions.filter((e) => e.status === 'running').length;

  const durations = executions
    .filter((e) => e.durationMs)
    .map((e) => e.durationMs!);

  const avgDuration =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  return {
    total: executions.length,
    successful,
    failed,
    running,
    avgDuration,
  };
}
