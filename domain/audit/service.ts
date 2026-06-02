import { domainEventBus } from '@/domain/shared/domain-event-bus';
import { DOMAIN_EVENTS } from '@/domain/shared/events';
import { prisma } from '@/lib/prisma';
import { ActivityAction, ActorType } from '@/generated/prisma/client';

const auditMapping: Record<string, { action: ActivityAction, entityType: string }> = {
  [DOMAIN_EVENTS.EVENT_CREATED]: { action: 'CREATED', entityType: 'Event' },
  [DOMAIN_EVENTS.EVENT_STATUS_CHANGED]: { action: 'STATUS_CHANGED', entityType: 'Event' },
  [DOMAIN_EVENTS.EVENT_CANCELLED]: { action: 'CANCELLED', entityType: 'Event' },
  [DOMAIN_EVENTS.EVENT_UPDATED]: { action: 'UPDATED', entityType: 'Event' },

  [DOMAIN_EVENTS.VOLUNTEER_REGISTERED]: { action: 'REGISTERED', entityType: 'Participation' },
  [DOMAIN_EVENTS.VOLUNTEER_UNREGISTERED]: { action: 'UNREGISTERED', entityType: 'Participation' },
  [DOMAIN_EVENTS.ATTENDANCE_MARKED]: { action: 'UPDATED', entityType: 'Participation' },

  [DOMAIN_EVENTS.TASK_CREATED]: { action: 'CREATED', entityType: 'Task' },
  [DOMAIN_EVENTS.TASK_ASSIGNED]: { action: 'ASSIGNED', entityType: 'Task' },
  [DOMAIN_EVENTS.ASSIGNMENT_ACCEPTED]: { action: 'ACCEPTED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.ASSIGNMENT_DECLINED]: { action: 'DECLINED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.ASSIGNMENT_STARTED]: { action: 'UPDATED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.ASSIGNMENT_SUBMITTED]: { action: 'SUBMITTED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.ASSIGNMENT_APPROVED]: { action: 'REVIEWED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.ASSIGNMENT_REVISION_REQUESTED]: { action: 'REVIEWED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.ASSIGNMENT_CANCELLED]: { action: 'CANCELLED', entityType: 'Assignment' },
  [DOMAIN_EVENTS.TASK_STATUS_DERIVED]: { action: 'STATUS_CHANGED', entityType: 'Task' },

  [DOMAIN_EVENTS.EVIDENCE_SUBMITTED]: { action: 'SUBMITTED', entityType: 'Evidence' },
  [DOMAIN_EVENTS.EVIDENCE_APPROVED]: { action: 'REVIEWED', entityType: 'Evidence' },
  [DOMAIN_EVENTS.EVIDENCE_REJECTED]: { action: 'REVIEWED', entityType: 'Evidence' },
};

function extractEntityId(payload: any, entityType: string): number {
  if (entityType === 'Event' && payload.eventId) return payload.eventId;
  if (entityType === 'Task' && payload.taskId) return payload.taskId;
  if (entityType === 'Assignment' && payload.taskId) return payload.taskId;
  if (entityType === 'Evidence' && payload.evidenceId) return payload.evidenceId;
  if (entityType === 'Participation' && payload.eventId) return payload.eventId;
  
  return payload.id || payload.eventId || payload.taskId || 0;
}

let isInitialized = false;

export function initializeAuditListeners() {
  if (isInitialized) return;
  isInitialized = true;

  for (const [eventType, mapping] of Object.entries(auditMapping)) {
    domainEventBus.on(eventType, async (event) => {
      const { payload, metadata } = event as any;
      const { action, entityType } = mapping;
      const entityId = extractEntityId(payload, entityType);
      const eventId = payload.eventId || null;
      
      const actorId = metadata.actorId;
      const actorType: ActorType = actorId > 0 ? 'USER' : 'SYSTEM';

      let previousState = undefined;
      let newState = undefined;

      if (payload.previousStatus || payload.newStatus) {
        if (payload.previousStatus) previousState = { status: payload.previousStatus };
        if (payload.newStatus) newState = { status: payload.newStatus };
      } else {
        newState = payload;
      }

      try {
        await prisma.activityLog.create({
          data: {
            actorId,
            actorType,
            action,
            entityType,
            entityId,
            eventId,
            previousState,
            newState,
            createdAt: metadata.timestamp || new Date(),
          }
        });
      } catch (err) {
        console.error(`Failed to create ActivityLog for event ${eventType}:`, err);
      }
    });
  }
}

// Auto-initialize if imported. In a Next.js environment, this file might be imported by Server Actions or API routes, ensuring listeners are registered once per lambda/server-instance.
initializeAuditListeners();
