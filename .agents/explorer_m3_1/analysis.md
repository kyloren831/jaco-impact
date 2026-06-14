# Analysis Report - Milestone 3: Real-Time SSE Integration

This report outlines the static analysis and implementation design for the real-time Server-Sent Events (SSE) integration.

## 1. Domain Events Definition (`domain/shared/events.ts`)

### File Path
`/home/aaron/Projects/jaco-impact/domain/shared/events.ts`

### Findings
- The file contains event payload typings, including `AssignmentStatusChangedPayload` (lines 13-21).
- The `DOMAIN_EVENTS` object (lines 73-108) lists registered events, but currently lacks `ASSIGNMENT_STATUS_CHANGED`.
- In contrast, specific events like `ASSIGNMENT_ACCEPTED` and `ASSIGNMENT_DECLINED` are present.

### Proposed Code Change
Add `ASSIGNMENT_STATUS_CHANGED` to the `DOMAIN_EVENTS` mapping:
```typescript
  // Assignment domain
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED', // added
  ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
```

---

## 2. Emitting Events on Transitions (`domain/assignments/service.ts`)

### File Path
`/home/aaron/Projects/jaco-impact/domain/assignments/service.ts`

### Findings
The service manages state transitions via several methods:
- `acceptAssignment`: lines 85-116
- `declineAssignment`: lines 118-150
- `startAssignment`: lines 152-183
- `submitAssignment`: lines 185-216
- `reviewAssignment`: lines 218-268
- `removeAssignment`: lines 270-302

Each transitions the status in the database using the transaction client `tx`, and then emits a specific event (e.g. `DOMAIN_EVENTS.ASSIGNMENT_ACCEPTED`). We need to add emission of the general `ASSIGNMENT_STATUS_CHANGED` event in each of these methods while preserving the existing specific events for backward compatibility.

### Proposed Code Changes

#### acceptAssignment (Lines 101-112)
```typescript
      // Emit specific event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_ACCEPTED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });

      // Emit status changed event (newly added)
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });
```

#### declineAssignment (Lines 134-147)
```typescript
      // Emit specific event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_DECLINED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus,
          reason
        }
      });

      // Emit status changed event (newly added)
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus,
          reason
        }
      });
```

#### startAssignment (Lines 168-179)
```typescript
      // Emit specific event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STARTED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });

      // Emit status changed event (newly added)
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });
```

#### submitAssignment (Lines 201-212)
```typescript
      // Emit specific event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_SUBMITTED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });

      // Emit status changed event (newly added)
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });
```

#### reviewAssignment (Lines 248-264)
In `reviewAssignment`, we can emit `ASSIGNMENT_STATUS_CHANGED` right after specific approval/revision-requested events, representing the transition to the decision state:
```typescript
      const eventType = decision === 'APPROVED' ? DOMAIN_EVENTS.ASSIGNMENT_APPROVED :
                        decision === 'REVISION_REQUESTED' ? DOMAIN_EVENTS.ASSIGNMENT_REVISION_REQUESTED : null;

      if (eventType) {
        await domainEventBus.emit({
          metadata: { timestamp: new Date(), actorId },
          type: eventType,
          payload: {
            taskId,
            volunteerId,
            eventId: current.eventId,
            actorId,
            previousStatus: current.status,
            newStatus
          }
        });
      }

      // Emit status changed event (newly added)
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });
```

#### removeAssignment (Lines 287-298)
```typescript
      // Emit specific event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_CANCELLED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });

      // Emit status changed event (newly added)
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });
```

---

## 3. SSE API Route Refinement (`app/api/realtime/route.ts`)

### File Path
`/home/aaron/Projects/jaco-impact/app/api/realtime/route.ts`

### Findings
- Currently registers listeners for all events and serializes them verbatim to the stream client.
- To meet specifications in `PROJECT.md` and `SCOPE.md`, the output payload for `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` needs specific structure formatting.
- E2E tests (`tier1.spec.ts`, etc.) expect direct properties like `payload.content` and `payload.authorName` for `TASK_COMMENT`. The specification expects a nested `comment` structure: `payload.comment.content`, `payload.comment.author.name`, etc.
- By formatting the payloads to merge the flat properties and nested objects, we keep E2E tests passing and satisfy design specifications perfectly.

### Proposed Code Change
Update `sendEvent` inside the `GET` function:
```typescript
      const sendEvent = (event: any) => {
        try {
          let eventToSend = event;

          if (event.type === DOMAIN_EVENTS.TASK_COMMENT) {
            eventToSend = {
              type: event.type,
              metadata: event.metadata,
              payload: {
                // Keep flat fields for tests
                taskId: event.payload.taskId,
                commentId: event.payload.commentId,
                authorId: event.payload.authorId,
                content: event.payload.content,
                createdAt: event.payload.createdAt,
                authorName: event.payload.authorName,
                eventId: event.payload.eventId,
                // Nested comment object for client specs
                comment: {
                  id: event.payload.commentId,
                  content: event.payload.content,
                  createdAt: event.payload.createdAt,
                  author: {
                    id: event.payload.authorId,
                    name: event.payload.authorName,
                  },
                },
              },
            };
          } else if (event.type === DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED) {
            eventToSend = {
              type: event.type,
              metadata: event.metadata,
              payload: {
                taskId: event.payload.taskId,
                volunteerId: event.payload.volunteerId,
                newStatus: event.payload.newStatus,
              },
            };
          }

          const data = `data: ${JSON.stringify(eventToSend)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          // Ignore write errors (e.g. client disconnected)
        }
      };
```

---

## 4. Frontend Hook Callback Support (`hooks/useRealtime.ts`)

### File Path
`/home/aaron/Projects/jaco-impact/hooks/useRealtime.ts`

### Findings
- Currently is a simple React hook supporting only `eventType` as parameter and returning `{ lastEvent, isConnected }`.
- We need to optionally allow clients to register callback event handlers.
- Adding a second parameter `onEvent?: (event: RealtimeEvent<T>) => void` allows registering callbacks.
- To prevent unnecessary `EventSource` reconnections when the callback function reference changes (e.g., if defined inline), we can use a `useRef` to store the callback and update it on every render.

### Proposed Code Change
```typescript
import { useEffect, useState, useRef } from 'react';

type RealtimeEvent<T = any> = {
  type: string;
  metadata?: any;
  payload: T;
};

export function useRealtime<T = any>(
  eventType?: string,
  onEvent?: (event: RealtimeEvent<T>) => void
) {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use ref to hold latest onEvent callback without triggering reconnects
  const callbackRef = useRef(onEvent);
  useEffect(() => {
    callbackRef.current = onEvent;
  });

  useEffect(() => {
    const eventSource = new EventSource('/api/realtime');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedEvent: RealtimeEvent<T> = JSON.parse(event.data);
        
        if (!eventType || parsedEvent.type === eventType) {
          setLastEvent(parsedEvent);
          if (callbackRef.current) {
            callbackRef.current(parsedEvent);
          }
        }
      } catch (err) {
        console.error('Failed to parse realtime event data:', err);
      }
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [eventType]);

  return { lastEvent, isConnected };
}
```
