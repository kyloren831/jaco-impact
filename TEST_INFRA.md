# E2E Test Infrastructure & Tier 1 Coverage

This document describes the end-to-end (E2E) testing infrastructure for the Jacó Impact 'Mis Tareas' project, covering the backend state transitions, real-time updates, and comments.

## Features Under Test

1. **registerToEvent**
   - Scenario: Volunteers can register for events.
   - Scenario: Prevent double registration (registering twice for the same event).

2. **getVolunteerTasks**
   - Scenario: Retrieve tasks assigned to the volunteer for specific events.
   - Scenario: Filter tasks based on assignment status or other criteria.

3. **acceptAssignment**
   - Scenario: Transition assignment status from `PENDING_ACCEPTANCE` to `ACCEPTED`.

4. **declineAssignment**
   - Scenario: Decline assignment, changing status to `DECLINED` and saving the decline reason.

5. **startAssignment**
   - Scenario: Start assignment, changing status to `IN_PROGRESS` and setting the start timestamp.

6. **submitAssignment & submitEvidence**
   - Scenario: Submit assignment and upload evidence (fileUrl, fileName, fileSize, etc.).
   - Scenario: Transition assignment status to `SUBMITTED`.
   - Scenario: Support auto-transition of global `TaskStatus` to `IN_REVIEW` if this was the last active volunteer assignment.

7. **comments**
   - Scenario: Add comment to a task as an authenticated volunteer or coordinator.
   - Scenario: Retrieve task comments.
   - Scenario: Enforce author identification and role checks.

8. **SSE API**
   - Scenario: Broadcast transition events (`ASSIGNMENT_STATUS_CHANGED`) when status changes.
   - Scenario: Broadcast `TASK_COMMENT` events in real-time when comments are added.
   - Scenario: Verify client receives correct payload structures.

## File & Folder Layout

- `tests/e2e/helpers/db.ts`
  - Handles resetting all relevant database tables using Prisma.
  - Seeds initial test users (VOLUNTEER, COORDINATOR, ADMIN), pillars, projects, events, and tasks to ensure a clean slate.
- `tests/e2e/helpers/auth.ts`
  - Signs JWT tokens for test requests using the `jose` library and the `JWT_SECRET` retrieved from environment variables.
- `tests/e2e/helpers/sse.ts`
  - Connects to the `/api/realtime` Server-Sent Events (SSE) endpoint to listen to and collect broadcasted events during test execution.
- `tests/e2e/helpers/actions.ts`
  - Parses the `server-reference-manifest.json` file.
  - Executes Next.js Server Actions using raw HTTP `fetch` requests containing appropriate cookie and `Next-Action` headers.
- `tests/e2e/helpers/runner.ts`
  - Spawns the Next.js development server on port 3005.
  - Triggers route compilation by hitting `/test-actions`.
  - Ensures clean shutdown of the dev server process.
- `tests/e2e/specs/tier1.spec.ts`
  - Contains exactly 40 Tier 1 E2E test cases (5 for each of the 8 features).
- `tests/e2e/run.ts`
  - The orchestrator script that resets the database, starts the server, triggers compilation of actions, reads action IDs, runs all specs via `node:test`, and cleans up temporary page files.

## Running the E2E Test Suite

To run the E2E test suite, execute:
```bash
npx ts-node tests/e2e/run.ts
```
This orchestrates the database reset, Next.js dev server startup, action compilation, spec execution, and cleanup automatically.
