"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { evidenceService } from "@/domain/evidences/service";
import { withAuth, withRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const submitEvidenceAction = withAuth(async (payload, formData: FormData) => {
  try {
    const taskIdStr = formData.get('taskId');
    const file = formData.get('file') as File | null;
    const descriptionStr = formData.get('description');

    if (!taskIdStr || !file) {
      return { success: false, error: 'Falta taskId o el archivo' };
    }

    const taskId = parseInt(taskIdStr.toString(), 10);
    const description = descriptionStr ? descriptionStr.toString() : undefined;

    // Lookup volunteer id for the authenticated user
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });

    if (!volunteer) {
      return { success: false, error: 'El usuario no está registrado como voluntario' };
    }

    const evidence = await evidenceService.submitEvidence({
      taskId,
      volunteerId: volunteer.id,
      actorId: payload.userId,
      file,
      description,
    });

    return { success: true, data: evidence };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const reviewEvidenceAction = withRole(['ADMIN', 'COORDINATOR'], async (
  payload,
  evidenceId: number, 
  status: 'APPROVED' | 'REJECTED', 
  reviewNote?: string
) => {
  try {
    const evidence = await evidenceService.reviewEvidence({
      evidenceId,
      reviewerId: payload.userId,
      status,
      reviewNote,
    });

    return { success: true, data: evidence };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
