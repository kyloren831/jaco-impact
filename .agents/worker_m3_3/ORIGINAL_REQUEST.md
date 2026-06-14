## 2026-06-09T01:28:33Z

You are teamwork_preview_worker.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m3_3/

Please read your BRIEFING.md and progress.md.
Your mission is to add the missing event emissions in `EvidenceService` and run the tests.

MANDATORY INTEGRITY WARNING — DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Here is the exact description of the code changes required:

1. domain/evidences/service.ts:
- In `submitEvidence` (around line 82), after updating the taskAssignment status, emit `ASSIGNMENT_STATUS_CHANGED` via domainEventBus.emit:
```typescript
      await domainEventBus.emit({
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId,
          volunteerId,
          eventId: assignment.eventId,
          actorId,
          previousStatus: assignment.status,
          newStatus
        },
        metadata: {
          actorId,
          timestamp: new Date()
        }
      });
```
Make sure DOMAIN_EVENTS is imported at the top of the file from "@/domain/shared/events".

- In `reviewEvidence` (around line 152), after updating the taskAssignment status, emit `ASSIGNMENT_STATUS_CHANGED` via domainEventBus.emit:
```typescript
      await domainEventBus.emit({
        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
        payload: {
          taskId: evidence.taskId,
          volunteerId: evidence.volunteerId,
          eventId: existing.assignment.eventId,
          actorId: reviewerId,
          previousStatus: existing.assignment.status,
          newStatus: derivedStatus
        },
        metadata: {
          actorId: reviewerId,
          timestamp: new Date()
        }
      });
```

2. Run the build and verification:
Execute:
npx tsx tests/e2e/run.ts

Please notify me when complete with the test outcomes.
