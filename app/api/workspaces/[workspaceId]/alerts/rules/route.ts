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

  const rules = await prisma.alertRule.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(rules);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  await requirePermission(session.user.id, workspaceId, 'alerts:write');

  const { name, type, conditions, enabled } = body;

  if (!name || !type || !conditions) {
    return NextResponse.json(
      { error: 'Name, type, and conditions are required' },
      { status: 400 }
    );
  }

  const rule = await prisma.alertRule.create({
    data: {
      workspaceId,
      name,
      type,
      conditions,
      enabled: enabled !== undefined ? enabled : true,
    },
  });

  await logAuditEvent(
    workspaceId,
    'alert_rule.created',
    'alert_rule',
    rule.id,
    session.user.id,
    { name, type }
  );

  return NextResponse.json(rule);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  await requirePermission(session.user.id, workspaceId, 'alerts:write');

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json(
      { error: 'Rule ID is required' },
      { status: 400 }
    );
  }

  const rule = await prisma.alertRule.update({
    where: { id },
    data: updates,
  });

  await logAuditEvent(
    workspaceId,
    'alert_rule.updated',
    'alert_rule',
    rule.id,
    session.user.id
  );

  return NextResponse.json(rule);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const { searchParams } = new URL(req.url);
  const ruleId = searchParams.get('ruleId');

  if (!ruleId) {
    return NextResponse.json(
      { error: 'ruleId is required' },
      { status: 400 }
    );
  }

  await requirePermission(session.user.id, workspaceId, 'alerts:write');

  await prisma.alertRule.delete({
    where: { id: ruleId },
  });

  await logAuditEvent(
    workspaceId,
    'alert_rule.deleted',
    'alert_rule',
    ruleId,
    session.user.id
  );

  return NextResponse.json({ success: true });
}
