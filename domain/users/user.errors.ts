import { DomainError } from "@/domain/shared/domain-error";

export class UserEmailAlreadyExistsError extends DomainError {
  constructor() {
    super("EMAIL_ALREADY_EXISTS", "El correo ya está registrado.", 400);
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super("USER_NOT_FOUND", "Usuario no encontrado.", 404);
  }
}

export class UserRoleNotAssignedError extends DomainError {
  constructor() {
    super("ROLE_NOT_ASSIGNED", "Rol no asignado al usuario.", 400);
  }
}
