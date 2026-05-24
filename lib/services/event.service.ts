import { prisma } from "@/lib/prisma";

export class EventService {
  async getAllEvents() {
    return prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async getEventsByProjectId(projectId: number) {
    return prisma.event.findMany({
      where: { projectId },
      orderBy: { eventDate: 'asc' },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async createEvent(data: any, createdBY: number) {
    return prisma.event.create({
      data: {
        ...data,
        createdBY,
      },
    });
  }

  async updateEventStatus(eventId: number, status: any) {
    return prisma.event.update({
      where: { id: eventId },
      data: { status },
    });
  }
}
