# Handoff Report: Backend State Transitions & Comments Fixes (Milestone 1)

This report details the implementation of security, state transition, and schema validation fixes for Milestone 1.

## 1. Observation

1. **Bootstrap Gap**:
   - In `/home/aaron/Projects/jaco-impact/features/volunteer/actions.ts`, Next.js server actions are compiled independently. When actions were invoked, domain event listeners from `initializeDomainEvents()` were not preloaded or registered.
   
2. **Stale Task Status from Evidences**:
   - In `/home/aaron/Projects/jaco-impact/domain/evidences/service.ts`, `submitEvidence` and `reviewEvidence` directly updated the database state of the `TaskAssignment` without triggering `checkAndDeriveTaskStatus` to recalculate the parent `Task` status.

3. **Comments Authorization Bypass**:
   - In `/home/aaron/Projects/jaco-impact/features/volunteer/actions.ts`, `addTaskCommentAction` and `getTaskCommentsAction` only verified that the user had the `VOLUNTEER` role, but did not check if the volunteer was enrolled/registered in the event of the target task.

4. **Foreign Key Constraint Error**:
   - In `/home/aaron/Projects/jaco-impact/domain/assignments/service.ts`, `checkAndDeriveTaskStatus` hardcoded the system `actorId` as `1`. Because the `ActivityLog` model has a required FK to the `User` table, this would throw a Prisma validation error if a user with ID `1` did not exist.

5. **Concurrency Race Condition**:
   - In `/home/aaron/Projects/jaco-impact/domain/assignments/service.ts`, `checkAndDeriveTaskStatus` ran queries under "Read Committed" isolation, making it prone to concurrency race conditions when multiple volunteers concurrently submit assignments for the same task.

6. **Safety Assignment Checks**:
   - In `/home/aaron/Projects/jaco-impact/domain/assignments/service.ts`, `assignTask` did not check if an `EventParticipation` record existed for the volunteer and event before upserting the task assignment.

7. **Test Suite Omission**:
   - In `test-transitions.ts`, `initializeDomainEvents()` was not invoked, meaning audit log listeners and notifications were never triggered during tests.

---

## 2. Logic Chain

1. **Fixing the Bootstrap Gap**:
   - By importing and executing `initializeDomainEvents()` from `@/domain/shared/init` at the top level of `features/volunteer/actions.ts`, we ensure all domain event listeners (notifications, activity logs) are successfully registered as soon as the volunteer actions file is compiled/loaded by Next.js.
   
2. **Resolving Stale Task Status**:
   - By importing `AssignmentService`, instantiating it, and invoking `checkAndDeriveTaskStatus(taskId, tx, actorId)` inside the interactive transactions of `submitEvidence` and `reviewEvidence` right after updating the assignment status, the parent `Task` status is derived correctly and atomically.

3. **Enforcing Comments Security**:
   - In both `addTaskCommentAction` and `getTaskCommentsAction`, we check if the active user only has the `VOLUNTEER` role. If so, we query the `EventParticipation` table for the event of the target task. If they are not registered or if their participation status is `CANCELLED`, we throw an error to prevent unauthorized read/write access.

4. **Preventing FK Violations dynamically**:
   - Refactoring `checkAndDeriveTaskStatus` to accept `actorId` dynamically and propagating this dynamic actor ID in the `TASK_STATUS_DERIVED` event ensures that the audit logs are created with the ID of the real user triggering the state transition, preventing FK errors.

5. **Eliminating Race Conditions**:
   - Running `await tx.$executeRaw\`SELECT 1 FROM tasks WHERE id = \${taskId} FOR UPDATE\`;` at the beginning of `checkAndDeriveTaskStatus` locks the task row for the transaction duration, forcing concurrent status check transactions to serialize and resolve correctly.

6. **Enforcing Assignment Safety**:
   - Querying `EventParticipation` inside `assignTask` before upserting the assignment ensures that coordinators cannot assign unregistered volunteers to event tasks, throwing a clear, descriptive error instead of leaking raw DB constraints.

7. **Improving Test Coverage**:
   - Registering domain events at the beginning of `test-transitions.ts` ensures audit log creation and notifications are fully exercised in the test suite.

---

## 3. Caveats

- We assumed default PostgreSQL isolation level is "Read Committed".
- Execution of commands inside the shell timed out due to the non-interactive/permission-gated environment. Code correctness was statically verified.

---

## 4. Conclusion

All requested code correctness, security, validation, and testing fixes for Milestone 1 have been implemented in accordance with the specifications.

---

## 5. Verification Method

To independently verify the fixes:
1. Run `npx tsx test-transitions.ts` to ensure database sandboxing executes all status transitions and audit logs/notifications function without error.
2. Inspect the modifications in `features/volunteer/actions.ts` to check `initializeDomainEvents()` and comment authorization guards.
3. Inspect `domain/evidences/service.ts` to verify `checkAndDeriveTaskStatus` invocation.
4. Inspect `domain/assignments/service.ts` to confirm row locking, dynamic `actorId`, and registration check in `assignTask`.
