import { PrismaClient, Prisma, Event, EventStatus } from '../../../generated/prisma/client';
import { IEventRepository } from '../../../domain/events/event.repository';
import { CreateEventDTO, EventWithParticipations, UpdateEventDTO } from '../../../domain/events/event.types';
import { PaginationParams, PaginatedResult } from '../../../domain/shared/types';
import { prisma } from '../../../lib/prisma';

export class EventPrismaRepository implements IEventRepository {
  private getClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | PrismaClient {
    return tx || prisma;
  }

  async findById(id: number, tx?: Prisma.TransactionClient): Promise<Event | null> {
    return this.getClient(tx).event.findUnique({
      where: { id },
    });
  }

  async findByIdWithParticipations(id: number, tx?: Prisma.TransactionClient): Promise<EventWithParticipations | null> {
    return this.getClient(tx).event.findUnique({
      where: { id },
      include: {
        participations: true,
        tasks: true,
        _count: {
          select: { participations: true, tasks: true },
        },
      },
    });
  }

  async findByProjectId(projectId: number, tx?: Prisma.TransactionClient): Promise<Event[]> {
    return this.getClient(tx).event.findMany({
      where: { projectId },
      orderBy: { eventDate: 'asc' },
    });
  }

  async findAll(pagination?: PaginationParams, tx?: Prisma.TransactionClient): Promise<PaginatedResult<Event>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.getClient(tx).event.findMany({
        skip,
        take: pageSize,
        orderBy: { eventDate: 'asc' },
      }),
      this.getClient(tx).event.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: skip + data.length < total,
    };
  }

  async create(data: CreateEventDTO, createdBy: number, tx?: Prisma.TransactionClient): Promise<Event> {
    return this.getClient(tx).event.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  async updateStatus(id: number, status: EventStatus, tx?: Prisma.TransactionClient): Promise<Event> {
    return this.getClient(tx).event.update({
      where: { id },
      data: { status },
    });
  }

  async updateDetails(id: number, data: UpdateEventDTO, tx?: Prisma.TransactionClient): Promise<Event> {
    return this.getClient(tx).event.update({
      where: { id },
      data,
    });
  }
}
