import { IEventRepository } from './event.repository';
import { EventPrismaRepository } from '../../infrastructure/prisma/repositories/event.prisma-repository';
import { CreateEventDTO, UpdateEventDTO } from './event.types';
import { EventStatus, AssignmentStatus } from '../../generated/prisma/client';
import { eventStateMachine } from './event.state-machine';
import { EventNotFoundError, EventDateOutsideProjectError } from './event.errors';
import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS } from '../shared/events';
import { withTransaction } from '../../lib/prisma';
import { PaginationParams } from '../shared/types';
import { Prisma } from '../../generated/prisma/client';

export class EventDomainService {
  constructor(private readonly repository: IEventRepository = new EventPrismaRepository()) {}

  async getEventDetails(id: number) {
    return this.repository.findByIdWithParticipations(id);
  }

  async getAllEvents(pagination?: PaginationParams) {
    return this.repository.findAll(pagination);
  }

  async getEventsByProject(projectId: number) {
    return this.repository.findByProjectId(projectId);
  }

  async createEvent(data: CreateEventDTO, actorId: number) {
    return withTransaction(async (tx) => {
      // Validate dates against project
      const project = await tx.project.findUnique({ where: { id: data.projectId } });
      if (project) {
        const validateDate = (d?: Date | null) => {
          if (!d) return true;
          const dt = new Date(d).getTime();
          if (project.startDate && dt < new Date(project.startDate).setHours(0,0,0,0)) return false;
          if (project.endDate && dt > new Date(project.endDate).setHours(23,59,59,999)) return false;
          return true;
        };

        if (!validateDate(data.eventDate) || !validateDate(data.startDate) || !validateDate(data.endDate)) {
          throw new EventDateOutsideProjectError(data.projectId);
        }
      }

      // Create the event
      const event = await (this.repository as EventPrismaRepository).create(data, actorId, tx);

      // Emit EVENT_CREATED
      await domainEventBus.emit({
        type: DOMAIN_EVENTS.EVENT_CREATED,
        payload: { eventId: event.id },
        metadata: { actorId, timestamp: new Date(), correlationId: `create-event-${event.id}` }
      });

      return event;
    });
  }

  async updateEventStatus(id: number, newStatus: EventStatus, actorId: number) {
    return withTransaction(async (tx) => {
      const event = await (this.repository as EventPrismaRepository).findById(id, tx);
      if (!event) {
        throw new EventNotFoundError(id);
      }

      const previousStatus = event.status;

      // Validate transition
      eventStateMachine.transition(previousStatus, newStatus);

      // Update status
      const updatedEvent = await (this.repository as EventPrismaRepository).updateStatus(id, newStatus, tx);

      // If cancelled, cascade to task assignments
      if (newStatus === EventStatus.CANCELLED) {
        const assignments = await tx.taskAssignment.findMany({
          where: {
            eventId: id,
            status: { notIn: [AssignmentStatus.CANCELLED, AssignmentStatus.DECLINED] }
          }
        });

        if (assignments.length > 0) {
          await tx.taskAssignment.updateMany({
            where: {
              eventId: id,
              status: { notIn: [AssignmentStatus.CANCELLED, AssignmentStatus.DECLINED] }
            },
            data: { status: AssignmentStatus.CANCELLED }
          });

          // Emit ASSIGNMENT_CANCELLED for each
          for (const assignment of assignments) {
            await domainEventBus.emit({
              metadata: { timestamp: new Date(), actorId },
              type: DOMAIN_EVENTS.ASSIGNMENT_CANCELLED,
              payload: {
                taskId: assignment.taskId,
                volunteerId: assignment.volunteerId,
                eventId: id,
                actorId,
                previousStatus: assignment.status,
                newStatus: AssignmentStatus.CANCELLED
              }
            });
          }
        }
      }

      // Emit EVENT_STATUS_CHANGED
      await domainEventBus.emit({
        type: DOMAIN_EVENTS.EVENT_STATUS_CHANGED,
        payload: {
          eventId: updatedEvent.id,
          previousStatus,
          newStatus,
          actorId,
        },
        metadata: { actorId, timestamp: new Date(), correlationId: `status-event-${updatedEvent.id}` }
      });

      // Emit EVENT_CANCELLED if transitioning to CANCELLED
      if (newStatus === EventStatus.CANCELLED) {
        await domainEventBus.emit({
          type: DOMAIN_EVENTS.EVENT_CANCELLED,
          payload: { eventId: updatedEvent.id, actorId },
          metadata: { actorId, timestamp: new Date(), correlationId: `cancel-event-${updatedEvent.id}` }
        });
      }

      return updatedEvent;
    });
  }

  async updateEventDetails(id: number, data: UpdateEventDTO, actorId: number) {
    return withTransaction(async (tx) => {
      const event = await (this.repository as EventPrismaRepository).findById(id, tx);
      if (!event) {
        throw new EventNotFoundError(id);
      }

      // Validate dates against project
      const project = await tx.project.findUnique({ where: { id: event.projectId } });
      if (project) {
        const validateDate = (d?: Date | null) => {
          if (!d) return true;
          const dt = new Date(d).getTime();
          if (project.startDate && dt < new Date(project.startDate).setHours(0,0,0,0)) return false;
          if (project.endDate && dt > new Date(project.endDate).setHours(23,59,59,999)) return false;
          return true;
        };

        const checkEventDate = data.eventDate !== undefined ? data.eventDate : event.eventDate;
        const checkStartDate = data.startDate !== undefined ? data.startDate : event.startDate;
        const checkEndDate = data.endDate !== undefined ? data.endDate : event.endDate;

        if (!validateDate(checkEventDate) || !validateDate(checkStartDate) || !validateDate(checkEndDate)) {
          throw new EventDateOutsideProjectError(event.projectId);
        }
      }

      const updatedEvent = await (this.repository as EventPrismaRepository).updateDetails(id, data, tx);

      // Emit EVENT_UPDATED
      await domainEventBus.emit({
        type: DOMAIN_EVENTS.EVENT_UPDATED,
        payload: { eventId: updatedEvent.id, actorId, updates: data },
        metadata: { actorId, timestamp: new Date(), correlationId: `update-event-${updatedEvent.id}` }
      });

      return updatedEvent;
    });
  }
}
