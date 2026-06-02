"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { requireRole } from "@/lib/auth/guards";
import { ParticipationService } from "@/domain/participation/participation.service";
import { ParticipationPrismaRepository } from "@/infrastructure/prisma/repositories/participation.prisma-repository";
import { prisma } from "@/lib/prisma";

const participationRepository = new ParticipationPrismaRepository();
const participationService = new ParticipationService(participationRepository);

export async function registerToEventAction(eventId: number) {
  try {
    const session = await requireRole(['VOLUNTEER', 'COORDINATOR', 'ADMIN']);
    
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId }
    });

    if (!volunteer) {
      return { success: false, error: "Perfil de voluntario no encontrado" };
    }

    const participation = await participationService.registerToEvent(eventId, volunteer.id);
    return { success: true, data: participation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelParticipationAction(eventId: number) {
  try {
    const session = await requireRole(['VOLUNTEER', 'COORDINATOR', 'ADMIN']);
    
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId }
    });

    if (!volunteer) {
      return { success: false, error: "Perfil de voluntario no encontrado" };
    }

    const participation = await participationService.unregisterFromEvent(eventId, volunteer.id);
    return { success: true, data: participation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAttendanceAction(eventId: number, volunteerId: number, attended: boolean) {
  try {
    const session = await requireRole(['ADMIN', 'COORDINATOR']);
    
    const participation = await participationService.markAttendance(eventId, volunteerId, attended, session.userId);
    return { success: true, data: participation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEventVolunteersAction(eventId: number) {
  try {
    await requireRole(['ADMIN', 'COORDINATOR']);
    const volunteers = await participationService.getEventVolunteers(eventId);
    return { success: true, data: volunteers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
