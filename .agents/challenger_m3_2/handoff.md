# Handoff Report — challenger_m3_2

## 1. Observation

- **Observation A: Gaps in `ASSIGNMENT_STATUS_CHANGED` event emission in `domain/assignments/service.ts`**
  - In `reviewAssignment` (lines 278-283), the code updates the assignment state to `UNDER_REVIEW` first:
    ```typescript
          if (tempStatus === AssignmentStatus.SUBMITTED) {
            tempStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus.UNDER_REVIEW);
            await tx.taskAssignment.update({
              where: { taskId_volunteerId: { taskId, volunteerId } },
              data: { status: tempStatus }
            });
          }
    ```
    However, the `ASSIGNMENT_STATUS_CHANGED` domain event is only emitted once at the very end of the method (lines 319-330) with the final status:
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
  - In `assignTask` (lines 47-81), the task assignment is created or updated to `PENDING_ACCEPTANCE` in the database, but only `DOMAIN_EVENTS.TASK_ASSIGNED` is emitted, not `ASSIGNMENT_STATUS_CHANGED`.

- **Observation B: Lack of Row-level Locking on `TaskAssignment`**
  - While `checkAndDeriveTaskStatus` uses PostgreSQL raw query `SELECT 1 FROM tasks WHERE id = ${taskId} FOR UPDATE` to serialize parent task status derivations, none of the status transition methods (like `acceptAssignment`, `declineAssignment`, etc.) employ row locking on `TaskAssignment` records.

- **Observation C: Callback Caching in `hooks/useRealtime.ts`**
  - The hook implements `useRef` caching for `onEvent` correctly (lines 17-18):
    ```typescript
      const callbackRef = useRef(onEvent);
      callbackRef.current = onEvent;
    ```
    This reference is called in the listener and prevents `useEffect` from re-triggering when the callback changes (since only `eventType` is in the dependency array).

- **Observation D: Test Command Execution**
  - Attempted to run the E2E tests via the command:
    ```bash
    npx tsx tests/e2e/run.ts
    ```
    The command execution timed out with:
    `Permission prompt for action 'command' on target 'npx tsx tests/e2e/run.ts' timed out waiting for user response. The user was not able to provide permission on time.`

---

## 2. Logic Chain

- **Logic Chain A (Missing Event Emissions)**:
  - From **Observation A**, because `reviewAssignment` updates the DB to `UNDER_REVIEW` but only emits `ASSIGNMENT_STATUS_CHANGED` at the end for the final status, the `UNDER_REVIEW` state change event is never broadcasted to the clients.
  - Similarly, since `assignTask` does not emit `ASSIGNMENT_STATUS_CHANGED`, any client dashboard subscribing to it will miss the initial transition to `PENDING_ACCEPTANCE`.
  - Therefore, the event stream is incomplete and inconsistent with database history.

- **Logic Chain B (Concurrency Vulnerability)**:
  - From **Observation B**, since no row-level lock is acquired on `TaskAssignment` during status transitions, concurrent requests on the same assignment can read the same initial state concurrently.
  - This allows both state machines to transition and write back to the database, resulting in a race condition where the last-write-wins, but conflicting events for both states will be broadcasted to SSE.

- **Logic Chain C (Hook Callback Lifecycle)**:
  - From **Observation C**, using `useRef` prevents unnecessary reconnection cycles when the `onEvent` handler changes, successfully solving the callback lifecycle requirements.

- **Logic Chain D (E2E Verification)**:
  - From **Observation D**, because the execution environment is non-interactive and permission prompts timed out, the E2E test results could not be dynamically verified. Static code analysis was used as the primary verification method.

---

## 3. Caveats

- E2E tests could not be run or verified dynamically due to terminal execution permissions timing out.
- Assumed that client-side components do not expect `createdAt` in `TASK_COMMENT` payload to be parsed back to a `Date` object on arrival (it is serialized to an ISO-8601 string).

---

## 4. Conclusion

- The callback caching mechanism in the React hook and SSE payload formatting are correctly implemented.
- However, there are gaps in domain event integrity (missing `UNDER_REVIEW` and initial `PENDING_ACCEPTANCE` events) and potential race conditions during concurrent status changes due to lack of row locking on `TaskAssignment`.

---

## 5. Verification Method

To verify these findings:
1. Open `/home/aaron/Projects/jaco-impact/domain/assignments/service.ts` and locate the `reviewAssignment` and `assignTask` methods to verify the missing event emissions.
2. Verify the lack of `FOR UPDATE` or alternative locks on `TaskAssignment` during transitions.
3. Run the following command in an interactive terminal to run the E2E test suite:
   ```bash
   npx tsx tests/e2e/run.ts
   ```
