import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowService } from '@/lib/services/workflow.service';
import { triggerService } from '@/lib/services/trigger.service';

export async function GET(
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

    if (workflow.userId !== session.user.id && !workflow.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const triggers = await triggerService.listTriggers(params.id);

    return NextResponse.json({ triggers });
  } catch (error: any) {
    console.error('Failed to list triggers:', error);
    return NextResponse.json(
      { error: 'Failed to list triggers' },
      { status: 500 }
    );
  }
}

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
    const { type, config, enabled } = body;

    if (!type || !config) {
      return NextResponse.json(
        { error: 'Type and config are required' },
        { status: 400 }
      );
    }

    const trigger = await triggerService.createTrigger({
      workflowId: params.id,
      type,
      config,
      enabled,
    });

    return NextResponse.json({ trigger }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create trigger:', error);
    return NextResponse.json(
      { error: 'Failed to create trigger' },
      { status: 500 }
    );
  }
}
