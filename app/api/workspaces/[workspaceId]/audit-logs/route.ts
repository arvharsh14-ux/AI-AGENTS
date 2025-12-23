import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { requirePermission } from '@/lib/services/rbac.service';
import { getAuditLogs, exportAuditLogs } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await requireAuth();
  const { workspaceId } = params;
  const { searchParams } = new URL(req.url);

  await requirePermission(session.user.id, workspaceId, 'workspace:read');

  const action = searchParams.get('action') || undefined;
  const entityType = searchParams.get('entityType') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
  const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;
  const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 50;
  const format = searchParams.get('format') as 'csv' | 'json' | null;

  if (format) {
    const exported = await exportAuditLogs(workspaceId, format, {
      action,
      entityType,
      userId,
      startDate,
      endDate,
    });

    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `audit-logs-${new Date().toISOString()}.${format}`;

    return new NextResponse(exported, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  const result = await getAuditLogs(
    workspaceId,
    { action, entityType, userId, startDate, endDate },
    { skip, take }
  );

  return NextResponse.json(result);
}
