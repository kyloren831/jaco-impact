import { IParticipationRepository } from './participation.repository';
import { ParticipationPolicies } from './participation.policies';
import { 
  EventCapacityExceededError, 
  AlreadyRegisteredError, 
  NotRegisteredError, 
  ActiveAssignmentsExistError, 
  EventNotOpenError 
} from './participation.errors';
import { EntityNotFoundError } from '../shared/domain-error';
import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS } from '../shared/events';
import { withTransaction } from '@/lib/prisma';
import { EventParticipation } from '@/generated/prisma/client';

export class ParticipationService {
  constructor(
    private readonly repository: IParticipationRepository
  ) {}

  async registerToEvent(eventId: number, volunteerId: number): Promise<EventParticipation> {
    const result = await withTransaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { status: true, volunteersNeeded: true, name: true }
      });

      if (!event) {
        throw new EntityNotFoundError('Event', eventId);
      }

      const volunteer = await tx.volunteer.findUnique({
        where: { id: volunteerId },
        include: { user: true }
      });

      if (!volunteer) {
        throw new EntityNotFoundError('Volunteer', volunteerId);
      }

      const existingParticipation = await this.repository.findByEventAndVolunteer(eventId, volunteerId, tx);
      const currentRegistrations = await this.repository.countByEvent(eventId, tx);

      const policyCheck = ParticipationPolicies.canRegister(
        event.status,
        currentRegistrations,
        event.volunteersNeeded,
        existingParticipation?.status
      );

      if (!policyCheck.allowed) {
        if (policyCheck.reason === 'El evento no está abierto para registros') throw new EventNotOpenError(eventId);
        if (policyCheck.reason === 'Ya estás registrado en este evento') throw new AlreadyRegisteredError(eventId, volunteerId);
        if (policyCheck.reason === 'El evento ha alcanzado su capacidad máxima') throw new EventCapacityExceededError(eventId);
        throw new Error(policyCheck.reason);
      }

      const participation = await this.repository.register(eventId, volunteerId, tx);

      // Create ActivityLog
      await tx.activityLog.create({
        data: {
          actorId: volunteer.userId,
          actorType: 'USER',
          action: 'REGISTERED',
          entityType: 'EventParticipation',
          entityId: volunteerId,
          eventId: eventId,
          newState: { status: 'REGISTERED' }
        }
      });

      return { participation, event, volunteer };
    });

    // Emit domain event
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.VOLUNTEER_REGISTERED,
      payload: {
        eventId,
        volunteerId,
        eventName: result.event.name,
        volunteerName: result.volunteer.user.name
      },
      metadata: {
        actorId: result.volunteer.userId,
        timestamp: new Date(),
        correlationId: `register-${eventId}-${volunteerId}`
      }
    });

    return result.participation;
  }

  async unregisterFromEvent(eventId: number, volunteerId: number): Promise<EventParticipation> {
    const result = await withTransaction(async (tx) => {
      const existingParticipation = await this.repository.findByEventAndVolunteer(eventId, volunteerId, tx);
      const hasActiveAssignments = await this.repository.hasActiveAssignments(eventId, volunteerId, tx);
      
      const volunteer = await tx.volunteer.findUnique({
        where: { id: volunteerId },
        include: { user: true }
      });

      if (!volunteer) {
        throw new EntityNotFoundError('Volunteer', volunteerId);
      }

      const policyCheck = ParticipationPolicies.canUnregister(
        hasActiveAssignments,
        existingParticipation?.status
      );

      if (!policyCheck.allowed) {
        if (policyCheck.reason === 'No estás registrado en este evento') throw new NotRegisteredError(eventId, volunteerId);
        if (policyCheck.reason?.includes('tareas asignadas')) throw new ActiveAssignmentsExistError(eventId, volunteerId);
        throw new Error(policyCheck.reason);
      }

      const participation = await this.repository.updateStatus(eventId, volunteerId, 'CANCELLED', tx);

      // Create ActivityLog
      await tx.activityLog.create({
        data: {
          actorId: volunteer.userId,
          actorType: 'USER',
          action: 'UNREGISTERED',
          entityType: 'EventParticipation',
          entityId: volunteerId,
          eventId: eventId,
          newState: { status: 'CANCELLED' },
          previousState: { status: existingParticipation?.status }
        }
      });

      return { participation, volunteer };
    });

    // Emit domain event
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.VOLUNTEER_UNREGISTERED,
      payload: {
        eventId,
        volunteerId
      },
      metadata: {
        actorId: result.volunteer.userId,
        timestamp: new Date(),
        correlationId: `unregister-${eventId}-${volunteerId}`
      }
    });

    return result.participation;
  }

  async markAttendance(eventId: number, volunteerId: number, attended: boolean, actorId: number): Promise<EventParticipation> {
    const result = await withTransaction(async (tx) => {
      const existingParticipation = await this.repository.findByEventAndVolunteer(eventId, volunteerId, tx);
      
      if (!existingParticipation || existingParticipation.status === 'CANCELLED') {
        throw new NotRegisteredError(eventId, volunteerId);
      }

      const newStatus = attended ? 'ATTENDED' : 'ABSENT';
      const participation = await this.repository.updateStatus(eventId, volunteerId, newStatus, tx);

      // Create ActivityLog
      await tx.activityLog.create({
        data: {
          actorId: actorId,
          actorType: 'USER',
          action: 'STATUS_CHANGED',
          entityType: 'EventParticipation',
          entityId: volunteerId,
          eventId: eventId,
          newState: { status: newStatus },
          previousState: { status: existingParticipation.status }
        }
      });

      return { participation, newStatus };
    });

    await domainEventBus.emit({
      type: DOMAIN_EVENTS.ATTENDANCE_MARKED,
      payload: {
        eventId,
        volunteerId,
        status: result.newStatus
      },
      metadata: {
        actorId,
        timestamp: new Date(),
        correlationId: `attendance-${eventId}-${volunteerId}`
      }
    });

    return result.participation;
  }

  async getEventVolunteers(eventId: number) {
    return this.repository.getEventVolunteers(eventId);
  }
}
