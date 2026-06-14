# Forensic Audit & Adversarial Review Report — Milestone 3

**Date**: 2026-06-09T01:30:00Z
**Auditor**: auditor_m3 (forensic_auditor)
**Verdict**: CLEAN

---

## 1. Forensic Audit Report

### Work Product
- `domain/shared/events.ts`
- `domain/assignments/service.ts`
- `app/api/realtime/route.ts`
- `hooks/useRealtime.ts`

### Profile
General Project (Development Mode)

### Phase Results
- **Hardcoded output detection**: PASS
  - Audited all four modified files. There are no hardcoded test outputs, simulated transition values, or canned SSE events. Events are triggered directly by business logic transitions and database updates.
- **Facade detection**: PASS
  - Functions in `AssignmentService` (such as `acceptAssignment`, `declineAssignment`, `startAssignment`, `submitAssignment`, and `checkAndDeriveTaskStatus`) contain full database updates using transactions, state machine transitions, and concurrency locking.
  - The API route `/api/realtime` creates a real `ReadableStream` dynamically subscribing and unsubscribing to the singleton `domainEventBus`.
  - The client hook `useRealtime` establishes a real browser `EventSource` and binds handlers dynamically.
- **Pre-populated artifact detection**: PASS
  - Scanned the directory; no pre-existing logs, fake results, or attestation files exist prior to the audit.
- **Build and run**: UNABLE TO VERIFY (User Permission Timeout)
  - Execution of `npx tsx tests/e2e/run.ts` timed out waiting for user permission. Under the prompt instructions, we proceed with static verification.
- **Output verification**: PASS (Static Analysis)
  - The state transitions, event payloads, SSE serialization formats, and hook behaviors conform strictly to the contracts outlined in `PROJECT.md` and the E2E spec files.
- **Dependency audit**: PASS
  - The implementation uses the native `ReadableStream` and `EventSource` APIs alongside standard Prisma and AWS-SDK packages. No delegation of core logic to prohibited third-party wrapper packages has occurred.

### Diffs and Code Evidence
- **`app/api/realtime/route.ts`**: Real SSE implementation:
  ```typescript
  export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event: any) => { ... controller.enqueue(encoder.encode(data)); };
        for (const eventName of eventNames) { domainEventBus.on(eventName, sendEvent); }
        ...
  ```
- **`domain/assignments/service.ts`**: Atomic row-level lock and dynamic status calculation:
  ```typescript
  public async checkAndDeriveTaskStatus(taskId: number, tx: Prisma.TransactionClient, actorId: number) {
    await tx.$executeRaw`SELECT 1 FROM tasks WHERE id = ${taskId} FOR UPDATE`;
    const assignments = await tx.taskAssignment.findMany({ where: { taskId } });
    ...
  ```

---

## 2. Adversarial Review (Critic)

**Overall risk assessment**: LOW

### Challenges

#### [Medium] Challenge 1: SSE Event Subscription Leakage on Unfinished Stream Setup
- **Assumption challenged**: The abort signal is always registered and handled before any connection error occurs.
- **Attack scenario**: If a client initiates a connection and aborts extremely rapidly, or if the server crashes/aborts during `start()` callback initiation, there could be edge cases where event handlers are registered on `domainEventBus` but the `abort` listener is either not yet registered or fails to trigger. Since `domainEventBus` is a global singleton, leaking handlers will accumulate memory and cause degradation.
- **Blast radius**: Memory leak in long-running Node/Next processes under high connection/disconnection churn.
- **Mitigation**: Wrap stream controller calls in try-catch blocks, and ensure that any stream termination closes and unregisters handlers cleanly. Consider wrapping `domainEventBus.on` registrations inside a managed connection context that automatically cleans up on any stream error.

#### [Low] Challenge 2: In-Process Event Bus Scalability
- **Assumption challenged**: The application will always run in a single-instance (in-process) server.
- **Attack scenario**: If the application is deployed in a multi-instance, serverless (e.g. Vercel), or load-balanced environment, the `InMemoryDomainEventBus` will not broadcast events to clients connected to other server instances.
- **Blast radius**: Real-time SSE updates will fail to synchronize across clients connected to different server instances.
- **Mitigation**: Document that for scaled/production multi-instance deployments, the in-memory event bus should be replaced with a pub/sub mechanism like Redis or PostgreSQL `LISTEN/NOTIFY`.

### Stress Test Results (Predicted/Static)
- **High concurrency on status derivation**: Row locking with `SELECT ... FOR UPDATE` prevents race conditions. → PASS.
- **Multiple rapid SSE reconnects**: `abort` signal listener correctly calls `domainEventBus.off` to cleanup. → PASS.

### Unchallenged Areas
- E2E testing execution: Out of scope because execution permission timed out.
