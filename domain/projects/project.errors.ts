import { DomainError } from "@/domain/shared/domain-error";

export class ProjectNotFoundError extends DomainError {
  constructor(id: number) {
    super("PROJECT_NOT_FOUND", `El proyecto con id ${id} no fue encontrado.`, 404);
  }
}

export class ProjectPillarNotFoundError extends DomainError {
  constructor() {
    super("PILLAR_NOT_FOUND", "El pilar asignado no existe.", 404);
  }
}

export class ProjectUnauthorizedActionError extends DomainError {
  constructor(message: string) {
    super("UNAUTHORIZED_ACTION", message, 403);
  }
}
