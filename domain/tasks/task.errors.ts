import { DomainError } from "@/domain/shared/domain-error";

export class TaskNotFoundError extends DomainError {
  constructor(id: number) {
    super("TASK_NOT_FOUND", `La tarea con id ${id} no fue encontrada.`, 404);
  }
}
