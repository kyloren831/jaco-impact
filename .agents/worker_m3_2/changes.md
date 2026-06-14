# Code Changes

Summary of changes implemented for Milestone 3 (Real-Time SSE Integration):

1. **domain/shared/events.ts**:
   - Added `ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED',` to the `DOMAIN_EVENTS` registry under the Assignment domain section.

2. **domain/assignments/service.ts**:
   - Updated each of the state transition methods (`acceptAssignment`, `declineAssignment`, `startAssignment`, `submitAssignment`, `reviewAssignment`, and `removeAssignment`) to also emit the `ASSIGNMENT_STATUS_CHANGED` domain event with the required metadata and payload structure. For `declineAssignment`, the payload also includes the `reason` field.

3. **app/api/realtime/route.ts**:
   - Updated the `sendEvent` callback inside the `GET` function of the EventSource endpoint to intercept `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` events.
   - For `TASK_COMMENT`, the output payload has both flat fields and a nested `comment` structure containing `id`, `content`, `createdAt`, and `author: { id, name }`.
   - For `ASSIGNMENT_STATUS_CHANGED`, the output payload is formatted to guarantee `taskId`, `volunteerId`, and `newStatus` are at the top level of the payload.

4. **hooks/useRealtime.ts**:
   - Refactored the hook signature to accept `onEvent` as a second parameter.
   - Saved `onEvent` in `callbackRef` via `useRef`, updated on every render to prevent closing/reopening the EventSource connection when only the callback reference changes.
   - Invoked `callbackRef.current(parsedEvent)` when a matching event is received.
