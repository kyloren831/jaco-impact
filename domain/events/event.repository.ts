import { Event, EventStatus } from '../../generated/prisma/client';
import { CreateEventDTO, EventWithParticipations, UpdateEventDTO } from './event.types';
import { PaginationParams, PaginatedResult } from '../shared/types';

export interface IEventRepository {
  findById(id: number): Promise<Event | null>;
  findByIdWithParticipations(id: number): Promise<EventWithParticipations | null>;
  findByProjectId(projectId: number): Promise<Event[]>;
  findAll(pagination?: PaginationParams): Promise<PaginatedResult<Event>>;
  create(data: CreateEventDTO, createdBy: number): Promise<Event>;
  updateStatus(id: number, status: EventStatus): Promise<Event>;
  updateDetails(id: number, data: UpdateEventDTO): Promise<Event>;
}
