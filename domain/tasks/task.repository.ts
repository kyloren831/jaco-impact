import type { Task, CreateTaskCommand, UpdateTaskCommand, TaskStatus } from "./task.types";

export interface ITaskRepository {
  findById(id: number, tx?: any): Promise<Task | null>;
  findByEventId(eventId: number, tx?: any): Promise<any[]>;
  create(data: CreateTaskCommand, tx?: any): Promise<Task>;
  updateStatus(id: number, status: TaskStatus, tx?: any): Promise<Task>;
  updateDetails(id: number, data: UpdateTaskCommand, tx?: any): Promise<any>;
}
