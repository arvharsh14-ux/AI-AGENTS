import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { inviteMember, requirePermission, removeMember, updateMemberRole } from '@/lib/services/rbac.service';
import { logAuditEvent } from '@/lib/services/audit.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;

  await requirePermission(session.user.id, workspaceId, 'member:read');

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json(
      { error: 'Email and role are required' },
      { status: 400 }
    );
  }

  try {
    const invite = await inviteMember(workspaceId, email, role, session.user.id);

    await logAuditEvent(
      workspaceId,
      'member.invited',
      'invite',
      invite.id,
      session.user.id,
      { email, role }
    );

    return NextResponse.json(invite);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite member' },
      { status: 403 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    await removeMember(workspaceId, userId, session.user.id);

    await logAuditEvent(
      workspaceId,
      'member.removed',
      'membership',
      null,
      session.user.id,
      { removedUserId: userId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 403 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json(
      { error: 'userId and role are required' },
      { status: 400 }
    );
  }

  try {
    await updateMemberRole(workspaceId, userId, role, session.user.id);

    await logAuditEvent(
      workspaceId,
      'member.role_updated',
      'membership',
      null,
      session.user.id,
      { userId, newRole: role }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update role' },
      { status: 403 }
    );
  }
}
