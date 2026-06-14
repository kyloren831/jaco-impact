# Handoff Report: Milestone 3 - Real-Time SSE Integration

This handoff report details the observations, logic chain, conclusion, and verification methods for implementing the Milestone 3: Real-Time SSE Integration tasks.

---

## 1. Observation

During the investigation, the following files and code snippets were directly observed:

1. **`domain/shared/events.ts`**
   - Lines 88-99 outline the assignment events in `DOMAIN_EVENTS`:
     ```typescript
     // Assignment domain
     TASK_CREATED: 'TASK_CREATED',
     TASK_ASSIGNED: 'TASK_ASSIGNED',
     ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
     ASSIGNMENT_DECLINED: 'ASSIGNMENT_DECLINED',
     ASSIGNMENT_STARTED: 'ASSIGNMENT_STARTED',
     ASSIGNMENT_SUBMITTED: 'ASSIGNMENT_SUBMITTED',
     ASSIGNMENT_APPROVED: 'ASSIGNMENT_APPROVED',
     ASSIGNMENT_REVISION_REQUESTED: 'ASSIGNMENT_REVISION_REQUESTED',
     ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
     TASK_STATUS_DERIVED: 'TASK_STATUS_DERIVED',
     ```
     No `ASSIGNMENT_STATUS_CHANGED` event exists in the registry.

2. **`domain/assignments/service.ts`**
   - Emits specific assignment events on the `domainEventBus` but does not currently emit `ASSIGNMENT_STATUS_CHANGED` during state transitions:
     - `acceptAssignment` (lines 85-116) emits `DOMAIN_EVENTS.ASSIGNMENT_ACCEPTED`.
     - `declineAssignment` (lines 118-150) emits `DOMAIN_EVENTS.ASSIGNMENT_DECLINED`.
     - `startAssignment` (lines 152-183) emits `DOMAIN_EVENTS.ASSIGNMENT_STARTED`.
     - `submitAssignment` (lines 185-216) emits `DOMAIN_EVENTS.ASSIGNMENT_SUBMITTED`.
     - `reviewAssignment` (lines 218-268) emits `DOMAIN_EVENTS.ASSIGNMENT_APPROVED` or `DOMAIN_EVENTS.ASSIGNMENT_REVISION_REQUESTED`.
     - `removeAssignment` (lines 270-302) emits `DOMAIN_EVENTS.ASSIGNMENT_CANCELLED`.

3. **`app/api/realtime/route.ts`**
   - Contains the SSE endpoint stream, where lines 12-19 define:
     ```typescript
     const sendEvent = (event: any) => {
       try {
         const data = `data: ${JSON.stringify(event)}\n\n`;
         controller.enqueue(encoder.encode(data));
       } catch (e) {
         // Ignore write errors (e.g. client disconnected)
       }
     };
     ```
     No event-specific payload formatting is performed before JSON serialization.

4. **`hooks/useRealtime.ts`**
   - The current client hook implementation is:
     ```typescript
     export function useRealtime<T = any>(eventType?: string) {
       const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);
       const [isConnected, setIsConnected] = useState(false);
       // ...
     ```
     It does not accept a callback handler parameter and depends solely on `eventType` for state updates.

5. **`tests/e2e/specs/tier1.spec.ts`**
   - Lines 652-668 assert the `TASK_COMMENT` event payload fields directly:
     ```typescript
     assert.strictEqual(commentEvent.payload.taskId, seed.task1.id);
     assert.strictEqual(commentEvent.payload.content, "Realtime comment");
     assert.strictEqual(commentEvent.payload.authorName, "Volunteer One");
     ```
   - Lines 684-742 assert specific event types (e.g., `ASSIGNMENT_ACCEPTED`, `ASSIGNMENT_STARTED`, `ASSIGNMENT_DECLINED`) and check fields like `payload.taskId`, `payload.newStatus`, `payload.volunteerId`.

---

## 2. Logic Chain

1. **Defining the Event**: 
   - To support `ASSIGNMENT_STATUS_CHANGED` across the domain model, it must be added to the registry in `domain/shared/events.ts`. This makes it available for service emission, route subscription, and client-side subscriptions.
   
