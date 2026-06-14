import { withTransaction } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { assignmentStateMachine } from './state';
import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS } from '../shared/events';
import { AssignmentStatus, TaskStatus } from '../../generated/prisma/enums';

export class AssignmentService {
  async assignTask(taskId: number, volunteerId: number, assignedBy: number, eventId?: number) {
    return withTransaction(async (tx) => {
      let finalEventId = eventId;
      let taskTitle = "";
      let eventName = "";

      if (!finalEventId) {
        const task = await tx.task.findUniqueOrThrow({
          where: { id: taskId },
          include: { event: true }
        });
        finalEventId = task.eventId;
        taskTitle = task.title;
        eventName = task.event.name;
      } else {
        const task = await tx.task.findUniqueOrThrow({
          where: { id: taskId },
          include: { event: true }
        });
        taskTitle = task.title;
        eventName = task.event.name;
      }

      // Check if EventParticipation exists for the given eventId and volunteerId
      const participation = await tx.eventParticipation.findUnique({
        where: {
          eventId_volunteerId: {
            eventId: finalEventId,
            volunteerId
          }
        }
      });

      if (!participation) {
        throw new Error("El voluntario debe estar inscrito en el evento antes de ser asignado a la tarea.");
      }

      // Upsert to handle re-assignments
      const assignment = await tx.taskAssignment.upsert({
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

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, assignedBy);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId: assignedBy },
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
    });
  }

  async acceptAssignment(taskId: number, volunteerId: number, actorId: number) {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUniqueOrThrow({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });

      const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.ACCEPTED);

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: newStatus, acceptedAt: new Date() }
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, actorId);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
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

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
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
    });
  }

  async declineAssignment(taskId: number, volunteerId: number, actorId: number, reason?: string) {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUniqueOrThrow({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });

      const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.DECLINED);

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: newStatus, declinedAt: new Date(), declineReason: reason }
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, actorId);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
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

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
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
    });
  }

  async startAssignment(taskId: number, volunteerId: number, actorId: number) {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUniqueOrThrow({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });

      const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.IN_PROGRESS);

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: newStatus, startedAt: new Date() }
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, actorId);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
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

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
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
    });
  }

  async submitAssignment(taskId: number, volunteerId: number, actorId: number, note?: string) {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUniqueOrThrow({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });

      const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.SUBMITTED);

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: newStatus, submittedAt: new Date(), completionNote: note }
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, actorId);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
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

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
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
    });
  }

  async reviewAssignment(taskId: number, volunteerId: number, actorId: number, decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUniqueOrThrow({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });

      let tempStatus = current.status;
      if (tempStatus === AssignmentStatus.SUBMITTED) {
        tempStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus.UNDER_REVIEW);
        await tx.taskAssignment.update({
          where: { taskId_volunteerId: { taskId, volunteerId } },
          data: { status: tempStatus }
        });
      }

      const newStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus[decision]);

      const dataToUpdate: any = { status: newStatus };
      if (decision === 'APPROVED') {
        dataToUpdate.completedAt = new Date();
      }

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: dataToUpdate
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, actorId);

      const eventType = decision === 'APPROVED' ? DOMAIN_EVENTS.ASSIGNMENT_APPROVED :
                        decision === 'REVISION_REQUESTED' ? DOMAIN_EVENTS.ASSIGNMENT_REVISION_REQUESTED : null;

      if (eventType) {
        await domainEventBus.emit({
          metadata: { timestamp: new Date(), actorId },
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

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
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
    });
  }

  async removeAssignment(taskId: number, volunteerId: number, actorId: number) {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUnique({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });
      if (!current) return;

      const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.CANCELLED);

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: newStatus }
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx, actorId);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
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

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
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
    });
  }

  public async checkAndDeriveTaskStatus(taskId: number, tx: Prisma.TransactionClient, actorId: number) {
    // Add PostgreSQL row locking to serialize status derivation checks on the same task
    await tx.$executeRaw`SELECT 1 FROM tasks WHERE id = ${taskId} FOR UPDATE`;

    // 1. Fetch all assignments for this task
    const assignments = await tx.taskAssignment.findMany({
      where: { taskId }
    });

    // 2. Identify active assignments (not DECLINED and not CANCELLED)
    const activeAssignments = assignments.filter(
      (a) => a.status !== AssignmentStatus.DECLINED && a.status !== AssignmentStatus.CANCELLED
    );

    // If there are no active assignments, do not modify task status.
    if (activeAssignments.length === 0) {
      return;
    }

    // 3. Check if all active assignments are SUBMITTED, UNDER_REVIEW, or APPROVED
    const allSubmittedOrReviewed = activeAssignments.every(
      (a) =>
        a.status === AssignmentStatus.SUBMITTED ||
        a.status === AssignmentStatus.UNDER_REVIEW ||
        a.status === AssignmentStatus.APPROVED
    );

    if (allSubmittedOrReviewed) {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { taskStatus: true }
      });

      if (task && task.taskStatus !== TaskStatus.IN_REVIEW) {
        await tx.task.update({
          where: { id: taskId },
          data: { taskStatus: TaskStatus.IN_REVIEW }
        });

        await domainEventBus.emit({
          metadata: { timestamp: new Date(), actorId },
          type: DOMAIN_EVENTS.TASK_STATUS_DERIVED,
          payload: {
            taskId,
            newStatus: TaskStatus.IN_REVIEW
          }
        });
      }
    } else {
      // Revert to IN_PROGRESS if a revision is requested or new assignments open
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { taskStatus: true }
      });

      if (task && (task.taskStatus === TaskStatus.IN_REVIEW || task.taskStatus === TaskStatus.OPEN)) {
        await tx.task.update({
          where: { id: taskId },
          data: { taskStatus: TaskStatus.IN_PROGRESS }
        });

        await domainEventBus.emit({
          metadata: { timestamp: new Date(), actorId },
          type: DOMAIN_EVENTS.TASK_STATUS_DERIVED,
          payload: {
            taskId,
            newStatus: TaskStatus.IN_PROGRESS
          }
        });
      }
    }
  }
}
