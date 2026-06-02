export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super(
      'INVALID_TRANSITION',
      `Cannot transition ${entity} from ${from} to ${to}.`,
      422
    );
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string | number) {
    super('NOT_FOUND', `${entity} with id ${id} was not found.`, 404);
  }
}

export class UnauthorizedActionError extends DomainError {
  constructor(message: string = 'You are not authorized to perform this action.') {
    super('UNAUTHORIZED', message, 403);
  }
}

export class ValidationDomainError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}
