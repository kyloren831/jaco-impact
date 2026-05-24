"use server";

import { requireAuth } from "@/lib/auth/guards";
import { TaskService } from "@/lib/services/task.service";
import { VolunteerService } from "@/lib/services/volunteer.service";

const taskService = new TaskService();
const volunteerService = new VolunteerService();

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
    const session = await requireAuth();
    
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
      volunteerIds,
    };

    const task = await taskService.createTask(data, session.userId);
    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatusAction(taskId: number, status: string) {
  try {
    await requireAuth();
    
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
    await requireAuth();
    const result = await taskService.assignVolunteerToTask(taskId, volunteerId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeVolunteerAction(taskId: number, volunteerId: number) {
  try {
    await requireAuth();
    const result = await taskService.removeVolunteerFromTask(taskId, volunteerId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
