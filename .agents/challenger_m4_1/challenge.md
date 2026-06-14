## Challenge Summary

**Overall risk assessment**: LOW

## Challenges

### [Medium] Challenge 1: Documented vs Actual E2E Test Count Discrepancy

- Assumption challenged: The E2E test suite has exactly 93 test cases as described in the project documentation and orchestrator's request.
- Attack scenario: Running validation scripts or CI assertion runners that strictly verify the output for exactly 93 tests would fail, because the actual test specs contain 105 test cases (50 in Tier 1, 41 in Tier 2, 9 in Tier 3, 5 in Tier 4).
- Blast radius: CI/CD test reports, health checks, or automated verification runs expecting exactly 93 tests will report mismatches or failures.
- Mitigation: Update the documentation in `TEST_READY.md` and related checklists to reflect the actual count of 105 test cases.

### [Low] Challenge 2: Direct Server-Side File Upload vs Client-Side Presigned Uploads

- Assumption challenged: The client UI uploads evidence files directly to Cloudflare R2/S3 using presigned URLs generated on the fly.
- Attack scenario: Inspecting `VolunteerTasksDashboard.tsx` and `TaskDetailsDrawer.tsx` reveals that when a volunteer uploads evidence, the raw `File` object is appended to a `FormData` envelope and passed directly to the `submitEvidenceAction` server action. The server action then processes the file and uploads it. The presigned URL action (`getPresignedUploadUrlAction`) is implemented but not actually invoked by the frontend dashboard.
- Blast radius: Large evidence uploads (e.g., high-resolution photos or videos) will consume significant server memory and bandwidth during the server action execution, bypassing the scalability benefits of presigned direct-to-S3 client uploads. Under high load, this may trigger server-side Out of Memory (OOM) errors or exceed Next.js request body size limits.
- Mitigation: Refactor the dropzone in `TaskDetailsDrawer.tsx` to invoke `getPresignedUploadUrlAction`, upload the file directly to the returned `uploadUrl` from the browser, and then send only the resulting `fileUrl` and metadata to the server action.

### [Low] Challenge 3: Silent SSE Disconnect and Stale Client State

- Assumption challenged: The volunteer dashboard state is kept fully in sync via real-time Server-Sent Events (SSE).
- Attack scenario: If a volunteer has the page open and suffers a transient network disconnect, the EventSource connection breaks. Although EventSource auto-reconnects, any events emitted during the offline window (e.g., coordinator task approvals/rejections, or new comments) are lost because SSE streams do not persist missed messages.
- Blast radius: The volunteer will see outdated assignment statuses (e.g., a task remains in "En revisión" even after the coordinator requests corrections), leading to double work or missed notifications.
- Mitigation: Implement a reconnection handler in `useRealtime.ts` that triggers a data revalidation (e.g., `router.refresh()`) immediately upon a successful reconnect transition (`onopen`).

## Stress Test Results

- **TypeScript Compilation Check** → Project compiles with type safety (`tsc --noEmit` exits with code 0) → Headless console timed out waiting for user approval on `run_command` → **NOT RUN**
- **E2E Test Execution Suite** → All spec suites (Tier 1-4) execute and pass (`tsx tests/e2e/run.ts` exits with code 0) → Headless console timed out waiting for user approval on `run_command` → **NOT RUN**

*Note: The test code was fully inspected for logic errors, syntax mistakes, and dependencies. All implementations appear syntactically correct and follow Milestone 4 specification interfaces.*

## Unchallenged Areas

- **Direct R2/S3 Network Calls** — S3/R2 direct uploads were not challenged against a live bucket because the test runner automatically forces mock mode (`MOCK_S3 = true`) during E2E runs.
