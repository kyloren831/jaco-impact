import { DomainError } from "@/domain/shared/domain-error";

export class VolunteerEmailAlreadyExistsError extends DomainError {
  constructor() {
    super("EMAIL_ALREADY_EXISTS", "El correo ya está registrado.", 400);
  }
}
