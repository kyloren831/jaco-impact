## 2026-06-07T23:46:37Z

Your mission is to apply code correctness and security fixes for Milestone 1: Backend State Transitions & Comments.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m1_backend_fix/.
Your parent is 5d3060ae-97d1-4f20-9b2b-ea84d99a927d.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please do the following:
1. Read the Reviewer's findings reports:
   - Review Findings: /home/aaron/Projects/jaco-impact/.agents/reviewer_m1_backend/review.md
   - Review Handoff: /home/aaron/Projects/jaco-impact/.agents/reviewer_m1_backend/handoff.md
2. Implement the proposed fixes:
   - **Fix 1: bootstrap gap**: Call `initializeDomainEvents()` from `@/domain/shared/init` at the top level of `features/volunteer/actions.ts`.
   - **Fix 2: task status staleness from evidences**: In `domain/evidences/service.ts`, import `AssignmentService`, instantiate it, and invoke `checkAndDeriveTaskStatus(taskId, tx, actorId)` inside the interactive transactions of `submitEvidence` and `reviewEvidence` right after updating the assignment status. Make sure the `checkAndDeriveTaskStatus` function signature in `AssignmentService` is public.
   - **Fix 3: comments authorization bypass**: In `addTaskCommentAction` and `getTaskCommentsAction` in `features/volunteer/actions.ts`, if the user has the `VOLUNTEER` role (and does NOT have `ADMIN` or `COORDINATOR` role), verify that the volunteer is enrolled/registered to the event of the target task.
   - **Fix 4: system logs FK constraint error**: Refactor `checkAndDeriveTaskStatus` in `AssignmentService` to accept the `actorId: number` parameter dynamically (instead of hardcoding system ID 1). Pass the dynamic actor ID in all event emissions (`DOMAIN_EVENTS.TASK_STATUS_DERIVED`). Make sure all calls to `checkAndDeriveTaskStatus` inside `AssignmentService` pass their respective dynamic actor ID.
   - **Fix 5: concurrency race condition**: Add PostgreSQL row locking in `checkAndDeriveTaskStatus` by running a raw lock query inside the transaction, e.g.:
     `await tx.$executeRaw\`SELECT 1 FROM tasks WHERE id = \${taskId} FOR UPDATE\`;`
   - **Fix 6: safety assignment checks**: In `AssignmentService.assignTask`, check if `EventParticipation` exists for the given `eventId` and `volunteerId` before upserting the assignment. If it does not, throw a descriptive, user-friendly error.
   - **Fix 7: update tests**: In the test script `test-transitions.ts`, import and call `initializeDomainEvents()` at the start of the execution so audit logs and notifications are tested.
3. Write your handoff report to `handoff.md` in your working directory.