2. **Emitting State Transitions**:
   - The objective requires emitting `ASSIGNMENT_STATUS_CHANGED` when assignments transition.
   - We must append calls to `domainEventBus.emit` with `type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED` in the methods `acceptAssignment`, `declineAssignment`, `startAssignment`, `submitAssignment`, `reviewAssignment`, and `removeAssignment`.
   - In `reviewAssignment`, there are two potential transitions: first to `UNDER_REVIEW` (if the state was `SUBMITTED`), and second to the final status (e.g., `APPROVED`, `REVISION_REQUESTED`). Emitting `ASSIGNMENT_STATUS_CHANGED` for both transitions ensures the client receives a sequential, accurate log of state changes.
   - To maintain backward compatibility with existing tests, the specific events (like `ASSIGNMENT_ACCEPTED` and `ASSIGNMENT_STARTED`) must continue to be emitted alongside `ASSIGNMENT_STATUS_CHANGED`.

3. **Formatting the Real-time Route Payloads**:
   - According to `SCOPE.md`, the client expects a nested `comment` field in `TASK_COMMENT` and a stripped down payload in `ASSIGNMENT_STATUS_CHANGED` containing only `taskId`, `volunteerId`, and `newStatus`.
   - However, existing E2E tests expect top-level fields on the `TASK_COMMENT` payload (like `content` and `authorName`).
   - Therefore, in `/api/realtime/route.ts`, the `sendEvent` function must intercept `TASK_COMMENT` and restructure its payload to contain BOTH the original top-level properties and the new nested `comment` object. For `ASSIGNMENT_STATUS_CHANGED`, the payload must be formatted to include only `taskId`, `volunteerId`, and `newStatus`.

4. **Updating the React Hook**:
   - To support callback registration, the `useRealtime` hook signature needs to be updated to:
     ```typescript
     export function useRealtime<T = any>(
       eventType?: string,
       onEvent?: (event: RealtimeEvent<T>) => void
     )
     ```
   - Standard React behaviour causes inline functions passed as callbacks (e.g., `useRealtime('EVENT_TYPE', (e) => { ... })`) to be redefined on every component render. 
   - If the callback was added to the `useEffect` dependency array, it would tear down and reconnect the SSE connection on every render, causing severe performance issues.
   - To resolve this, a `useRef` is used to hold the latest `onEvent` callback, allowing it to be invoked from the message listener without restarting the SSE connection.

---

## 3. Caveats

1. **Double Logging**: Adding `ASSIGNMENT_STATUS_CHANGED` to the `auditMapping` registry in `domain/audit/service.ts` would result in duplicate activity logs (since the specific transition events are already logged). It is intentionally excluded from the audit log mapping to prevent duplicates.
2. **Reconnections**: The use of `useRef` to store the callback is critical. If future implementers remove the `useRef` pattern, the SSE connections will loop reconnect on every client re-render where an unmemoized inline handler is passed.

---

## 4. Conclusion

The real-time SSE integration can be implemented cleanly by:
1. Adding the `ASSIGNMENT_STATUS_CHANGED` event type in `events.ts`.
2. Appending domain event emission in `service.ts` alongside existing events for all transition methods, including double-transition handling in `reviewAssignment`.
3. Adding formatting logic to `route.ts` that provides nested objects for clients while preserving top-level properties for E2E tests.
4. Implementing a ref-memoized event handler pattern in `useRealtime.ts` to allow callback registration.

---

## 5. Verification Method

To independently verify this implementation:
1. Apply the proposed code changes (refer to `analysis.md` for exact patches).
2. Execute the E2E test suite command:
   ```bash
   npx tsx tests/e2e/run.ts
   ```
3. Verify that all 93 tests (comprising Tiers 1-4) pass.
4. Monitor server-sent event streams via dev tools to verify that:
   - `TASK_COMMENT` contains both top-level and nested `comment` structures.
   - `ASSIGNMENT_STATUS_CHANGED` events are broadcasted on state changes containing only `taskId`, `volunteerId`, and `newStatus`.
