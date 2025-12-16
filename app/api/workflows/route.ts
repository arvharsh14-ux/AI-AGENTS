import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowService } from '@/lib/services/workflow.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await workflowService.listWorkflows(session.user.id);

    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error('Failed to list workflows:', error);
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { name, description, isPublic, rateLimitMaxConcurrent, rateLimitPerMinute, retryMaxAttempts, retryBackoffMs } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const workflow = await workflowService.createWorkflow({
      name,
      description,
      userId: session.user.id,
      isPublic,
      rateLimitMaxConcurrent,
      rateLimitPerMinute,
      retryMaxAttempts,
      retryBackoffMs,
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
