import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { acceptInvite } from '@/lib/services/rbac.service';
import { logAuditEvent } from '@/lib/services/audit.service';

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const body = await req.json();

  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  try {
    const workspaceId = await acceptInvite(token, session.user.id);

    await logAuditEvent(
      workspaceId,
      'invite.accepted',
      'invite',
      null,
      session.user.id
    );

    return NextResponse.json({ workspaceId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invite' },
      { status: 400 }
    );
  }
}
