import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};

    if (workflowId) {
      where.workflowVersion = {
        workflowId,
      };
    }

    // Filter by user's workflows
    where.workflowVersion = {
      ...where.workflowVersion,
      workflow: {
        userId: session.user.id,
      },
    };

    const executions = await prisma.execution.findMany({
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
        trigger: {
          select: {
            id: true,
            type: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.execution.count({ where });

    return NextResponse.json({
      executions,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
