import { DomainError } from "../shared/domain-error";

export class PillarCoordinatorNotFoundError extends DomainError {
  constructor() {
    super("COORDINATOR_NOT_FOUND", "El coordinador asignado no existe.", 404);
  }
}

export class PillarCoordinatorAlreadyAssignedError extends DomainError {
  constructor() {
    super("COORDINATOR_ALREADY_ASSIGNED", "Este coordinador ya está asignado a otro pilar.", 400);
  }
}

export class PillarNotFoundError extends DomainError {
  constructor(id: number) {
    super("PILLAR_NOT_FOUND", `El pilar con id ${id} no fue encontrado.`, 404);
  }
}
