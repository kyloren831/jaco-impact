import { ParticipationStatus, EventStatus } from '@/generated/prisma/client';

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export class ParticipationPolicies {
  static canRegister(
    eventStatus: EventStatus,
    currentRegistrations: number,
    volunteersNeeded: number,
    existingParticipationStatus?: ParticipationStatus
  ): PolicyResult {
    if (eventStatus !== 'OPEN') {
      return { allowed: false, reason: 'El evento no está abierto para registros' };
    }
    
    if (existingParticipationStatus && existingParticipationStatus !== 'CANCELLED') {
      return { allowed: false, reason: 'Ya estás registrado en este evento' };
    }

    if (volunteersNeeded > 0 && currentRegistrations >= volunteersNeeded) {
      return { allowed: false, reason: 'El evento ha alcanzado su capacidad máxima' };
    }

    return { allowed: true };
  }

  static canUnregister(
    hasActiveAssignments: boolean,
    existingParticipationStatus?: ParticipationStatus
  ): PolicyResult {
    if (!existingParticipationStatus || existingParticipationStatus === 'CANCELLED') {
      return { allowed: false, reason: 'No estás registrado en este evento' };
    }

    if (hasActiveAssignments) {
      return { allowed: false, reason: 'No puedes cancelar tu participación porque tienes tareas asignadas. Cancela tus tareas primero.' };
    }

    return { allowed: true };
  }
}
