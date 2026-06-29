import { Event, EventStatus } from '../../generated/prisma/client';
import { CreateEventDTO, EventWithParticipations, UpdateEventDTO } from './event.types';
import { PaginationParams, PaginatedResult } from '../shared/types';

export interface IEventRepository {
  findById(id: number, tx?: any): Promise<Event | null>;
  findByIdWithParticipations(id: number, tx?: any): Promise<EventWithParticipations | null>;
  findByProjectId(projectId: number, tx?: any): Promise<Event[]>;
  findAll(pagination?: PaginationParams, tx?: any): Promise<PaginatedResult<Event>>;
  create(data: CreateEventDTO, createdBy: number, tx?: any): Promise<Event>;
  updateStatus(id: number, status: EventStatus, tx?: any): Promise<Event>;
  updateDetails(id: number, data: UpdateEventDTO, tx?: any): Promise<Event>;
}
