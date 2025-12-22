import { NextRequest, NextResponse } from 'next/server';
import { executionService } from '@/lib/services/execution.service';
import { verifyApiKey } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const execution = await executionService.getExecution(params.id);

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // For API key auth, we skip user-level checks since workspace is sufficient
    // TODO: Add workspace-level checks when workflows support workspaceId

    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const execution = await executionService.getExecution(params.id);

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // For API key auth, we skip user-level checks since workspace is sufficient
    // TODO: Add workspace-level checks when workflows support workspaceId

    const body = await request.json();
    const action = body.action;

    if (action === 'cancel') {
      if (execution.status !== 'pending' && execution.status !== 'running') {
        return NextResponse.json(
          { error: 'Execution cannot be cancelled in its current state' },
          { status: 400 }
        );
      }

      await executionService.updateExecution(params.id, {
        status: 'cancelled',
        completedAt: new Date(),
        error: 'Cancelled by user',
      });

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error performing execution action:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
