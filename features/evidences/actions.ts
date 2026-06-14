"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { evidenceService } from "@/domain/evidences/service";
import { withAuth, withRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getPresignedUploadUrl } from "@/lib/storage/r2";

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

    // Verify volunteer is active/registered for the event of the target task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { eventId: true },
    });

    if (!task) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    const participation = await prisma.eventParticipation.findUnique({
      where: {
        eventId_volunteerId: {
          eventId: task.eventId,
          volunteerId: volunteer.id,
        },
      },
    });

    if (!participation || participation.status === 'CANCELLED') {
      return { success: false, error: 'No tienes acceso a las tareas de este evento o no estás inscrito.' };
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

export const getPresignedUploadUrlAction = withRole('VOLUNTEER', async (
  payload,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }> => {
  try {
    const ALLOWED_MIME_TYPES = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "video/mp4", "video/webm", "video/ogg", "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain"
    ];

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return { success: false, error: "Tipo de archivo no permitido" };
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });

    if (!volunteer) {
      return { success: false, error: 'El usuario no está registrado como voluntario' };
    }

    const data = await getPresignedUploadUrl(fileName, fileType);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
