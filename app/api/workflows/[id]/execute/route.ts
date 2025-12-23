import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { workflowService } from '@/lib/services/workflow.service';
import { addDispatchJob } from '@/lib/workflow/queue';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await workflowService.getWorkflow(params.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.userId !== session.user.id && !workflow.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const input = body?.input || {};
    let versionId: string | undefined = body?.versionId;

    if (!versionId) {
      const activeVersion = await workflowService.getActiveVersion(params.id);

      if (!activeVersion) {
        return NextResponse.json(
          { error: 'No active version found' },
          { status: 400 },
        );
      }

      versionId = activeVersion.id;
    }

    const job = await addDispatchJob({
      workflowId: params.id,
      versionId,
      input,
      metadata: {
        triggeredBy: 'manual',
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      message: 'Workflow execution queued',
    });
  } catch (error: any) {
    console.error('Failed to execute workflow:', error);
    return NextResponse.json({ error: 'Failed to execute workflow' }, { status: 500 });
  }
}
