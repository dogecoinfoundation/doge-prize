import { prisma } from './prisma';

export type AuditAction = 'CREATE' | 'UPDATE' | 'REDEEM' | 'DELETE' | 'SEND' | 'TRANSFER';
export type AuditEntityType = 'PRIZE' | 'DOGE' | 'REDEMPTION_CODE' | 'PRIZE_POOL';

export interface AuditLog {
  id: number;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  details: string | null;
  createdAt: string;
}

export async function logAudit(
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: number,
  details: string | null = null
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details
      }
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

export async function getAuditLogs(
  entityType?: AuditEntityType,
  entityId?: number
) {
  try {
    const where = {
      ...(entityType && { entityType }),
      ...(entityId && { entityId })
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
} 