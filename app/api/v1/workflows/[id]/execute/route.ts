import { NextRequest, NextResponse } from 'next/server';
import { workflowService } from '@/lib/services/workflow.service';
import { executionService } from '@/lib/services/execution.service';
import { verifyApiKey } from '@/lib/middleware/auth';
import { dispatchQueue } from '@/lib/workflow/queue';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activeVersion = await workflowService.getActiveVersion(params.id);

    if (!activeVersion) {
      return NextResponse.json(
        { error: 'No active version found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const input = body.input || {};

    const execution = await executionService.createExecution({
      workflowVersionId: activeVersion.id,
      input,
    });

    await dispatchQueue.add('execute-workflow', {
      executionId: execution.id,
    });

    return NextResponse.json({
      executionId: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
    }, { status: 202 });
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
