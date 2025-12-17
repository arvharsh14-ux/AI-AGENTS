import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/services/rbac.service';
import { logAuditEvent } from '@/lib/services/audit.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;

  await requirePermission(session.user.id, workspaceId, 'alerts:read');

  const channels = await prisma.alertChannel.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(channels);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  await requirePermission(session.user.id, workspaceId, 'alerts:write');

  const { name, type, config, enabled } = body;

  if (!name || !type || !config) {
    return NextResponse.json(
      { error: 'Name, type, and config are required' },
      { status: 400 }
    );
  }

  const channel = await prisma.alertChannel.create({
    data: {
      workspaceId,
      name,
      type,
      config,
      enabled: enabled !== undefined ? enabled : true,
    },
  });

  await logAuditEvent(
    workspaceId,
    'alert_channel.created',
    'alert_channel',
    channel.id,
    session.user.id,
    { name, type }
  );

  return NextResponse.json(channel);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId is required' },
      { status: 400 }
    );
  }

  await requirePermission(session.user.id, workspaceId, 'alerts:write');

  await prisma.alertChannel.delete({
    where: { id: channelId },
  });

  await logAuditEvent(
    workspaceId,
    'alert_channel.deleted',
    'alert_channel',
    channelId,
    session.user.id
  );

  return NextResponse.json({ success: true });
}
