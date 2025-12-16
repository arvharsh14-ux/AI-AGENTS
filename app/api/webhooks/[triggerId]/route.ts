import { NextRequest, NextResponse } from 'next/server';
import { triggerService } from '@/lib/services/trigger.service';
import { addDispatchJob } from '@/lib/workflow/queue';

export async function POST(
  request: NextRequest,
  { params }: { params: { triggerId: string } }
) {
  try {
    const trigger = await triggerService.getTrigger(params.triggerId);

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    if (trigger.type !== 'webhook') {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
    }

    if (!trigger.enabled) {
      return NextResponse.json({ error: 'Trigger is disabled' }, { status: 403 });
    }

    const body = await request.json();

    const job = await addDispatchJob({
      workflowId: trigger.workflowId,
      triggerId: trigger.id,
      input: body,
      metadata: {
        triggeredBy: 'webhook',
        triggerId: trigger.id,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      message: 'Webhook received and workflow queued',
    });
  } catch (error: any) {
    console.error('Failed to process webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { triggerId: string } }
) {
  try {
    const trigger = await triggerService.getTrigger(params.triggerId);

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    if (trigger.type !== 'webhook') {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
    }

    return NextResponse.json({
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      enabled: trigger.enabled,
      message: 'Webhook endpoint active',
    });
  } catch (error: any) {
    console.error('Failed to get webhook info:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook info' },
      { status: 500 }
    );
  }
}
