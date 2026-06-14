# Analysis: Milestone 3 - Real-Time SSE Integration

This analysis outlines the findings and the implementation plan for Milestone 3: Real-Time SSE Integration in the Jacó Impact 'Mis Tareas' project.

---

## 1. Problem Boundary & Scope

The objective of Milestone 3 is to integrate real-time capabilities via Server-Sent Events (SSE). 
Clients will subscribe to `/api/realtime` and receive domain events, specifically `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED`.
This enables the volunteer dashboard and task detail drawer to synchronize automatically with backend updates without page refreshes.

Four specific files require modifications:
1. `domain/shared/events.ts`: Define the `ASSIGNMENT_STATUS_CHANGED` domain event in the registry.
2. `domain/assignments/service.ts`: Emit `ASSIGNMENT_STATUS_CHANGED` during state transitions in service methods.
3. `app/api/realtime/route.ts`: Format `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` events sent to the client.
4. `hooks/useRealtime.ts`: Expand the hook signature to accept an optional callback `onEvent` and handle SSE subscription efficiently.

---

## 2. Event Types & Schemas

### 2.1. `ASSIGNMENT_STATUS_CHANGED`
This event tracks all assignment state shifts (acceptance, decline, startup, submission, coordinator reviews, and cancellation/removal).
- **Domain Event Payload** (`AssignmentStatusChangedPayload` in `domain/shared/events.ts`):
  ```typescript
  export type AssignmentStatusChangedPayload = {
    taskId: number;
    volunteerId: number;
    eventId: number;
    previousStatus: AssignmentStatus;
    newStatus: AssignmentStatus;
    actorId: number;
    reason?: string;
  };
  ```
- **Over-the-Wire JSON Format** (delivered via SSE):
  ```json
  {
    "type": "ASSIGNMENT_STATUS_CHANGED",
    "payload": {
      "taskId": 12,
      "volunteerId": 5,
      "newStatus": "ACCEPTED"
    }
  }
  ```

### 2.2. `TASK_COMMENT`
This event is emitted when comments are added to tasks.
- **Domain Event Payload** (`TaskCommentPayload` in `domain/shared/events.ts`):
  ```typescript
  export type TaskCommentPayload = {
    taskId: number;
    commentId: number;
    authorId: number;
    content: string;
    createdAt: Date;
    authorName: string;
    eventId: number;
  };
  ```
- **Over-the-Wire JSON Format** (delivered via SSE):
  The over-the-wire payload must provide the nested `comment` structure expected by the frontend while keeping the top-level properties expected by existing E2E tests:
  ```json
  {
    "type": "TASK_COMMENT",
    "payload": {
      "taskId": 12,
      "commentId": 1,
      "authorId": 5,
      "content": "...",
      "createdAt": "...",
      "authorName": "...",
      "eventId": 1,
      "comment": {
        "id": 1,
        "content": "...",
        "createdAt": "...",
        "author": {
          "id": 5,
          "name": "..."
        }
      }
    }
  }
  ```

---

## 3. Detailed File Proposals

### 3.1. `domain/shared/events.ts`
Add the `ASSIGNMENT_STATUS_CHANGED` string constant to the `DOMAIN_EVENTS` registry.

```typescript
// Proposed Change in domain/shared/events.ts
export const DOMAIN_EVENTS = {
  // Comment domain
  TASK_COMMENT: 'TASK_COMMENT',

  // ... (other events)

  // Assignment domain
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED', // Added
  ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
  ASSIGNMENT_DECLINED: 'ASSIGNMENT_DECLINED',
  ASSIGNMENT_STARTED: 'ASSIGNMENT_STARTED',
  ASSIGNMENT_SUBMITTED: 'ASSIGNMENT_SUBMITTED',
  ASSIGNMENT_APPROVED: 'ASSIGNMENT_APPROVED',
  ASSIGNMENT_REVISION_REQUESTED: 'ASSIGNMENT_REVISION_REQUESTED',
  ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
  TASK_STATUS_DERIVED: 'TASK_STATUS_DERIVED',
  // ...
```

### 3.2. `domain/assignments/service.ts`
Update the state transition methods of `AssignmentService` to emit the `ASSIGNMENT_STATUS_CHANGED` event on `domainEventBus`.

