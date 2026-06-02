import { ParticipationStatus, EventParticipation, Prisma } from '@/generated/prisma/client';

export interface IParticipationRepository {
  findByEventAndVolunteer(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<EventParticipation | null>;
  existsActiveParticipation(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<boolean>;
  register(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<EventParticipation>;
  updateStatus(eventId: number, volunteerId: number, status: ParticipationStatus, tx?: Prisma.TransactionClient): Promise<EventParticipation>;
  countByEvent(eventId: number, tx?: Prisma.TransactionClient): Promise<number>;
  hasActiveAssignments(eventId: number, volunteerId: number, tx?: Prisma.TransactionClient): Promise<boolean>;
  getEventVolunteers(eventId: number, tx?: Prisma.TransactionClient): Promise<EventParticipation[]>;
}
