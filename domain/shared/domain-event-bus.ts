import { DomainEvent } from './domain-event';

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

export interface IDomainEventBus {
  emit<T>(event: DomainEvent<T>): Promise<void>;
  on<T>(type: string, handler: EventHandler<T>): void;
  off<T>(type: string, handler: EventHandler<T>): void;
}

/**
 * In-process Domain Event Bus implementation.
 * Used for decoupling domain modules and triggering side-effects within the same instance.
 */
class InMemoryDomainEventBus implements IDomainEventBus {
  private handlers: Map<string, Set<EventHandler<any>>> = new Map();

  async emit<T>(event: DomainEvent<T>): Promise<void> {
    const eventHandlers = this.handlers.get(event.type);
    
    if (!eventHandlers) return;

    // Execute all handlers concurrently but don't block the main flow if it's fire-and-forget.
    // However, some persistence handlers (like Audit/Notifications) should ideally run in the same transaction
    // and wait for completion. For now, we await all of them using Promise.allSettled to prevent one failure
    // from crashing the rest.
    const promises = Array.from(eventHandlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error executing handler for event ${event.type}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  on<T>(type: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off<T>(type: string, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(type);
    if (eventHandlers) {
      eventHandlers.delete(handler);
    }
  }
}

// Singleton instance export
export const domainEventBus = new InMemoryDomainEventBus();

