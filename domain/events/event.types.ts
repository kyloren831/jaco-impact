import { Event, EventParticipation, Task, EventStatus, Visibility } from '../../generated/prisma/client';

export type EventWithParticipations = Event & { 
  participations: EventParticipation[];
  tasks: Task[];
  _count: { participations: number; tasks: number; };
};

export type CreateEventDTO = {
  name: string;
  description?: string | null;
  location?: string | null;
  eventDate: Date;
  volunteersNeeded: number;
  visibility: Visibility;
  startDate?: Date | null;
  endDate?: Date | null;
  projectId: number;
  status: EventStatus;
};

export type UpdateEventDTO = Partial<Omit<CreateEventDTO, 'projectId' | 'status'>>;
