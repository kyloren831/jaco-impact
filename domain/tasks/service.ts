import { ITaskRepository } from "./task.repository";
import { TaskPrismaRepository } from "@/infrastructure/prisma/repositories/task.prisma-repository";
import { CreateTaskCommand, UpdateTaskCommand, TaskStatus } from "./task.types";
import { TaskNotFoundError } from "./task.errors";
import { withTransaction } from "@/lib/prisma";

export class TaskDomainService {
  constructor(private readonly repository: ITaskRepository = new TaskPrismaRepository()) {}

  async getTasksByEventId(eventId: number) {
    return this.repository.findByEventId(eventId);
  }

  async createTask(data: CreateTaskCommand) {
    return withTransaction(async (tx) => {
      return this.repository.create(data, tx);
    });
  }

  async updateTaskStatus(taskId: number, taskStatus: TaskStatus) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findById(taskId, tx);
      if (!existing) {
        throw new TaskNotFoundError(taskId);
      }
      return this.repository.updateStatus(taskId, taskStatus, tx);
    });
  }

  async updateTaskDetails(taskId: number, data: UpdateTaskCommand) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findById(taskId, tx);
      if (!existing) {
        throw new TaskNotFoundError(taskId);
      }
      return this.repository.updateDetails(taskId, data, tx);
    });
  }
}

export const taskDomainService = new TaskDomainService();
