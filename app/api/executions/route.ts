import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status') || undefined;
  const workflowId = searchParams.get('workflowId') || undefined;
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
  const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;
  const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 50;
  const format = searchParams.get('format') as 'csv' | 'json' | null;

  const where: any = {
    workflowVersion: {
      workflow: {
        userId: session.user.id,
      },
    },
  };

  if (status) {
    where.status = status;
  }

  if (workflowId) {
    where.workflowVersion = {
      workflow: {
        id: workflowId,
        userId: session.user.id,
      },
    };
  }

  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt.gte = startDate;
    if (endDate) where.startedAt.lte = endDate;
  }

  const [executions, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      include: {
        workflowVersion: {
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        trigger: true,
        steps: {
          include: {
            step: true,
          },
        },
        logs: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      skip,
      take,
    }),
    prisma.execution.count({ where }),
  ]);

  if (format === 'csv') {
    const headers = [
      'ID',
      'Workflow',
      'Status',
      'Started At',
      'Completed At',
      'Duration (ms)',
      'Retry Count',
    ];

    const rows = executions.map((exec) => [
      exec.id,
      exec.workflowVersion.workflow.name,
      exec.status,
      exec.startedAt.toISOString(),
      exec.completedAt?.toISOString() || '',
      exec.durationMs?.toString() || '',
      exec.retryCount.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="executions-${new Date().toISOString()}.csv"`,
      },
    });
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify(executions, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="executions-${new Date().toISOString()}.json"`,
      },
    });
  }

  return NextResponse.json({ executions, total });
}
