# Challenge Report — Milestone 3: Real-Time SSE Integration

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the core functionality of broadcasting events and using a connection-resilient `useRealtime` hook is solid, the implementation leaves several edge cases, concurrent transition risks, and intermediate state transitions unhandled.

---

## Challenges

### [Medium] Challenge 1: Missing intermediate status change event (`UNDER_REVIEW`)

- **Assumption challenged**: All database assignment status transitions are broadcasted as events to keep SSE clients in sync.
- **Attack scenario**: In `reviewAssignment` in `domain/assignments/service.ts`, when a coordinator reviews an assignment that is currently `SUBMITTED`, the service first updates the status to `UNDER_REVIEW` and then transitions it to `APPROVED`/`REJECTED`/`REVISION_REQUESTED`. While both changes are persisted in the transaction, the `ASSIGNMENT_STATUS_CHANGED` event is only emitted once at the very end of the method.
- **Blast radius**: The intermediate state `UNDER_REVIEW` is never broadcasted to clients. Any dashboard relying on the event stream to show an "In Review" status badge will never update to it, causing desynchronization with the database.
- **Mitigation**: Emit a separate `ASSIGNMENT_STATUS_CHANGED` event immediately after the database update to `UNDER_REVIEW` inside `reviewAssignment`.

---

### [Low] Challenge 2: Missing initial status change event (`PENDING_ACCEPTANCE`)

- **Assumption challenged**: The client can construct the full state history of an assignment by listening to `ASSIGNMENT_STATUS_CHANGED`.
- **Attack scenario**: When `assignTask` is called to create or update an assignment, it transitions to `PENDING_ACCEPTANCE`. However, the service only emits `TASK_ASSIGNED` and does not emit `ASSIGNMENT_STATUS_CHANGED`.
- **Blast radius**: Clients listening only to `ASSIGNMENT_STATUS_CHANGED` will miss the initial state of the assignment. They must implement custom logic to listen to both `TASK_ASSIGNED` and `ASSIGNMENT_STATUS_CHANGED` to trace the assignment's lifecycle.
- **Mitigation**: Emit `ASSIGNMENT_STATUS_CHANGED` inside `assignTask` with `newStatus` set to `PENDING_ACCEPTANCE`.

---

### [Medium] Challenge 3: Concurrent status changes race conditions without row locking

- **Assumption challenged**: Wrapping status changes in transactions is sufficient to prevent race conditions during concurrent transitions.
- **Attack scenario**: If a volunteer clicks "Accept" and "Decline" concurrently (or a volunteer declines while a coordinator approves), both requests will run `findUniqueOrThrow` concurrently, read the same initial state, transition, and update. Unlike `checkAndDeriveTaskStatus` which locks the task row via `FOR UPDATE`, the status transition methods do not lock the `TaskAssignment` row.
- **Blast radius**: Parallel updates can overwrite each other (last-write-wins), but both corresponding domain events will be emitted and broadcasted. This creates a state mismatch between the database (e.g. status is `DECLINED`) and the event history (where it says both `ACCEPTED` and `DECLINED` happened, leading to invalid event sequences).
- **Mitigation**: Add a row lock (`SELECT 1 FROM task_assignments WHERE taskId = ... AND volunteerId = ... FOR UPDATE`) at the beginning of each assignment state-transition database transaction.

---

### [Low] Challenge 4: Potential Event Bus Listener Memory Leak on Connection Drops

- **Assumption challenged**: Next.js client request abortion is 100% reliable at cleaning up event listeners.
- **Attack scenario**: In serverless, server-side, or edge deployments of Next.js, or in abnormal network disconnects, the `req.signal.addEventListener('abort', ...)` event might not trigger reliably, or the callback might not run. If this happens, the `sendEvent` listener is never removed from the `InMemoryDomainEventBus` singleton.
- **Blast radius**: The `Set` of handlers in `InMemoryDomainEventBus` will grow continuously with dead listener references, causing a memory leak and degrading event dispatch performance over time.
- **Mitigation**: Implement a heartbeat cleanup that periodically trims stale listeners, or introduce an active connection check before writing to the SSE controller.

---

## Stress Test Results

- **Scenario 1: Rapid onEvent Callback Changes**
  - *Expected Behavior*: Connection remains open; the new callback is invoked when an event arrives.
  - *Actual/Predicted Behavior*: PASS. The use of `useRef` updates the reference on every render without triggering `useEffect` reconnection.
- **Scenario 2: Concurrent Accept/Decline Transitions**
  - *Expected Behavior*: One transaction succeeds, and the other fails with a state transition error. Only one valid event is emitted.
  - *Actual/Predicted Behavior*: FAIL. In the absence of row-level locks on `TaskAssignment`, both transactions can read the same initial state concurrently. One will overwrite the other in the DB, but both events are emitted and broadcasted.
- **Scenario 3: EventType Dynamic Swaps**
  - *Expected Behavior*: Client switches interest to a new event type smoothly.
  - *Actual/Predicted Behavior*: PASS/WARN. The connection is recreated because `eventType` is in the dependency array, but any events emitted during the reconnect window are missed.

---

## Unchallenged Areas

- **Client-Side Cache Invalidation UI Integration** — Reason not challenged: Out of scope (Milestone 4).
- **S3 Upload Security Policies** — Reason not challenged: Out of scope (Milestone 2).
