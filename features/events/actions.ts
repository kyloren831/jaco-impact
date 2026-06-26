"use server";
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

import { requireRole, withRole } from "@/lib/auth/guards";
import { EventDomainService } from "@/domain/events/service";
import { EventStatus, Visibility } from "@/generated/prisma/client";
import { CreateEventDTO, UpdateEventDTO } from "@/domain/events/event.types";

const eventService = new EventDomainService();

export async function getEventsByProject(projectId: number) {
  try {
    const events = await eventService.getEventsByProject(projectId);
    return { success: true, data: events };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllEvents() {
  try {
    const events = await eventService.getAllEvents();
    return { success: true, data: events.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEventDetail(eventId: number) {
  try {
    const event = await eventService.getEventDetails(eventId);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const createEvent = withRole(['ADMIN', 'COORDINATOR'], async (payload, formData: FormData, projectId: number, status: string) => {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const eventDateStr = formData.get("eventDate") as string;
    const volunteersNeededStr = formData.get("volunteersNeeded");
    const volunteersNeeded = Number(volunteersNeededStr);
    const visibility = (formData.get("visibility") as any) || Visibility.PUBLIC;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;

    if (!name || !eventDateStr) {
      return { success: false, error: "Faltan campos obligatorios" };
    }

    if (!volunteersNeededStr || volunteersNeeded <= 0) {
      return { success: false, error: "Debes especificar la cantidad de voluntarios necesarios (mayor a 0)." };
    }

    const eventDate = new Date(eventDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time part for today
    if (eventDate < today) {
      return { success: false, error: "La fecha del evento no puede ser en el pasado." };
    }

    const data: CreateEventDTO = {
      name,
      description: description || null,
      location: location || null,
      eventDate,
      volunteersNeeded,
      visibility,
      startDate: startDateStr ? new Date(startDateStr) : null,
      endDate: endDateStr ? new Date(endDateStr) : null,
      projectId,
      status: status as EventStatus,
    };

    const event = await eventService.createEvent(data, payload.userId);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const updateEventStatusAction = withRole(['ADMIN', 'COORDINATOR'], async (payload, eventId: number, status: string) => {
  try {
    const event = await eventService.updateEventStatus(eventId, status as EventStatus, payload.userId);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const updateEventDetailsAction = withRole(['ADMIN', 'COORDINATOR'], async (payload, eventId: number, data: UpdateEventDTO) => {
  try {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: "El nombre del evento no puede estar vacío" };
    }

    const event = await eventService.updateEventDetails(eventId, data, payload.userId);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const cancelEventAction = withRole(['ADMIN', 'COORDINATOR'], async (payload, eventId: number) => {
  try {
    const event = await eventService.updateEventStatus(eventId, EventStatus.CANCELLED, payload.userId);
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
