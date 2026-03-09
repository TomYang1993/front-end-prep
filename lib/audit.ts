import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export async function createAuditLog(params: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload as Prisma.InputJsonValue | undefined
    }
  });
}
