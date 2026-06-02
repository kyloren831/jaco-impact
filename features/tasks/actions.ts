"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { requireRole } from "@/lib/auth/guards";
import { TaskService } from "@/lib/services/task.service";
import { VolunteerService } from "@/lib/services/volunteer.service";
import { AssignmentService } from "@/domain/assignments/service";

const taskService = new TaskService();
const volunteerService = new VolunteerService();
const assignmentService = new AssignmentService();

export async function getTasksByEvent(eventId: number) {
  try {
    const tasks = await taskService.getTasksByEventId(eventId);
    return { success: true, data: tasks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTaskAction(formData: FormData, eventId: number) {
  try {
    const session = await requireRole(['ADMIN', 'COORDINATOR']);
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as "LOW" | "MEDIUM" | "HIGH";
    const dueDateStr = formData.get("dueDate") as string;
    const volunteerIdsStr = formData.getAll("volunteerIds") as string[];
    
    // Si viene como un solo string JSON desde el cliente (dependiendo de cómo se envíe)
    let volunteerIds: number[] = [];
    if (volunteerIdsStr.length === 1 && volunteerIdsStr[0].startsWith('[')) {
      try {
        volunteerIds = JSON.parse(volunteerIdsStr[0]);
      } catch (e) {}
    } else {
      volunteerIds = volunteerIdsStr.map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    if (!title) {
      return { success: false, error: "El título es obligatorio" };
    }

    const data = {
      eventId,
      title,
      description: description || undefined,
      priority: priority || "MEDIUM",
      dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
      volunteerIds: [], // Assigned via assignmentService to respect invariants
    };

    const task = await taskService.createTask(data, session.userId);
    
    if (volunteerIds.length > 0) {
      for (const vid of volunteerIds) {
        await assignmentService.assignTask(task.id, vid, session.userId, eventId);
      }
    }

    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatusAction(taskId: number, status: string) {
  try {
    await requireRole(['ADMIN', 'COORDINATOR']);
    
    const task = await taskService.updateTaskStatus(taskId, status as any);
    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllVolunteersAction() {
  try {
    const volunteers = await volunteerService.getAllVolunteers();
    return { success: true, data: volunteers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignVolunteerAction(taskId: number, volunteerId: number) {
  try {
    const session = await requireRole(['ADMIN', 'COORDINATOR']);
    const result = await assignmentService.assignTask(taskId, volunteerId, session.userId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeVolunteerAction(taskId: number, volunteerId: number) {
  try {
    const session = await requireRole(['ADMIN', 'COORDINATOR']);
    const result = await assignmentService.removeAssignment(taskId, volunteerId, session.userId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskDetailsAction(taskId: number, data: { title?: string; description?: string | null }) {
  try {
    await requireRole(['ADMIN', 'COORDINATOR']);

    if (data.title !== undefined && !data.title.trim()) {
      return { success: false, error: "El título de la tarea no puede estar vacío" };
    }

    const task = await taskService.updateTaskDetails(taskId, data);
    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
