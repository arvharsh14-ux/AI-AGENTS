import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowService } from '@/lib/services/workflow.service';
import { billingService } from '@/lib/services/billing.service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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

    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const versionToPublish = await workflowService.getVersion(params.versionId);

    if (!versionToPublish) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    await billingService.assertCanPublishDefinition(
      session.user.id,
      versionToPublish.definition as any
    );

    const version = await workflowService.publishVersion(params.versionId);

    return NextResponse.json({ version });
  } catch (error: any) {
    const message = error?.message || 'Failed to publish version';

    if (message.includes('Free plan limit')) {
      return NextResponse.json(
        { error: message, code: 'PLAN_LIMIT' },
        { status: 402 }
      );
    }

    console.error('Failed to publish version:', error);
    return NextResponse.json({ error: 'Failed to publish version' }, { status: 500 });
  }
}
