## 2026-06-08T05:55:50Z
Your mission is to apply code security and state validation fixes based on the Challenger's findings.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m1_backend_fix_concurrency/.
Your parent is 5d3060ae-97d1-4f20-9b2b-ea84d99a927d.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please do the following:
1. Review the Challenger's challenge report:
   - Challenge Findings: /home/aaron/Projects/jaco-impact/.agents/challenger_m1_backend/challenge.md
2. Implement:
   - **Fix 1: state machine transition check in EvidenceService**: In `domain/evidences/service.ts`, import `assignmentStateMachine` from `../assignments/state` (or `@/domain/assignments/state`). In `submitEvidence`, check the state transition using `assignmentStateMachine.transition(assignment.status, AssignmentStatus.SUBMITTED)`. In `reviewEvidence`, transition from the current assignment status first to `UNDER_REVIEW` (if it was `SUBMITTED`) and then to the reviewer's target status (`APPROVED` or `REVISION_REQUESTED`) using `assignmentStateMachine.transition`. Update the assignment record using the derived transition status.
   - **Fix 2: evidence upload security guard**: In `submitEvidenceAction` in `features/evidences/actions.ts`, verify that the volunteer is active/registered for the event of the target task. If not registered or participation status is `CANCELLED`, reject the submission.
3. Write your handoff report to `handoff.md` in your working directory.