1. **`acceptAssignment`**:
   ```typescript
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
2. **`declineAssignment`**:
   ```typescript
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
3. **`startAssignment`**:
   ```typescript
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
4. **`submitAssignment`**:
   ```typescript
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
5. **`reviewAssignment`**:
   This method can execute two transitions. First, it moves the assignment to `UNDER_REVIEW` if it was `SUBMITTED`. Second, it applies the coordinator decision (`APPROVED`, `REJECTED`, or `REVISION_REQUESTED`). We emit `ASSIGNMENT_STATUS_CHANGED` for both transitions if they occur.
   ```typescript
   // Inside if (tempStatus === AssignmentStatus.SUBMITTED) block:
   const prevStatus = tempStatus;
   tempStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus.UNDER_REVIEW);
   // ... database update ...
   await domainEventBus.emit({
     metadata: { timestamp: new Date(), actorId },
     type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
     payload: {
       taskId,
       volunteerId,
       eventId: current.eventId,
       actorId,
       previousStatus: prevStatus,
       newStatus: tempStatus
     }
   });

   // After updating database with the final newStatus:
   await domainEventBus.emit({
     metadata: { timestamp: new Date(), actorId },
     type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
     payload: {
       taskId,
       volunteerId,
       eventId: current.eventId,
       actorId,
       previousStatus: tempStatus,
       newStatus
     }
   });
   ```
6. **`removeAssignment`**:
   ```typescript
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

### 3.3. `app/api/realtime/route.ts`
Modify the `sendEvent` helper inside `ReadableStream.start` to format `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` payloads according to specs before sending.

```typescript
      const sendEvent = (event: any) => {
        try {
          let formattedEvent = event;

          if (event.type === DOMAIN_EVENTS.TASK_COMMENT) {
            formattedEvent = {
              type: event.type,
              payload: {
                taskId: event.payload.taskId,
                commentId: event.payload.commentId,
                authorId: event.payload.authorId,
                content: event.payload.content,
                createdAt: event.payload.createdAt,
                authorName: event.payload.authorName,
                eventId: event.payload.eventId,
                comment: {
                  id: event.payload.commentId,
                  content: event.payload.content,
                  createdAt: event.payload.createdAt,
                  author: {
                    id: event.payload.authorId,
                    name: event.payload.authorName
                  }
                }
              }
            };
          } else if (event.type === DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED) {
            formattedEvent = {
              type: event.type,
              payload: {
                taskId: event.payload.taskId,
                volunteerId: event.payload.volunteerId,
                newStatus: event.payload.newStatus
              }
            };
          }

          const data = `data: ${JSON.stringify(formattedEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          // Ignore write errors (e.g. client disconnected)
        }
      };
```

### 3.4. `hooks/useRealtime.ts`
Modify the hook signature to accept `onEvent?: (event: RealtimeEvent<T>) => void`. Use a `useRef` to store the latest callback so that inline callbacks do not cause the hook to tear down and reconstruct the `EventSource` connection on every component re-render.

```typescript
'use client';

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

  // Store callback in a mutable ref to prevent reconnect loops on inline functions
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

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
          if (onEventRef.current) {
            onEventRef.current(parsedEvent);
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

---

## 4. Backwards Compatibility & Verification

- **Backward Compatibility**: The existing E2E tests (`tests/e2e/specs/tier1.spec.ts`, `tier3.spec.ts`, and `tier4.spec.ts`) listen directly to specific assignment transition events (`ASSIGNMENT_ACCEPTED`, `ASSIGNMENT_STARTED`, and `ASSIGNMENT_DECLINED`) and check properties on their payload directly.
  - By continuing to emit specific transition events from `domain/assignments/service.ts` alongside `ASSIGNMENT_STATUS_CHANGED`, all existing tests continue to pass.
  - By maintaining all original top-level fields in `TASK_COMMENT` (like `content` and `authorName`) alongside the new nested `comment` payload, we satisfy both the specifications and the tests.
- **Verification**: Run `npx tsx tests/e2e/run.ts` to ensure that all 93 tests in the E2E test suite execute successfully after applying these modifications.
