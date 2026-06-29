import { IEventRepository } from './event.repository';
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
  constructor(private readonly repository: IEventRepository) {}

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
    const result = await withTransaction(async (tx) => {
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
      const event = await this.repository.create(data, actorId, tx);
      return event;
    });

    // Emit EVENT_CREATED
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.EVENT_CREATED,
      payload: { eventId: result.id },
      metadata: { actorId, timestamp: new Date(), correlationId: `create-event-${result.id}` }
    });

    return result;
  }

  async updateEventStatus(id: number, newStatus: EventStatus, actorId: number) {
    const result = await withTransaction(async (tx) => {
      const event = await this.repository.findById(id, tx);
      if (!event) {
        throw new EventNotFoundError(id);
      }

      const previousStatus = event.status;

      // Validate transition
      eventStateMachine.transition(previousStatus, newStatus);

      // Update status
      const updatedEvent = await this.repository.updateStatus(id, newStatus, tx);

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
        }
      }

      return { updatedEvent, previousStatus, assignmentsToCancel: newStatus === EventStatus.CANCELLED ? await tx.taskAssignment.findMany({
          where: {
            eventId: id,
            status: { notIn: [AssignmentStatus.CANCELLED, AssignmentStatus.DECLINED] }
          }
        }) : [] };
    });

    if (newStatus === EventStatus.CANCELLED && result.assignmentsToCancel.length > 0) {
      await Promise.all(result.assignmentsToCancel.map(assignment => 
        domainEventBus.emit({
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
        })
      ));
    }

    // Emit EVENT_STATUS_CHANGED
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.EVENT_STATUS_CHANGED,
      payload: {
        eventId: result.updatedEvent.id,
        previousStatus: result.previousStatus,
        newStatus,
        actorId,
      },
      metadata: { actorId, timestamp: new Date(), correlationId: `status-event-${result.updatedEvent.id}` }
    });

    // Emit EVENT_CANCELLED if transitioning to CANCELLED
    if (newStatus === EventStatus.CANCELLED) {
      await domainEventBus.emit({
        type: DOMAIN_EVENTS.EVENT_CANCELLED,
        payload: { eventId: result.updatedEvent.id, actorId },
        metadata: { actorId, timestamp: new Date(), correlationId: `cancel-event-${result.updatedEvent.id}` }
      });
    }

    return result.updatedEvent;
  }

  async updateEventDetails(id: number, data: UpdateEventDTO, actorId: number) {
    const result = await withTransaction(async (tx) => {
      const event = await this.repository.findById(id, tx);
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

      const updatedEvent = await this.repository.updateDetails(id, data, tx);
      return updatedEvent;
    });

    // Emit EVENT_UPDATED
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.EVENT_UPDATED,
      payload: { eventId: result.id, actorId, updates: data },
      metadata: { actorId, timestamp: new Date(), correlationId: `update-event-${result.id}` }
    });

    return result;
  }
}
