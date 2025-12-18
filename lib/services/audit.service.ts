import { prisma } from '@/lib/prisma';

export async function logAuditEvent(
  workspaceId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  userId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.auditLog.create({
    data: {
      workspaceId,
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata || {},
      ipAddress,
      userAgent,
    },
  });
}

export async function getAuditLogs(
  workspaceId: string,
  filters?: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  pagination?: {
    skip?: number;
    take?: number;
  }
) {
  const where: any = { workspaceId };

  if (filters?.action) {
    where.action = filters.action;
  }
  if (filters?.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  if (filters?.startDate || filters?.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: pagination?.skip || 0,
      take: pagination?.take || 50,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function exportAuditLogs(
  workspaceId: string,
  format: 'csv' | 'json',
  filters?: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const { logs } = await getAuditLogs(workspaceId, filters, { take: 10000 });

  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  // CSV format
  const headers = [
    'Timestamp',
    'Action',
    'Entity Type',
    'Entity ID',
    'User ID',
    'IP Address',
    'User Agent',
  ];

  const rows = logs.map((log) => [
    log.timestamp.toISOString(),
    log.action,
    log.entityType,
    log.entityId || '',
    log.userId || '',
    log.ipAddress || '',
    log.userAgent || '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}
