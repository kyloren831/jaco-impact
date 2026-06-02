import { prisma } from '@/lib/prisma';
import { IParticipationRepository } from '@/domain/participation/participation.repository';
import { ParticipationStatus, EventParticipation, Prisma } from '@/generated/prisma/client';

export class ParticipationPrismaRepository implements IParticipationRepository {
  async findByEventAndVolunteer(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<EventParticipation | null> {
    const db = tx || prisma;
    return db.eventParticipation.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId
        }
      }
    });
  }

  async existsActiveParticipation(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    const db = tx || prisma;
    const count = await db.eventParticipation.count({
      where: {
        eventId,
        volunteerId,
        status: {
          in: ['REGISTERED', 'ATTENDED']
        }
      }
    });
    return count > 0;
  }

  async register(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<EventParticipation> {
    const db = tx || prisma;
    return db.eventParticipation.upsert({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId
        }
      },
      update: {
        status: 'REGISTERED' as ParticipationStatus
      },
      create: {
        eventId,
        volunteerId,
        status: 'REGISTERED' as ParticipationStatus
      }
    });
  }

  async updateStatus(eventId: number, volunteerId: number, status: ParticipationStatus, tx?: Prisma.TransactionClient): Promise<EventParticipation> {
    const db = tx || prisma;
    return db.eventParticipation.update({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId
        }
      },
      data: {
        status
      }
    });
  }

  async countByEvent(eventId: number, tx?: Prisma.TransactionClient): Promise<number> {
    const db = tx || prisma;
    return db.eventParticipation.count({
      where: {
        eventId,
        status: {
          not: 'CANCELLED'
        }
      }
    });
  }

  async hasActiveAssignments(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    const db = tx || prisma;
    const count = await db.taskAssignment.count({
      where: {
        eventId,
        volunteerId,
        status: {
          notIn: ['CANCELLED', 'DECLINED', 'REJECTED']
        }
      }
    });
    return count > 0;
  }

  async getEventVolunteers(eventId: number, tx?: Prisma.TransactionClient): Promise<EventParticipation[]> {
    const db = tx || prisma;
    return db.eventParticipation.findMany({
      where: {
        eventId,
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        volunteer: {
          include: {
            user: true
          }
        }
      }
    });
  }
}
