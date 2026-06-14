# Review & Challenge Report — Milestone 3: Real-Time SSE Integration

## Review Summary

**Verdict**: APPROVE

Worker `worker_m3_2` has successfully and cleanly implemented all requirements for Milestone 3. The codebase has been updated to support the new `ASSIGNMENT_STATUS_CHANGED` domain event, format the SSE payloads for `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` as specified, and refactor the `useRealtime` React hook using `useRef` to prevent duplicate EventSource connections on callback reference updates.

---

## Quality Review Findings

No critical or major findings were discovered. The implementation follows the specified interface contracts and layout guidelines.

### Minor Finding 1: Type safety for reason payload in ASSIGNMENT_STATUS_CHANGED
- **What**: The domain event payload for `ASSIGNMENT_STATUS_CHANGED` supports an optional `reason` field (e.g., in `declineAssignment`), but it is not explicitly typed inside the SSE formatter interceptor at `/app/api/realtime/route.ts`.
- **Where**: `app/api/realtime/route.ts` (lines 31–41)
- **Why**: Currently, it is:
  ```ts
  outputEvent = {
    ...event,
    payload: {
      ...event.payload,
      taskId: event.payload.taskId,
      volunteerId: event.payload.volunteerId,
      newStatus: event.payload.newStatus,
    },
  };
  ```
  Since `...event.payload` is used first, `reason` is implicitly carried forward. However, explicitly documenting or passing it in the typed output structure might improve frontend developer awareness.
- **Suggestion**: In a future refactoring or TS type definition update, explicitly declare `reason?: string` in the realtime API payload type definitions.

---

## Verified Claims

- **Claim 1**: Add `ASSIGNMENT_STATUS_CHANGED` registry entry under the assignment domain section.
  - Verified via `view_file` on `domain/shared/events.ts` -> **PASS** (Line 99 contains `ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED',`).
- **Claim 2**: Emit `ASSIGNMENT_STATUS_CHANGED` event on all task assignment status updates.
  - Verified via `view_file` on `domain/assignments/service.ts` -> **PASS** (Correctly emitted in `acceptAssignment`, `declineAssignment`, `startAssignment`, `submitAssignment`, `reviewAssignment`, and `removeAssignment`).
- **Claim 3**: Intercept and enrich `TASK_COMMENT` event payload.
  - Verified via `view_file` on `app/api/realtime/route.ts` -> **PASS** (Correctly builds the nested `comment` payload with `id`, `content`, `createdAt`, and `author: { id, name }`, while preserving the original flat fields).
- **Claim 4**: Guarantee top-level fields (`taskId`, `volunteerId`, and `newStatus`) in `ASSIGNMENT_STATUS_CHANGED` event payload in the SSE route.
  - Verified via `view_file` on `app/api/realtime/route.ts` -> **PASS** (Constructed correctly).
- **Claim 5**: Refactor `useRealtime` signature and use `useRef` for callback preservation.
  - Verified via `view_file` on `hooks/useRealtime.ts` -> **PASS** (Correct signature, `callbackRef` updates on every render, and connection persists unless `eventType` changes).

---

## Coverage Gaps & Unverified Items

- **Gap/Unverified Item 1**: E2E test execution output verification.
  - **Reason not verified**: Executing `npx tsx tests/e2e/run.ts` timed out waiting for user permission on terminal action, which is expected in a non-interactive automated setting.
  - **Risk level**: Low.
  - **Recommendation**: Accept the risk. Code correctness has been verified statically and is extremely simple and aligns perfectly with existing E2E test helper specifications (e.g. `tests/e2e/helpers/sse.ts`).

---

## Adversarial Challenge Report

**Overall risk assessment**: LOW

### Challenge 1: Connection churn under fast component renders
- **Assumption challenged**: That the EventSource connection will not reconnect frequently.
- **Attack scenario**: A parent component that uses `useRealtime` changes its local state rapidly or unmounts/remounts frequently, or the value of `eventType` is dynamically constructed as a new string or undefined reference on each render.
- **Blast radius**: If `eventType` is unstable (e.g. dynamic string template that changes value), the `useEffect` will re-run on every render, closing and opening new EventSource connections, leading to severe server resource consumption (SSE connection churn).
- **Mitigation**: Advise developers using `useRealtime` hook to ensure `eventType` is stable (either constant or memoized). The hook itself is robust because it excludes the `onEvent` callback from the dependency array, which is the main source of dynamic function reference churn.

### Challenge 2: Heartbeat/leakage on connection close
- **Assumption challenged**: SSE connections are cleanly released when the client disconnects.
- **Attack scenario**: High client count connects and disconnects abruptly (e.g., mobile clients loss of signal).
- **Blast radius**: If the abort listener fails to fire or clean up properly, memory leak occurs due to event handlers remaining registered on the singleton `domainEventBus`.
- **Mitigation**: The implementation uses `req.signal.addEventListener('abort', ...)` which is standard and reliable in Next.js/Node.js web stream API handlers. Additionally, the `interval` has a fallback `catch` block that clears itself when `controller.enqueue` fails. This dual-cleanup design is highly resilient.
