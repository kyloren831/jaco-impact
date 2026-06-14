import { prisma, withTransaction } from "@/lib/prisma";
import { uploadFileToR2 } from "@/lib/storage/r2";
import { domainEventBus } from "@/domain/shared/domain-event-bus";
import { FileType, ReviewStatus, AssignmentStatus } from "@/generated/prisma/client";
import { AssignmentService } from "@/domain/assignments/service";
import { assignmentStateMachine } from "@/domain/assignments/state";
import { DOMAIN_EVENTS } from "@/domain/shared/events";

const assignmentService = new AssignmentService();

function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('application/pdf') || mimeType.includes('document')) return 'DOCUMENT';
  return 'OTHER';
}

export type SubmitEvidenceInput = {
  taskId: number;
  volunteerId: number;
  actorId: number;
  file: File;
  description?: string;
};

export type ReviewEvidenceInput = {
  evidenceId: number;
  reviewerId: number;
  status: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
};

export class EvidenceService {
  /**
   * Submits new evidence for a task assignment.
   */
  async submitEvidence(input: SubmitEvidenceInput) {
    const { taskId, volunteerId, actorId, file, description } = input;

    // Validate the assignment exists
    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_volunteerId: { taskId, volunteerId }
      }
    });

    if (!assignment) {
      throw new Error(`Assignment not found for task ${taskId} and volunteer ${volunteerId}`);
    }

    // Check state transition
    const newStatus = assignmentStateMachine.transition(assignment.status, AssignmentStatus.SUBMITTED);

    // Upload file to R2
    const fileUrl = await uploadFileToR2(file, 'evidences');
    const fileType = getFileType(file.type);

    return withTransaction(async (tx) => {
      // 1. Create Evidence
      const evidence = await tx.taskEvidence.create({
        data: {
          taskId,
          volunteerId,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType,
          description,
          status: 'PENDING',
        }
      });

      // 2. Update Assignment Status
      await tx.taskAssignment.update({
        where: {
          taskId_volunteerId: { taskId, volunteerId }
        },
        data: {
          status: newStatus,
          submittedAt: new Date(),
        }
      });

      await domainEventBus.emit({
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: assignment.eventId,
          actorId,
          previousStatus: assignment.status,
          newStatus
        },
        metadata: {
          actorId,
          timestamp: new Date()
        }
      });

      // Recalculate parent Task status atomically
      await assignmentService.checkAndDeriveTaskStatus(taskId, tx, actorId);

      // 3. Emit Domain Event
      await domainEventBus.emit({
        type: 'EVIDENCE_SUBMITTED',
        payload: {
          evidenceId: evidence.id,
          taskId: evidence.taskId,
          volunteerId: evidence.volunteerId,
          eventId: assignment.eventId,
          fileType: evidence.fileType,
        },
        metadata: {
          actorId,
          timestamp: new Date()
        }
      });

      return evidence;
    });
  }

  /**
   * Reviews existing evidence.
   */
  async reviewEvidence(input: ReviewEvidenceInput) {
    const { evidenceId, reviewerId, status, reviewNote } = input;

    const existing = await prisma.taskEvidence.findUnique({
      where: { id: evidenceId },
      include: { assignment: true }
    });

    if (!existing) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    return withTransaction(async (tx) => {
      let currentStatus = existing.assignment.status;
      if (currentStatus === AssignmentStatus.SUBMITTED) {
        currentStatus = assignmentStateMachine.transition(currentStatus, AssignmentStatus.UNDER_REVIEW);
      }
      const targetStatus = status === 'APPROVED' ? AssignmentStatus.APPROVED : AssignmentStatus.REVISION_REQUESTED;
      const derivedStatus = assignmentStateMachine.transition(currentStatus, targetStatus);

      // 1. Update Evidence Status
      const evidence = await tx.taskEvidence.update({
        where: { id: evidenceId },
        data: {
          status,
          reviewBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote,
        }
      });

      // 2. Update Assignment Status based on the review outcome
      await tx.taskAssignment.update({
        where: {
          taskId_volunteerId: {
            taskId: evidence.taskId,
            volunteerId: evidence.volunteerId
          }
        },
        data: {
          status: derivedStatus,
        }
      });

      await domainEventBus.emit({
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId: evidence.taskId,
          volunteerId: evidence.volunteerId,
          eventId: existing.assignment.eventId,
          actorId: reviewerId,
          previousStatus: existing.assignment.status,
          newStatus: derivedStatus
        },
        metadata: {
          actorId: reviewerId,
          timestamp: new Date()
        }
      });

      // Recalculate parent Task status atomically
      await assignmentService.checkAndDeriveTaskStatus(evidence.taskId, tx, reviewerId);

      // 3. Emit Domain Event
      const eventType = status === 'APPROVED' ? 'EVIDENCE_APPROVED' : 'EVIDENCE_REJECTED';
      
      await domainEventBus.emit({
        type: eventType,
        payload: {
          evidenceId: evidence.id,
          taskId: evidence.taskId,
          volunteerId: evidence.volunteerId,
          eventId: existing.assignment.eventId,
          decision: status,
          reviewedBy: reviewerId,
          reviewNote: reviewNote
        },
        metadata: {
          actorId: reviewerId,
          timestamp: new Date()
        }
      });

      return evidence;
    });
  }
}

export const evidenceService = new EvidenceService();
