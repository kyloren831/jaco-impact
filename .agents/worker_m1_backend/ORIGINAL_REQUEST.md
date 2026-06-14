## 2026-06-07T23:38:27-06:00
Your mission is to implement Milestone 1: Backend State Transitions & Comments.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m1_backend/.
Your parent is 5d3060ae-97d1-4f20-9b2b-ea84d99a927d.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please do the following:
1. Review the Explorer's analysis and handoff reports:
   - Analysis: /home/aaron/Projects/jaco-impact/.agents/explorer_m1_backend/analysis.md
   - Handoff: /home/aaron/Projects/jaco-impact/.agents/explorer_m1_backend/handoff.md
2. Implement:
   - `CommentService` in `domain/comments/service.ts`. Make sure it creates comments and retrieves them, using `withTransaction` for transactional context, and emits `TASK_COMMENT` on `domainEventBus`.
   - Update `domain/shared/events.ts` to add `TASK_COMMENT: 'TASK_COMMENT'` to `DOMAIN_EVENTS`. Also add it to `auditMapping` in `domain/audit/service.ts`.
   - Update `domain/assignments/service.ts` to execute all state transition methods inside a `withTransaction` block.
   - Implement the atomic task status calculation in `AssignmentService` (transitioning `Task.taskStatus` to `IN_REVIEW` when all active assignments are in `SUBMITTED`, `UNDER_REVIEW`, or `APPROVED`; revert/transition to `IN_PROGRESS` if any active assignment is in a different state e.g. `REVISION_REQUESTED`). Ensure that active assignments are defined as those that are NOT `DECLINED` or `CANCELLED`.
   - Implement/expose volunteer Server Actions in `features/volunteer/actions.ts`:
     - `acceptAssignmentAction(taskId: number)`
     - `declineAssignmentAction(taskId: number, reason: string)`
     - `startAssignmentAction(taskId: number)`
     - `submitAssignmentAction(taskId: number, note?: string)`
     - `addTaskCommentAction(taskId: number, content: string)`
     - `getTaskCommentsAction(taskId: number)`
     Make sure these actions validate roles/auth, resolve volunteer ID from session correctly, handle paths revalidation, and return `{ success: true, data }` or `{ success: false, error }`.
3. Create the test file `test-transitions.ts` at project root as outlined in the analysis report.
4. Run `npx tsx test-transitions.ts` to verify the state transitions work successfully against the database.
5. Provide the command you ran and the test results in your handoff report `handoff.md` in your working directory.
