## 2026-06-09T01:21:09Z
You are teamwork_preview_worker.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m3_2/

Please read your BRIEFING.md and progress.md files.
Your mission is to implement the real-time SSE integration changes.

MANDATORY INTEGRITY WARNING — DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Here is the exact description of the code changes required:

1. domain/shared/events.ts:
Add `ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED',` to the DOMAIN_EVENTS object in the "Assignment domain" section (around line 90).

2. domain/assignments/service.ts:
In each of the following methods, after emitting the specific transition event via domainEventBus.emit, also emit `ASSIGNMENT_STATUS_CHANGED` with the same metadata and payload structure (containing taskId, volunteerId, eventId: current.eventId, actorId, previousStatus: current.status, newStatus):
- acceptAssignment: Emit DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED with the newStatus (ACCEPTED).
- declineAssignment: Emit DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED with newStatus (DECLINED), actorId, previousStatus, taskId, volunteerId, eventId, and also include the "reason" field in payload.
- startAssignment: Emit DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED with newStatus (IN_PROGRESS).
- submitAssignment: Emit DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED with newStatus (SUBMITTED).
- reviewAssignment: In the block that checks if decision is APPROVED or REVISION_REQUESTED and emits specific event, or right after that, emit DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED with newStatus (AssignmentStatus[decision]). Note: in reviewAssignment, if decision is REJECTED, does it transition? Yes, newStatus is derived as AssignmentStatus[decision]. Emit status changed with newStatus = AssignmentStatus[decision].
- removeAssignment: Emit DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED with newStatus (CANCELLED).

3. app/api/realtime/route.ts:
In GET function, update the sendEvent callback. It must intercept events of type DOMAIN_EVENTS.TASK_COMMENT and DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED:
- For DOMAIN_EVENTS.TASK_COMMENT, the output event payload MUST include BOTH the flat fields (taskId, commentId, authorId, content, createdAt, authorName, eventId) and the nested comment structure (comment: { id: commentId, content, createdAt, author: { id: authorId, name: authorName } }).
- For DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED, the output event payload MUST contain taskId, volunteerId, and newStatus at the top level.
Keep other events passing through as-is.

4. hooks/useRealtime.ts:
Refactor useRealtime hook signature:
export function useRealtime<T = any>(
  eventType?: string,
  onEvent?: (event: RealtimeEvent<T>) => void
)
Inside the hook, store onEvent callback in a useRef and keep it updated on every render to prevent closing/re-opening the EventSource connection when the callback reference changes.
Trigger callbackRef.current(parsedEvent) inside onmessage if eventType matches (or is undefined/null).

Verification:
- Run the build and run tests to verify:
  npx tsx tests/e2e/run.ts

Please write changes.md and handoff.md inside your directory when complete. Do not start any other agent, and notify me when you are done.
