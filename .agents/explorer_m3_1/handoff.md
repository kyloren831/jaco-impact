# Handoff Report - Milestone 3: Real-Time SSE Integration

This report describes findings, logic chain, and implementation plans for the Real-Time SSE Integration milestone.

## 1. Observation
- **Event Registry**: In `domain/shared/events.ts`, the list of `DOMAIN_EVENTS` (lines 73-108) contains specific assignment events (`ASSIGNMENT_ACCEPTED`, `ASSIGNMENT_DECLINED`, etc.) but does not define `ASSIGNMENT_STATUS_CHANGED`.
- **Assignment Transitions**: In `domain/assignments/service.ts`, transition methods (like `acceptAssignment` lines 85-116, `declineAssignment` lines 118-150, etc.) emit their respective specific events but do not emit `ASSIGNMENT_STATUS_CHANGED`.
- **SSE API Route**: In `app/api/realtime/route.ts`, the `sendEvent` function (lines 12-19) serializes and streams events verbatim:
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
- **Real-Time Client Hook**: In `hooks/useRealtime.ts`, the `useRealtime` hook signature is:
  ```typescript
  export function useRealtime<T = any>(eventType?: string)
  ```
  It has no support for client callbacks on incoming events.
- **E2E Tests and Specifications**: `tests/e2e/specs/tier1.spec.ts` verifies SSE events such as `TASK_COMMENT` by checking properties directly in `payload`:
  ```typescript
  assert.strictEqual(commentEvent.payload.taskId, seed.task1.id);
  assert.strictEqual(commentEvent.payload.content, "Realtime comment");
  assert.strictEqual(commentEvent.payload.authorName, "Volunteer One");
  ```
  However, `PROJECT.md` specifies `TASK_COMMENT` over-the-wire should contain a nested `comment` object:
  ```markdown
  * Broadcast format: `data: {"type": "TASK_COMMENT", "payload": { "taskId": 12, "comment": { "id": 1, "content": "...", "createdAt": "...", "author": { "name": "..." } } }}`
  ```

---

## 2. Logic Chain
- **Adding Event Definitions**: Since `ASSIGNMENT_STATUS_CHANGED` is requested as a general event for all transitions, we must define it inside `domain/shared/events.ts` to make it a first-class domain event type.
- **Emitting Events on Transitions**: To track assignment lifecycle changes in a unified stream, `AssignmentService` must emit `ASSIGNMENT_STATUS_CHANGED` in all state-altering operations (`accept`, `decline`, `start`, `submit`, `review`, `remove`), mapping `newStatus` and other relevant parameters to the payload.
- **Merging Flat and Nested Properties**: E2E tests check for flat fields (`taskId`, `content`, `authorName`), while design specifications expect nested properties. To satisfy both, we must merge both sets of properties inside the formatted payload of the `TASK_COMMENT` event in `app/api/realtime/route.ts`.
- **Formatting `ASSIGNMENT_STATUS_CHANGED`**: The SSE stream must format the `ASSIGNMENT_STATUS_CHANGED` event payload according to the spec, which consists of `taskId`, `volunteerId`, and `newStatus` at the top level.
- **Supporting Hook Callbacks**: Clients of `useRealtime` need to handle messages dynamically (e.g., to trigger cache invalidation or optimistic state updates). Adding an optional callback parameter `onEvent` solves this. Storing the callback in a `useRef` ensures updating the callback reference on parent re-renders does not close and recreate the EventSource connection.

---

## 3. Caveats
- Since tests were run without local command execution approval (due to user permission prompt timing out), the E2E verification is based purely on static code analysis of the spec assertions.
- We assume that `ASSIGNMENT_STATUS_CHANGED` is not needed in the activity logging system since specific transition events are already logged. Adding it to `auditMapping` in `domain/audit/service.ts` would create duplicated logs.

---

## 4. Conclusion
The implementation plan is fully scoped, backward compatible, and ready. We have created a complete file change proposal (described in `analysis.md`) that will define and emit `ASSIGNMENT_STATUS_CHANGED`, format `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` in `route.ts`, and support react hook callbacks in `useRealtime`.

---

## 5. Verification Method
1. Inspect the code changes in the 4 files (`domain/shared/events.ts`, `domain/assignments/service.ts`, `app/api/realtime/route.ts`, `hooks/useRealtime.ts`) to ensure the structures match the proposed snippets.
2. Run the E2E test suite to confirm no regressions and that real-time tests pass successfully:
   ```bash
   npx ts-node tests/e2e/run.ts
   ```
3. Verify that all 40 tests (specifically Section 8: Real-Time SSE Broadcasting) pass completely.
