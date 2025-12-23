import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executionService } from '@/lib/services/execution.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const execution = await executionService.getExecution(params.id);

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Check if user owns the workflow
    if (execution.workflowVersion.workflow.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('Failed to fetch execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    );
  }
}
