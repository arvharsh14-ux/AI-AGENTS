import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/services/rbac.service';
import { logAuditEvent } from '@/lib/services/audit.service';
import crypto from 'crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;

  await requirePermission(session.user.id, workspaceId, 'apikey:read');

  const apiKeys = await prisma.apiKey.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  // Don't return full keys
  return NextResponse.json(
    apiKeys.map((key: any) => ({
      ...key,
      key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const body = await req.json();

  await requirePermission(session.user.id, workspaceId, 'apikey:create');

  const { name, role, expiresAt } = body;

  // Generate secure API key
  const key = `sk_${crypto.randomBytes(32).toString('hex')}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      key,
      name,
      role: role || 'viewer',
      workspaceId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await logAuditEvent(
    workspaceId,
    'apikey.created',
    'apikey',
    apiKey.id,
    session.user.id,
    { name, role }
  );

  // Return full key only on creation
  return NextResponse.json(apiKey);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get('keyId');

  if (!keyId) {
    return NextResponse.json(
      { error: 'keyId is required' },
      { status: 400 }
    );
  }

  await requirePermission(session.user.id, workspaceId, 'apikey:delete');

  await prisma.apiKey.delete({
    where: { id: keyId },
  });

  await logAuditEvent(
    workspaceId,
    'apikey.deleted',
    'apikey',
    keyId,
    session.user.id
  );

  return NextResponse.json({ success: true });
}
