## Challenge Summary

**Overall risk assessment**: HIGH

Milestone 3 implements the real-time Server-Sent Events (SSE) route, registers domain events, and provides a custom client-side React hook `useRealtime` to facilitate dynamic subscriptions. However, the system exhibits critical vulnerabilities and functional bugs that jeopardize both performance and system integration correctness under normal operating conditions.

---

## Challenges

### [High] Challenge 1: Missing `ASSIGNMENT_STATUS_CHANGED` Event on Evidence Submission and Reviews

- **Assumption challenged**: The implementation assumed that emitting `ASSIGNMENT_STATUS_CHANGED` exclusively inside `AssignmentService` transition methods is sufficient to cover all real-time assignment status synchronization requirements.
- **Attack scenario**: In the actual application flow:
  1. A volunteer submits their assignment by uploading evidence using `submitEvidence` in `EvidenceService` (instead of calling `submitAssignment` directly). This transitions the `TaskAssignment` status to `SUBMITTED`.
  2. A coordinator reviews and approves the evidence using `reviewEvidence` in `EvidenceService`, which transitions the `TaskAssignment` status to `APPROVED` or `REVISION_REQUESTED`.
  Because `EvidenceService` updates the database directly and does not emit `ASSIGNMENT_STATUS_CHANGED` (it only emits `EVIDENCE_SUBMITTED`, `EVIDENCE_APPROVED`, or `EVIDENCE_REJECTED`), no real-time status changed events are streamed to other clients.
- **Blast radius**: The real-time Kanban board (Milestone 4) and any dashboard using `useRealtime` to track volunteer assignment status in real-time will remain unsynced and stale for the two most critical workflow steps (submitting evidence and coordinating reviews).
- **Mitigation**: Update `submitEvidence` and `reviewEvidence` inside `domain/evidences/service.ts` to explicitly emit `ASSIGNMENT_STATUS_CHANGED` on the domain event bus alongside the evidence events, or refactor `EvidenceService` to invoke state-change triggers through a unified status coordinator.

### [High] Challenge 2: Memory Leak via Accumulated Dead Event Listeners on Heartbeat/Write Failures

- **Assumption challenged**: The SSE route assumes that the `'abort'` event on `req.signal` is the sole and foolproof mechanism required to clean up client listeners.
- **Attack scenario**: When a write error occurs in the keep-alive heartbeat interval (indicating a dead or half-closed TCP connection), the exception is caught and `clearInterval(interval)` is executed. However, the event handlers are *never* removed from `domainEventBus` under this execution path. If a proxy or network condition drops a connection without properly propagating the abort signal to Next.js's request object, the `sendEvent` listener remains registered on the `InMemoryDomainEventBus` forever.
- **Blast radius**: Server memory leak. Since the `domainEventBus` holds strong references to `sendEvent` callbacks, all closed over variables (including the controller, encoder, and request object) will remain pinned in memory, leading to heap exhaustion under heavy user connect/disconnect traffic.
- **Mitigation**: Clean up the event bus listeners inside the `catch` block of both `sendEvent` and the heartbeat `setInterval` in `app/api/realtime/route.ts`:
  ```ts
  const cleanup = () => {
    clearInterval(interval);
    for (const eventName of eventNames) {
      domainEventBus.off(eventName, sendEvent);
    }
  };
  ```

### [Medium] Challenge 3: Broad Broadcast of All Events Without Authentication or Security Isolation

- **Assumption challenged**: The `/api/realtime` route assumes it is acceptable to stream every single global domain event to any client holding an open SSE connection.
- **Attack scenario**: Any user (including unauthorized volunteers or malicious actors) can establish a connection to `/api/realtime`. Because there is no check for user permissions or event relevance, the endpoint registers listeners for *all* `DOMAIN_EVENTS` and pushes them directly down the pipe.
- **Blast radius**: Information disclosure. Unauthorized users can sniff other volunteers' assignments, task comments, and registration records simply by listening to the SSE stream.
- **Mitigation**: Implement middleware authorization or session verification in the `GET` function of `app/api/realtime/route.ts` to filter event delivery based on the client's permissions or event scope (e.g. only broadcast comments of events the user is registered to).

### [Low] Challenge 4: Misleading Developer Console Output on Client Callback Exception

- **Assumption challenged**: The `useRealtime` hook assumes that any error caught in the message processing block is a JSON parse error.
- **Attack scenario**: A client registers an `onEvent` callback that contains a bug (e.g., trying to read properties from a null state). When an SSE event is received, `onmessage` executes the callback, which throws. The broad `try-catch` catches it and prints `Failed to parse realtime event data: [Error]`.
- **Blast radius**: Prolonged debugging cycles for front-end developers, who are misled to believe that the SSE payload was malformed JSON instead of their own callback throwing.
- **Mitigation**: Wrap only `JSON.parse` in the try-catch block, or log separate error messages for parsing vs. callback execution:
  ```ts
  let parsedEvent: RealtimeEvent<T>;
  try {
    parsedEvent = JSON.parse(event.data);
  } catch (err) {
    console.error('Failed to parse realtime event data:', err);
    return;
  }
  
  if (!eventType || parsedEvent.type === eventType) {
    setLastEvent(parsedEvent);
    if (callbackRef.current) {
      try {
        callbackRef.current(parsedEvent);
      } catch (cbErr) {
        console.error('Error executing useRealtime callback:', cbErr);
      }
    }
  }
  ```

---

## Stress Test Results

- **Scenario 1**: Concurrent status transitions on the same Task.
  - *Expected behavior*: Task status derivation is serialized using PostgreSQL pessimistic locking (`FOR UPDATE` on tasks), resulting in consistent final Task state (`IN_REVIEW`).
  - *Predicted behavior*: Succeeded. The locking pattern successfully prevents race conditions, as demonstrated by the `tests/stress-concurrency.ts` helper.
  - *Pass/Fail*: PASS (for DB state consistency).

- **Scenario 2**: SSE Event Broadcast on Evidence Upload/Approval.
  - *Expected behavior*: Client receives `ASSIGNMENT_STATUS_CHANGED` with `newStatus: "SUBMITTED"` and `newStatus: "APPROVED"`.
  - *Predicted behavior*: Failed. The `EvidenceService` updates assignments directly and does not emit the `ASSIGNMENT_STATUS_CHANGED` event on the bus.
  - *Pass/Fail*: FAIL (due to missing event emissions).

- **Scenario 3**: Connection disconnect on keep-alive failure.
  - *Expected behavior*: Heartbeat failure triggers cleanup of listeners in the event bus.
  - *Predicted behavior*: Failed. The heartbeat error block clears the interval but fails to call `domainEventBus.off(...)` to unregister listeners, causing a memory leak.
  - *Pass/Fail*: FAIL (due to memory leak).

---

## Unchallenged Areas

- **S3/R2 upload performance** — S3/MinIO/R2 physical upload latency and concurrency were not stress-tested because the S3 client is mocked (`MOCK_S3=true`) during E2E runs.
