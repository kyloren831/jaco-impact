# Adversarial Challenge Report — Milestone 3 Real-Time SSE Integration

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the implementation is correct and matches the requirements, two potential security and reliability risks were identified during the stress-testing analysis.

---

## Challenges

### [Medium] Challenge 1: Connection Leak Risk on Heartbeat Failure

- **Assumption challenged**: The client connection will always abort cleanly, triggering the `req.signal` `abort` event listener to clean up the event bus handlers.
- **Attack scenario**: If a client's network connection drops abruptly without a clean TCP teardown, the `abort` event may not fire immediately. The heartbeat interval will catch a write error when calling `controller.enqueue` and clear itself. However, it does *not* call `domainEventBus.off()` to clean up the registered event listeners.
- **Blast radius**: Over time, stale event listeners will accumulate on the global `domainEventBus` singleton, leading to a memory leak in the long-running Next.js server process.
- **Mitigation**: Define a central `cleanup` function in `/api/realtime/route.ts` and call it both in the `abort` listener and inside the `catch` block of the heartbeat interval to ensure listeners are always cleaned up when a connection is lost:
  ```typescript
  const cleanup = () => {
    clearInterval(interval);
    for (const eventName of eventNames) {
      domainEventBus.off(eventName, sendEvent);
    }
  };
  req.signal.addEventListener('abort', cleanup);
  ```

### [Medium] Challenge 2: Unauthenticated Public SSE Stream

- **Assumption challenged**: Subscription to the `/api/realtime` Server-Sent Events stream does not require authentication or authorization.
- **Attack scenario**: The `GET` handler in `app/api/realtime/route.ts` contains no session verification or role validation. Any anonymous client can connect to the endpoint and receive real-time streams of all task comments (including content and volunteer names) and assignment status changes.
- **Blast radius**: Information disclosure of volunteer interactions, task descriptions, and event statuses to unauthorized third parties.
- **Mitigation**: Implement authentication middleware or verify session tokens inside `app/api/realtime/route.ts` before returning the response. Since the E2E test helper `SSEClient` currently connects anonymously, the E2E test setup must also be updated to authenticate prior to connecting.

---

## Stress Test Results

- **Component Re-renders** → Component re-renders with inline callback function `onEvent` → The hook successfully updates the callback reference in the ref without closing and reopening the EventSource connection → PASS
- **Heartbeat Connection Keep-Alive** → Long-lived SSE connection idle → Heartbeat keeps connection alive every 30 seconds → PASS
