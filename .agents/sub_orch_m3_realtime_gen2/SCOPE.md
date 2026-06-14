# Scope: Milestone 3 - Real-Time SSE Integration

## Architecture
- Real-time communication decouples backend action triggers (comments, state transitions) from frontend synchronization.
- **Domain Event Bus**: Publishes events in-process using `InMemoryDomainEventBus`.
- **SSE API Route (`app/api/realtime/route.ts`)**: Registers event listeners on the event bus and streams serialized JSON events as server-sent events.
- **Client hook (`hooks/useRealtime.ts`)**: Subscribes to the SSE route and enables client-side callback execution or state updates when relevant events occur.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Register ASSIGNMENT_STATUS_CHANGED | Add `ASSIGNMENT_STATUS_CHANGED` to DOMAIN_EVENTS registry and define its payload mapping. | None | IN_PROGRESS |
| 2 | Emit ASSIGNMENT_STATUS_CHANGED | Update `AssignmentService` transition functions to emit `ASSIGNMENT_STATUS_CHANGED` alongside specific events. | M1 | IN_PROGRESS |
| 3 | Update Real-Time SSE Route | Ensure `/api/realtime` SSE route formats `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` events according to client specifications while maintaining backwards compatibility with specific tests. | M2 | IN_PROGRESS |
| 4 | Refine React hook `useRealtime` | Enhance `hooks/useRealtime.ts` to accept callbacks for event subscription (e.g. invalidation, updates). | M3 | IN_PROGRESS |

## Interface Contracts
### 1. `TASK_COMMENT` Payload Over-the-Wire
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

### 2. `ASSIGNMENT_STATUS_CHANGED` Payload Over-the-Wire
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

### 3. React hook signature (`hooks/useRealtime.ts`)
```ts
export function useRealtime<T = any>(
  eventType?: string,
  onEvent?: (event: RealtimeEvent<T>) => void
): { lastEvent: RealtimeEvent<T> | null; isConnected: boolean }
```

## Code Layout
- `domain/shared/events.ts` - Define event type and payload.
- `domain/assignments/service.ts` - Emit `ASSIGNMENT_STATUS_CHANGED` events on transitions.
- `app/api/realtime/route.ts` - Real-time SSE endpoint.
- `hooks/useRealtime.ts` - EventSource subscription client hook.
