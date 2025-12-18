import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowService } from '@/lib/services/workflow.service';
import { billingService } from '@/lib/services/billing.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const { definition, publish } = body;

    if (!definition) {
      return NextResponse.json(
        { error: 'Definition is required' },
        { status: 400 }
      );
    }

    if (publish) {
      await billingService.assertCanPublishDefinition(session.user.id, definition);
    }

    let version = await workflowService.createVersion(params.id, definition);

    if (publish && version) {
      const publishedVersion = await workflowService.publishVersion(version.id);
      if (publishedVersion) {
        version = publishedVersion;
      }
    }

    return NextResponse.json({ version }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Failed to create version';

    if (message.includes('Free plan limit')) {
      return NextResponse.json(
        { error: message, code: 'PLAN_LIMIT' },
        { status: 402 }
      );
    }

    console.error('Failed to create version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}
