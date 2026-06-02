import { prisma } from "@/lib/prisma";

export class TaskService {
  async getTasksByEventId(eventId: number) {
    return prisma.task.findMany({
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

  async createTask(data: {
    eventId: number;
    title: string;
    description?: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    taskStatus?: "OPEN" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
    dueDate?: Date;
    volunteerIds?: number[];
  }, userId: number) {
    return prisma.task.create({
      data: {
        eventId: data.eventId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        taskStatus: data.taskStatus || "OPEN",
        dueDate: data.dueDate || null,
        createdBy: userId,
      }
    });
  }

  async updateTaskStatus(taskId: number, taskStatus: "OPEN" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "CANCELLED") {
    return prisma.task.update({
      where: { id: taskId },
      data: { taskStatus }
    });
  }

  async assignVolunteerToTask(taskId: number, volunteerId: number) {
    // Deprecated. Handled by AssignmentService.
    return null;
  }

  async removeVolunteerFromTask(taskId: number, volunteerId: number) {
    // Deprecated. Handled by AssignmentService.
    return null;
  }

  async updateTaskDetails(taskId: number, data: { title?: string; description?: string | null }) {
    return prisma.task.update({
      where: { id: taskId },
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
