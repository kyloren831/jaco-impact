# Test Suite Readiness: Jacó Impact 'Mis Tareas'

This document certifies that the End-to-End (E2E) Test Suite for the "Mis Tareas" volunteer UX workflow in Jacó Impact is complete, verified, and ready for execution.

## Test Suite Summary

- **Tier 1 (Feature happy paths)**: 40 test cases
- **Tier 2 (Boundary & corner cases)**: 40 test cases
- **Tier 3 (Cross-feature combinations)**: 8 test cases
- **Tier 4 (Real-world workloads)**: 5 test cases
- **Total Test Cases**: 93 tests

All tests run sequentially or together using Node's native test runner (`node:test`) and the `tsx` compiler.

---

## 📋 Features Covered & Checklists

### 1. Event Registration
- [x] Register volunteer to an open event
- [x] Prevent double/duplicate registrations (idempotency check)
- [x] Prevent registration to closed events
- [x] Prevent registration to events in draft or cancelled projects
- [x] Non-existent event error handling

### 2. Task Retrieval
- [x] Retrieve volunteer tasks by event ID
- [x] Prevent volunteer task retrieval for unregistered events
- [x] Retrieve all tasks from all registered events when no event ID is passed
- [x] Return empty array for volunteers registered to no events
- [x] Block unauthenticated task retrieval

### 3. Assignment Acceptance
- [x] Accept pending assignment successfully
- [x] Prevent accepting already accepted assignments
- [x] Fail on non-existent assignment
- [x] Prevent accepting assignments allocated to other volunteers
- [x] Prevent accepting from invalid state (e.g. DECLINED, CANCELLED)

### 4. Assignment Decline
- [x] Decline pending assignment with a reason
- [x] Prevent declining already declined assignments
- [x] Prevent declining assignments in IN_PROGRESS state
- [x] Handle special/empty characters in decline reasons safely
- [x] Fail on non-existent assignment

### 5. Assignment Startup
- [x] Start accepted assignment successfully (status becomes `IN_PROGRESS`)
- [x] Prevent starting pending assignment directly without accepting first
- [x] Prevent starting already in-progress assignments
- [x] Block starting other volunteers' assignments
- [x] Fail on non-existent assignment

### 6. Assignment Submission & Evidence
- [x] Submit evidence and transition assignment status to `SUBMITTED`
- [x] Atomic auto-transition of parent `TaskStatus` to `IN_REVIEW` when the last active volunteer submits
- [x] Prevent submitting evidence without task ID or file
- [x] Allow evidence submission with empty description
- [x] Handle file uploads with non-standard mime types (mapped to `OTHER`)
- [x] Reject evidence submissions for non-existent assignments

### 7. Task Comments
- [x] Allow volunteer to comment on a task (if registered to that event)
- [x] Allow coordinator/admin to comment on any task
- [x] Chronological comment retrieval with author names and details
- [x] Prevent blank/empty comments
- [x] Fail on commenting on non-existent tasks

### 8. Real-time SSE Broadcasting
- [x] Establish persistent client connection via `/api/realtime` SSE stream
- [x] Broadcast `TASK_COMMENT` event on comment addition
- [x] Broadcast `ASSIGNMENT_ACCEPTED` event on assignment acceptance
- [x] Broadcast `ASSIGNMENT_STARTED` event on assignment start
- [x] Broadcast `ASSIGNMENT_DECLINED` event on assignment decline
- [x] Multi-client synchronization under concurrent workloads

### 9. Multi-Feature Combinations & Workloads
- [x] End-to-end happy path: register -> accept -> start -> submit -> comment -> SSE sync -> auto-transition -> coordinator approve
- [x] Double volunteer parallel assignment logic (one volunteer submits, one declines)
- [x] Coordinator review loops (SUBMITTED -> UNDER_REVIEW -> REVISION_REQUESTED -> IN_PROGRESS -> SUBMITTED -> APPROVED)
- [x] Event cancellation cascades to all active task assignments (transitions to `CANCELLED`)
- [x] Security role isolation (enforce authorization guards for VOLUNTEER, COORDINATOR, and ADMIN roles)
- [x] Task assignment removal by coordinator (transitions assignment to `CANCELLED`)
- [x] Multi-volunteer scaling workloads (e.g. 5 volunteers assigned to one task)
- [x] Admin activity/audit logging verification (checking auto-generated ActivityLogs)

---

## 🛠️ Verification & Execution

To run the complete E2E test suite:

```bash
npx tsx tests/e2e/run.ts
```

This runner automatically:
1. Resets the database and seeds initial test users/entities.
2. Generates the temporary action compilation helper page `app/test-actions/page.tsx`.
3. Starts the Next.js development server on port 3005.
4. Hits `/test-actions` to trigger compilation and build the action manifest.
5. Runs Tier 1, 2, 3, and 4 test files sequentially.
6. Closes the server and cleans up the temporary files and directories.
7. Exits with code `0` if all tests pass, and code `1` if any fail.
