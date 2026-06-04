import { prisma } from "@/lib/prisma";
import type { ITaskRepository } from "@/domain/tasks/task.repository";
import type { CreateTaskCommand, UpdateTaskCommand, Task, TaskStatus } from "@/domain/tasks/task.types";
import { Prisma } from "@/generated/prisma/client";

export class TaskPrismaRepository implements ITaskRepository {
  async findById(id: number, tx?: Prisma.TransactionClient): Promise<Task | null> {
    const client = tx || prisma;
    return client.task.findUnique({ where: { id } });
  }

  async findByEventId(eventId: number, tx?: Prisma.TransactionClient): Promise<any[]> {
    const client = tx || prisma;
    return client.task.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        assignments: {
          include: {
            volunteer: {
              include: { user: { select: { name: true, email: true } } }
            }
          }
        }
      }
    });
  }

  async create(data: CreateTaskCommand, tx?: Prisma.TransactionClient): Promise<Task> {
    const client = tx || prisma;
    return client.task.create({ data: { ...data, taskStatus: data.taskStatus || "OPEN" } });
  }

  async updateStatus(id: number, status: TaskStatus, tx?: Prisma.TransactionClient): Promise<Task> {
    const client = tx || prisma;
    return client.task.update({
      where: { id },
      data: { taskStatus: status }
    });
  }

  async updateDetails(id: number, data: UpdateTaskCommand, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx || prisma;
    return client.task.update({
      where: { id },
      data,
      include: {
        creator: {
          select: { name: true, email: true }
        },
        assignments: {
          include: {
            volunteer: {
              include: { user: { select: { name: true, email: true } } }
            }
          }
        }
      }
    });
  }
}
