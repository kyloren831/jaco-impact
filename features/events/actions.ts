"use server";

import { requireAuth } from "@/lib/auth/guards";
import { EventService } from "@/lib/services/event.service";

const eventService = new EventService();

export async function getEventsByProject(projectId: number) {
  try {
    const events = await eventService.getEventsByProjectId(projectId);
    return { success: true, data: events };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllEvents() {
  try {
    const events = await eventService.getAllEvents();
    return { success: true, data: events };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createEvent(formData: FormData, projectId: number, status: string) {
  try {
    const session = await requireAuth();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const eventDateStr = formData.get("eventDate") as string;
    const volunteersNeeded = Number(formData.get("volunteersNeeded")) || 0;
    const visibility = formData.get("visibility") as any || "PUBLIC";
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;

    if (!name || !eventDateStr) {
      return { success: false, error: "Faltan campos obligatorios" };
    }

    const data = {
      name,
      description: description || null,
      location: location || null,
      eventDate: new Date(eventDateStr),
      volunteersNeeded,
      visibility,
      startDate: startDateStr ? new Date(startDateStr) : null,
      endDate: endDateStr ? new Date(endDateStr) : null,
      projectId,
      status: status as any,
    };

    const event = await eventService.createEvent(data, session.userId);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEventStatusAction(eventId: number, status: string) {
  try {
    await requireAuth(); // Solo usuarios autenticados pueden mover eventos
    
    const event = await eventService.updateEventStatus(eventId, status as any);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
