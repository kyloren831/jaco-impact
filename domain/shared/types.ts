export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  cursor?: number;
};

// Identity Types
export type CompositeId = { taskId: number; volunteerId: number };
export type EventParticipationId = { eventId: number; volunteerId: number };

// Context Types
export type ActorContext = {
  userId: number;
  roles: string[];
  volunteerId?: number;
};

// Policy Types
export type PolicyResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: string };
