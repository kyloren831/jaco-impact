"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { prisma } from '@/lib/prisma';
import { ActivityAction } from '@/generated/prisma/client';
import '@/domain/audit/service'; // Ensures listeners are initialized

export type GetActivityLogsOptions = {
  limit?: number;
  eventId?: number;
  actorId?: number;
  action?: ActivityAction;
  entityType?: string;
  entityId?: number;
};

export async function getActivityLogs(options?: GetActivityLogsOptions) {
  try {
    const { limit = 50, eventId, actorId, action, entityType, entityId } = options || {};

    const logs = await prisma.activityLog.findMany({
      where: {
        ...(eventId !== undefined && { eventId }),
        ...(actorId !== undefined && { actorId }),
        ...(action !== undefined && { action }),
        ...(entityType !== undefined && { entityType }),
        ...(entityId !== undefined && { entityId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return {
      success: true,
      data: logs
    };
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch activity logs'
    };
  }
}
