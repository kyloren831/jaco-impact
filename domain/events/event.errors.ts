import { DomainError } from '../shared/domain-error';

export class EventNotFoundError extends DomainError {
  constructor(eventId: number) {
    super('EVENT_NOT_FOUND', `Event with id ${eventId} was not found.`, 404);
  }
}

export class EventNotOpenError extends DomainError {
  constructor(eventId: number) {
    super('EVENT_NOT_OPEN', `Event with id ${eventId} is not currently open for participation.`, 422);
  }
}

export class EventCapacityExceededError extends DomainError {
  constructor(eventId: number) {
    super('EVENT_CAPACITY_EXCEEDED', `Event with id ${eventId} has reached its maximum capacity.`, 422);
  }
export class EventDateOutsideProjectError extends DomainError {
  constructor(projectId: number) {
    super('EVENT_DATE_OUTSIDE_PROJECT', `La fecha del evento debe estar dentro del rango de fechas del proyecto.`, 422);
  }
}
