"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { requireAuth, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AssignmentService } from "@/domain/assignments/service";
import { commentService } from "@/domain/comments/service";

const assignmentService = new AssignmentService();

export async function getVolunteerProjectsAction() {
  try {
    await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);

    const projects = await prisma.project.findMany({
      where: {
        status: {
          notIn: ["DRAFT", "CANCELLED"],
        },
      },
      include: {
        pillar: true,
        events: {
          where: {
            status: "OPEN",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true as const, data: projects };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function getVolunteerEventsAction() {
  try {
    await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);

    const events = await prisma.event.findMany({
      where: {
        status: "OPEN",
        project: {
          status: {
            in: ["PUBLISHED", "IN_PROGRESS"],
          },
        },
      },
      include: {
        project: {
          include: {
            pillar: true,
          },
        },
        participations: true, // We will filter on the frontend or check if the current user is in
      },
      orderBy: { startDate: "asc" },
    });

    return { success: true as const, data: events };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function registerToEventAction(eventId: number) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId },
    });

    if (!volunteer) {
      throw new Error("Perfil de voluntario no encontrado");
    }

    // Validar el estado del proyecto padre
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { project: true },
    });

    if (!event) throw new Error("Evento no encontrado");
    if (event.status !== "OPEN") throw new Error("El evento no está abierto para inscripciones");
    if (!["PUBLISHED", "IN_PROGRESS"].includes(event.project.status)) {
      throw new Error("El proyecto no permite inscripciones en este momento");
    }

    // Crear la participación (idempotente en el backend si se añade Unique Constraint en schema)
    const existing = await prisma.eventParticipation.findFirst({
      where: {
        eventId,
        volunteerId: volunteer.id,
      },
    });

    if (existing) {
      throw new Error("Ya estás inscrito en este evento");
    }

    await prisma.eventParticipation.create({
      data: {
        eventId,
        volunteerId: volunteer.id,
        status: "REGISTERED",
      },
    });

    revalidatePath("/dashboard/volunteer/events");
    revalidatePath("/dashboard/volunteer");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function getVolunteerTasksAction(eventId?: number) {
  try {
    const session = await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);
    
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId },
    });

    if (!volunteer) {
      throw new Error("Perfil de voluntario no encontrado");
    }

    // Get tasks only for events the volunteer is registered to
    const participations = await prisma.eventParticipation.findMany({
      where: { volunteerId: volunteer.id },
      select: { eventId: true }
    });

    const eventIds = participations.map(p => p.eventId);
    if (eventId && !eventIds.includes(eventId)) {
      throw new Error("No tienes acceso a las tareas de este evento o no estás inscrito.");
    }

    const tasks = await prisma.task.findMany({
      where: {
        eventId: eventId ? eventId : { in: eventIds },
      },
      include: {
        event: true,
        assignments: {
          include: {
            volunteer: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { dueDate: "asc" }
    });

    return { success: true as const, data: tasks };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function acceptAssignmentAction(taskId: number) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.acceptAssignment(taskId, volunteer.id, session.userId);

    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true as const, data: result };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function declineAssignmentAction(taskId: number, reason: string) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.declineAssignment(taskId, volunteer.id, session.userId, reason);

    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true as const, data: result };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function startAssignmentAction(taskId: number) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.startAssignment(taskId, volunteer.id, session.userId);

    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true as const, data: result };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function submitAssignmentAction(taskId: number, note?: string) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.submitAssignment(taskId, volunteer.id, session.userId, note);

    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true as const, data: result };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function addTaskCommentAction(taskId: number, content: string) {
  try {
    const session = await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);

    const userRoles = session.roles ?? [session.role];
    const isOnlyVolunteer = userRoles.includes("VOLUNTEER") && !userRoles.includes("ADMIN") && !userRoles.includes("COORDINATOR");

    if (isOnlyVolunteer) {
      const volunteer = await prisma.volunteer.findUnique({
        where: { userId: session.userId },
      });
      if (!volunteer) {
        throw new Error("Perfil de voluntario no encontrado");
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { eventId: true },
      });
      if (!task) {
        throw new Error("Tarea no encontrada");
      }

      const participation = await prisma.eventParticipation.findUnique({
        where: {
          eventId_volunteerId: {
            eventId: task.eventId,
            volunteerId: volunteer.id,
          },
        },
      });
      if (!participation || participation.status === "CANCELLED") {
        throw new Error("No tienes acceso a las tareas de este evento o no estás inscrito.");
      }
    }

    const result = await commentService.createComment(taskId, session.userId, content);

    revalidatePath("/dashboard/volunteer/tasks");
    return { success: true as const, data: result };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function getTaskCommentsAction(taskId: number) {
  try {
    const session = await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);

    const userRoles = session.roles ?? [session.role];
    const isOnlyVolunteer = userRoles.includes("VOLUNTEER") && !userRoles.includes("ADMIN") && !userRoles.includes("COORDINATOR");

    if (isOnlyVolunteer) {
      const volunteer = await prisma.volunteer.findUnique({
        where: { userId: session.userId },
      });
      if (!volunteer) {
        throw new Error("Perfil de voluntario no encontrado");
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { eventId: true },
      });
      if (!task) {
        throw new Error("Tarea no encontrada");
      }

      const participation = await prisma.eventParticipation.findUnique({
        where: {
          eventId_volunteerId: {
            eventId: task.eventId,
            volunteerId: volunteer.id,
          },
        },
      });
      if (!participation || participation.status === "CANCELLED") {
        throw new Error("No tienes acceso a las tareas de este evento o no estás inscrito.");
      }
    }

    const result = await commentService.getCommentsByTaskId(taskId);
    return { success: true as const, data: result };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}
