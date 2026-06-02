import { prisma } from '@/lib/prisma';
import { assignmentStateMachine } from './state';
import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS } from '../shared/events';
import { AssignmentStatus } from '../../generated/prisma/enums';

export class AssignmentService {
  async assignTask(taskId: number, volunteerId: number, assignedBy: number, eventId?: number) {
    let finalEventId = eventId;
    let taskTitle = "";
    let eventName = "";

    if (!finalEventId) {
      const task = await prisma.task.findUniqueOrThrow({
        where: { id: taskId },
        include: { event: true }
      });
      finalEventId = task.eventId;
      taskTitle = task.title;
      eventName = task.event.name;
    } else {
      const task = await prisma.task.findUniqueOrThrow({
        where: { id: taskId },
        include: { event: true }
      });
      taskTitle = task.title;
      eventName = task.event.name;
    }

    // Upsert to handle re-assignments
    const assignment = await prisma.taskAssignment.upsert({
      where: {
        taskId_volunteerId: { taskId, volunteerId }
      },
      update: {
        status: AssignmentStatus.PENDING_ACCEPTANCE,
        assignedBy,
        assignedAt: new Date()
      },
      create: {
        taskId,
        volunteerId,
        eventId: finalEventId,
        assignedBy,
        status: AssignmentStatus.PENDING_ACCEPTANCE
      }
    });

    await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
      type: DOMAIN_EVENTS.TASK_ASSIGNED,
      payload: {
        taskId,
        volunteerId,
        eventId: finalEventId,
        assignedBy,
        taskTitle,
        eventName
      }
    });

    return assignment;
  }

  async acceptAssignment(taskId: number, volunteerId: number, actorId: number) {
    const current = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId, volunteerId } }
    });

    const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.ACCEPTED);

    const updated = await prisma.taskAssignment.update({
      where: { taskId_volunteerId: { taskId, volunteerId } },
      data: { status: newStatus, acceptedAt: new Date() }
    });

    await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
      type: DOMAIN_EVENTS.ASSIGNMENT_ACCEPTED,
      payload: {
        taskId,
        volunteerId,
        eventId: current.eventId,
        actorId,
        previousStatus: current.status,
        newStatus
      }
    });

    return updated;
  }

  async declineAssignment(taskId: number, volunteerId: number, actorId: number, reason?: string) {
    const current = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId, volunteerId } }
    });

    const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.DECLINED);

    const updated = await prisma.taskAssignment.update({
      where: { taskId_volunteerId: { taskId, volunteerId } },
      data: { status: newStatus, declinedAt: new Date(), declineReason: reason }
    });

    await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
      type: DOMAIN_EVENTS.ASSIGNMENT_DECLINED,
      payload: {
        taskId,
        volunteerId,
        eventId: current.eventId,
        actorId,
        previousStatus: current.status,
        newStatus,
        reason
      }
    });

    return updated;
  }

  async startAssignment(taskId: number, volunteerId: number, actorId: number) {
    const current = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId, volunteerId } }
    });

    const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.IN_PROGRESS);

    const updated = await prisma.taskAssignment.update({
      where: { taskId_volunteerId: { taskId, volunteerId } },
      data: { status: newStatus, startedAt: new Date() }
    });

    await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
      type: DOMAIN_EVENTS.ASSIGNMENT_STARTED,
      payload: {
        taskId,
        volunteerId,
        eventId: current.eventId,
        actorId,
        previousStatus: current.status,
        newStatus
      }
    });

    return updated;
  }

  async submitAssignment(taskId: number, volunteerId: number, actorId: number, note?: string) {
    const current = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId, volunteerId } }
    });

    const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.SUBMITTED);

    const updated = await prisma.taskAssignment.update({
      where: { taskId_volunteerId: { taskId, volunteerId } },
      data: { status: newStatus, submittedAt: new Date(), completionNote: note }
    });

    await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
      type: DOMAIN_EVENTS.ASSIGNMENT_SUBMITTED,
      payload: {
        taskId,
        volunteerId,
        eventId: current.eventId,
        actorId,
        previousStatus: current.status,
        newStatus
      }
    });

    return updated;
  }

  async reviewAssignment(taskId: number, volunteerId: number, actorId: number, decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') {
    const current = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId, volunteerId } }
    });

    // In a real flow, it might need to go from SUBMITTED to UNDER_REVIEW first.
    // For simplicity, let's allow transition from current status directly or via UNDER_REVIEW if the state machine allows it.
    // Let's assume the client might call this directly from SUBMITTED, we need to transition to UNDER_REVIEW first, or just transition to decision.
    // Wait, the state machine requires: SUBMITTED -> UNDER_REVIEW -> (REVISION_REQUESTED | APPROVED | REJECTED).
    let tempStatus = current.status;
    if (tempStatus === AssignmentStatus.SUBMITTED) {
      tempStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus.UNDER_REVIEW);
      await prisma.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: tempStatus }
      });
    }

    const newStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus[decision]);

    const dataToUpdate: any = { status: newStatus };
    if (decision === 'APPROVED') {
      dataToUpdate.completedAt = new Date();
    }

    const updated = await prisma.taskAssignment.update({
      where: { taskId_volunteerId: { taskId, volunteerId } },
      data: dataToUpdate
    });

    const eventMap = {
      'APPROVED': DOMAIN_EVENTS.ASSIGNMENT_APPROVED,
      'REJECTED': DOMAIN_EVENTS.ASSIGNMENT_DECLINED, // Using DECLINED as fallback or create a new one. The events file doesn't have ASSIGNMENT_REJECTED?
      'REVISION_REQUESTED': DOMAIN_EVENTS.ASSIGNMENT_REVISION_REQUESTED
    };

    // domain/shared/events.ts defines ASSIGNMENT_APPROVED, ASSIGNMENT_REVISION_REQUESTED but no ASSIGNMENT_REJECTED.
    // I will use ASSIGNMENT_DECLINED or just ASSIGNMENT_STATUS_CHANGED if it existed. Actually DOMAIN_EVENTS has nothing for REJECTED, but has EVIDENCE_REJECTED. Wait, let's just emit DOMAIN_EVENTS.TASK_STATUS_DERIVED or something, or avoid emitting if it's REJECTED unless it's in the list. Wait, there is no ASSIGNMENT_REJECTED in DOMAIN_EVENTS. I will omit emitting for REJECTED or just use TASK_STATUS_DERIVED. Let's look at DOMAIN_EVENTS again.

    const eventType = decision === 'APPROVED' ? DOMAIN_EVENTS.ASSIGNMENT_APPROVED :
                      decision === 'REVISION_REQUESTED' ? DOMAIN_EVENTS.ASSIGNMENT_REVISION_REQUESTED : null;

    if (eventType) {
      await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
        type: eventType,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });
    }

    return updated;
  }

  async removeAssignment(taskId: number, volunteerId: number, actorId: number) {
    const current = await prisma.taskAssignment.findUnique({
      where: { taskId_volunteerId: { taskId, volunteerId } }
    });
    if (!current) return;

    // We can either delete it or mark as CANCELLED
    const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.CANCELLED);

    const updated = await prisma.taskAssignment.update({
      where: { taskId_volunteerId: { taskId, volunteerId } },
      data: { status: newStatus }
    });

    await domainEventBus.emit({ metadata: { timestamp: new Date(), actorId: 1 },
      type: DOMAIN_EVENTS.ASSIGNMENT_CANCELLED,
      payload: {
        taskId,
        volunteerId,
        eventId: current.eventId,
        actorId,
        previousStatus: current.status,
        newStatus
      }
    });

    return updated;
  }
}
