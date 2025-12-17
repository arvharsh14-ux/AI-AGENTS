import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { requirePermission } from '@/lib/services/rbac.service';
import { getCurrentUsage } from '@/lib/services/usage.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;

  await requirePermission(session.user.id, workspaceId, 'billing:read');

  try {
    const usage = await getCurrentUsage(workspaceId);
    return NextResponse.json(usage);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get usage' },
      { status: 500 }
    );
  }
}
