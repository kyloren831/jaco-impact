## 2026-06-08T06:06:13Z
You are a Worker agent (Worker 1) for Milestone 3: Real-Time SSE Integration.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m3_1/.
Your parent conversation ID is 09ea3f1b-b357-4e31-a3f5-1b4c7f6d6030.

Objective:
Implement Milestone 3 following the design and code recommendations from the Explorer investigation:

1. In `domain/shared/events.ts`:
   - Add `ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED'` to the `DOMAIN_EVENTS` object.

2. In `domain/assignments/service.ts`:
   - Emit `DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED` in all state-altering transition methods:
     - `acceptAssignment` (transition to ACCEPTED)
     - `declineAssignment` (transition to DECLINED)
     - `startAssignment` (transition to IN_PROGRESS)
     - `submitAssignment` (transition to SUBMITTED)
     - `reviewAssignment` (transition to UNDER_REVIEW, and transitions to APPROVED or REVISION_REQUESTED)
     - `removeAssignment` (transition to CANCELLED)
   - Ensure the payload structure for `ASSIGNMENT_STATUS_CHANGED` contains:
     - `taskId` (number)
     - `volunteerId` (number)
     - `eventId` (number)
     - `actorId` (number)
     - `previousStatus` (AssignmentStatus)
     - `newStatus` (AssignmentStatus)
     - `reason` (string, optional - for decline)

3. In `app/api/realtime/route.ts`:
   - In `sendEvent`, intercept:
     - `TASK_COMMENT`: Format the broadcast payload to include the nested `comment` structure:
       ```json
       "comment": {
         "id": commentId,
         "content": content,
         "createdAt": createdAt,
         "author": {
           "id": authorId,
           "name": authorName
         }
       }
       ```
       Also retain the flat fields (`taskId`, `commentId`, `authorId`, `content`, `createdAt`, `authorName`, `eventId`) at the top level of the `payload` to preserve backward compatibility for the E2E tests.
     - `ASSIGNMENT_STATUS_CHANGED`: Format the broadcast payload to match:
       ```json
       "payload": {
         "taskId": taskId,
         "volunteerId": volunteerId,
         "newStatus": newStatus
       }
       ```
     - For other events, serialize and stream verbatim as they are currently streamed.

4. In `hooks/useRealtime.ts`:
   - Refactor the `useRealtime` hook signature to:
     ```typescript
     export function useRealtime<T = any>(
       eventType?: string,
       onEvent?: (event: RealtimeEvent<T>) => void
     )
     ```
   - Store the callback in a `useRef` to prevent closure re-subscription issues when inline callbacks are passed, and execute it whenever matching events are received.

Verification & Verification command:
After applying the changes, compile/build the project and run the E2E test suite:
`npx tsx tests/e2e/run.ts`
Ensure that the tests pass. Report the test commands run, outputs, and status.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your changes.md and handoff.md inside your working directory (/home/aaron/Projects/jaco-impact/.agents/worker_m3_1/). Report back using send_message.
