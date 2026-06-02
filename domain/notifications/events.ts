import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS, TaskAssignedPayload, EvidenceSubmittedPayload, EvidenceReviewedPayload } from '../shared/events';
import { NotificationService } from './service';
import { NotificationType } from '../../generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const notificationService = new NotificationService();

let isInitialized = false;

export function registerNotificationHandlers() {
  if (isInitialized) return;
  isInitialized = true;
  
  domainEventBus.on<TaskAssignedPayload>(DOMAIN_EVENTS.TASK_ASSIGNED, async (event) => {
    const { volunteerId, taskId, taskTitle, eventName } = event.payload;
    await notificationService.createNotification({
      userId: volunteerId,
      title: 'New Task Assigned',
      message: `You have been assigned to task "${taskTitle}" in event "${eventName}".`,
      type: NotificationType.TASK_ASSIGNMENT,
      relatedEntityType: 'Task',
      relatedEntityId: taskId.toString()
    });
  });

  domainEventBus.on<EvidenceSubmittedPayload>(DOMAIN_EVENTS.EVIDENCE_SUBMITTED, async (event) => {
    const { taskId, evidenceId } = event.payload;
    
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;

    await notificationService.createNotification({
      userId: task.createdBy,
      title: 'Evidence Submitted',
      message: `A volunteer has submitted evidence for task "${task.title}".`,
      type: NotificationType.TASK_EVIDENCE,
      relatedEntityType: 'TaskEvidence',
      relatedEntityId: evidenceId.toString()
    });
  });

  domainEventBus.on<EvidenceReviewedPayload>(DOMAIN_EVENTS.EVIDENCE_APPROVED, async (event) => {
    const { volunteerId, taskId, evidenceId } = event.payload;
    
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;

    await notificationService.createNotification({
      userId: volunteerId,
      title: 'Evidence Approved',
      message: `Your evidence for task "${task.title}" has been approved.`,
      type: NotificationType.TASK_EVIDENCE,
      relatedEntityType: 'TaskEvidence',
      relatedEntityId: evidenceId.toString()
    });
  });

  domainEventBus.on<EvidenceReviewedPayload>(DOMAIN_EVENTS.EVIDENCE_REJECTED, async (event) => {
    const { volunteerId, taskId, evidenceId, reviewNote } = event.payload;
    
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;

    await notificationService.createNotification({
      userId: volunteerId,
      title: 'Evidence Rejected',
      message: `Your evidence for task "${task.title}" has been rejected. ${reviewNote ? `Reason: ${reviewNote}` : ''}`,
      type: NotificationType.TASK_EVIDENCE,
      relatedEntityType: 'TaskEvidence',
      relatedEntityId: evidenceId.toString()
    });
  });
}

// Auto-initialize if imported.
registerNotificationHandlers();
