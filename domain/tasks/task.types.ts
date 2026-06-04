import type { Task, TaskStatus } from "@/generated/prisma/client";

export type { Task, TaskStatus };

export interface CreateTaskCommand {
  eventId: number;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  taskStatus?: TaskStatus;
  dueDate?: Date;
  createdBy: number;
}

export interface UpdateTaskCommand {
  title?: string;
  description?: string | null;
}
