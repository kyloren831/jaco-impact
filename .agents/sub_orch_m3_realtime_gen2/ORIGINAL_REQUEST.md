# Original User Request

## Request — 2026-06-08T18:33:11-06:00
You are the Sub-orchestrator for Milestone 3: Real-Time SSE Integration.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/sub_orch_m3_realtime_gen2/.
Please read the predecessor's files in /home/aaron/Projects/jaco-impact/.agents/sub_orch_m3_realtime/ (including BRIEFING.md, SCOPE.md, progress.md).
Also, read the explorer's findings in /home/aaron/Projects/jaco-impact/.agents/explorer_m3_1/handoff.md and analysis.md.
Please resume the execution phase:
1. Spawn a teamwork_preview_worker to implement:
   - Add ASSIGNMENT_STATUS_CHANGED event inside domain/shared/events.ts
   - Emit ASSIGNMENT_STATUS_CHANGED event in AssignmentService transitions (domain/assignments/service.ts)
   - Ensure app/api/realtime/route.ts formats both TASK_COMMENT and ASSIGNMENT_STATUS_CHANGED correctly (incorporating flat and nested fields for backward compatibility)
   - Refine hooks/useRealtime.ts to accept optional callback `onEvent` using useRef.
2. Follow the standard iteration loop (Worker -> Reviewer -> Challenger -> Auditor -> Gate).
3. Ensure no code is written directly; always delegate.
4. Run npx tsx tests/e2e/run.ts to verify that SSE and other tests pass successfully.
5. Perform forensic integrity checks.
6. When complete, write handoff.md and report success back to me (main agent).

## Follow-up — 2026-06-09T01:20:08Z

Please act as the Implementation Worker to complete the following real-time SSE integration changes.

### Objective
1. Add `ASSIGNMENT_STATUS_CHANGED` event definition inside `domain/shared/events.ts`.
2. Emit `ASSIGNMENT_STATUS_CHANGED` event inside `AssignmentService` transitions in `domain/assignments/service.ts`.
3. Format both `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` in `app/api/realtime/route.ts`, ensuring flat and nested fields are combined for backward compatibility.
4. Refine the client hook `hooks/useRealtime.ts` to accept an optional callback `onEvent` using `useRef` to avoid closing/re-opening the EventSource when the callback reference changes.
5. Run the build and verify that the E2E tests pass by running:
   ```bash
   npx tsx tests/e2e/run.ts
   ```

### Detailed Instructions
- **domain/shared/events.ts**:
  Add `ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED',` to the `DOMAIN_EVENTS` object.
- **domain/assignments/service.ts**:
  In each of the following methods, after emitting the specific transition event, emit `ASSIGNMENT_STATUS_CHANGED` with the same `metadata` and the payload containing `taskId`, `volunteerId`, `eventId`, `actorId`, `previousStatus`, and `newStatus` (plus `reason` for decline, etc.):
  - `acceptAssignment`
  - `declineAssignment`
  - `startAssignment`
  - `submitAssignment`
  - `reviewAssignment` (if a decision is made, emit status change with `newStatus = AssignmentStatus[decision]`)
  - `removeAssignment`
- **app/api/realtime/route.ts**:
  Modify the `sendEvent` function to intercept and format payloads:
  - If `event.type === DOMAIN_EVENTS.TASK_COMMENT`, format the payload to include both the flat properties (`taskId`, `commentId`, `authorId`, `content`, `createdAt`, `authorName`, `eventId`) and the nested structure `comment` (containing `id`, `content`, `createdAt`, and `author` with `id` and `name`).
  - If `event.type === DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED`, format the payload to include `taskId`, `volunteerId`, and `newStatus` at the top level.
- **hooks/useRealtime.ts**:
  Update the signature to:
  ```typescript
  export function useRealtime<T = any>(
    eventType?: string,
    onEvent?: (event: RealtimeEvent<T>) => void
  )
  ```
  Store `onEvent` in a `useRef` and keep it updated on every render. Inside `onmessage`, trigger the callback with the parsed event if the type matches.

MANDATORY INTEGRITY WARNING — DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please report your progress and write your handoff report when complete.
