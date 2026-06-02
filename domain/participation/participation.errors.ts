import { DomainError } from '../shared/domain-error';

export class EventCapacityExceededError extends DomainError {
  constructor(eventId: number) {
    super('CAPACITY_EXCEEDED', `Event ${eventId} has reached its maximum capacity.`, 422);
  }
}

export class AlreadyRegisteredError extends DomainError {
  constructor(eventId: number, volunteerId: number) {
    super('ALREADY_REGISTERED', `Volunteer ${volunteerId} is already registered for event ${eventId}.`, 422);
  }
}

export class NotRegisteredError extends DomainError {
  constructor(eventId: number, volunteerId: number) {
    super('NOT_REGISTERED', `Volunteer ${volunteerId} is not registered for event ${eventId}.`, 404);
  }
}

export class ActiveAssignmentsExistError extends DomainError {
  constructor(eventId: number, volunteerId: number) {
    super('ACTIVE_ASSIGNMENTS_EXIST', `Volunteer ${volunteerId} cannot unregister from event ${eventId} because they have active assignments.`, 422);
  }
}

export class EventNotOpenError extends DomainError {
  constructor(eventId: number) {
    super('EVENT_NOT_OPEN', `Event ${eventId} is not open for registration.`, 422);
  }
}
