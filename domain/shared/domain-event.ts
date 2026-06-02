export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  metadata: {
    actorId: number;
    timestamp: Date;
    correlationId?: string;
  };
}
