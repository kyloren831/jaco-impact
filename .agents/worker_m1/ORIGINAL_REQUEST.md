## 2026-06-08T05:45:05Z

You are the E2E Test Implementer (worker) for the Jacó Impact 'Mis Tareas' project.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m1/.
Please create the directory /home/aaron/Projects/jaco-impact/.agents/worker_m1/ first and initialize your BRIEFING.md and progress.md there.

Your mission is to implement Milestone 1: E2E Test Infrastructure & Tier 1 Feature Coverage.
You must:
1. Create /home/aaron/Projects/jaco-impact/TEST_INFRA.md at the project root based on the following template (fill in the features, scenarios, layout, etc. based on the 8 features under test: registerToEvent, getVolunteerTasks, acceptAssignment, declineAssignment, startAssignment, submitAssignment/submitEvidence, comments, and SSE API).
2. Set up the test files and folder structure:
   - tests/e2e/helpers/db.ts: resets the DB tables (using Prisma) and seeds test data (users with roles VOLUNTEER, COORDINATOR, ADMIN; projects, events, and tasks).
   - tests/e2e/helpers/auth.ts: helper to sign JWT tokens using the jose library and JWT_SECRET from .env/.env.local.
   - tests/e2e/helpers/sse.ts: client helper to listen to /api/realtime SSE and collect broadcasted events.
   - tests/e2e/helpers/actions.ts: helper to read server-reference-manifest.json and execute Server Actions via fetch requests with appropriate Cookie and Next-Action headers.
   - tests/e2e/helpers/runner.ts: manages starting next dev server on port 3005, triggering route compilation, and killing the process.
3. Create a temporary Next.js page app/test-actions/page.tsx that imports and references all the Server Actions we want to test to force Next.js to compile them and generate their Action IDs.
4. Implement tests/e2e/specs/tier1.spec.ts containing exactly 40 Tier 1 E2E test cases covering:
   - 5 tests for Event Registration (happy paths, double registration checks)
   - 5 tests for Task Retrieval (by event, filtering)
   - 5 tests for Assignment Acceptance (status change to ACCEPTED)
   - 5 tests for Assignment Decline (status change to DECLINED)
   - 5 tests for Assignment Startup (status change to IN_PROGRESS)
   - 5 tests for Assignment Submission & Evidence (status change to SUBMITTED, evidence record insertion)
   - 5 tests for Task Comments (addition, listing, author checks)
   - 5 tests for Real-time SSE broadcasting (comments and transition events received)
5. Create tests/e2e/run.ts which acts as the test suite orchestrator script (resets DB, spawns dev server on port 3005, hits http://localhost:3005/test-actions to trigger compilation, parses action IDs, runs tier1.spec.ts using node:test, and cleans up the temporary app/test-actions/page.tsx file).
6. Run the runner and verify that all 40 Tier 1 tests execute and pass successfully. Include the test results in your handoff report at /home/aaron/Projects/jaco-impact/.agents/worker_m1/handoff.md.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
