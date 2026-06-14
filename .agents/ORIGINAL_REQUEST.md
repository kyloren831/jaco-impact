# Original User Request

## Initial Request — 2026-06-08T05:31:43Z

Implement the "Mis Tareas" volunteer UX workflow in the Jacó Impact Next.js web application. The workflow provides volunteers with an Asana-like personal task manager based on `AssignmentStatus`, decoupling their view from the global `TaskStatus`. It includes real-time updates via Server-Sent Events (SSE), S3/MinIO integration for evidence uploads via presigned URLs, and a four-tab personal dashboard.

Working directory: `/home/aaron/Projects/jaco-impact`
Integrity mode: development

## Requirements

### R1. Backend & State Transitions
Implement Server Actions to manage `AssignmentStatus` transitions (Accept, Decline, Start, Submit) and `TaskComment`. Implement atomic auto-transitions: when all active assignments are `SUBMITTED`, the global `TaskStatus` becomes `IN_REVIEW`. 

### R2. Real-Time Server-Sent Events (SSE)
Implement Server-Sent Events (SSE) natively in Next.js to provide real-time updates. Emit events for state changes and new comments, allowing the UI to synchronize instantly without requiring a custom WebSocket server. 

### R3. Evidence Storage
Integrate an S3 client (AWS SDK) to generate presigned URLs for `TaskEvidence` uploads directly from the client. Assume S3 credentials and endpoint will be provided via environment variables (ready for MinIO or AWS).

### R4. Frontend Volunteer UX
Build the "Mis Tareas" view with 4 tabs: Pendientes, En curso, En revisión, Completadas. Create a Right Panel detail view containing global task info, a dropzone for evidence uploads, and a chat-like UI for comments. Implement `useOptimistic` for instant feedback on actions.

## Verification & Acceptance Criteria

**Verification Method:** Agent-as-judge. The implementing team should verify functionally by logging in as a Volunteer, navigating the UI, performing state transitions, uploading mocked evidence, and leaving comments.

### Functional
- [ ] Volunteer dashboard correctly filters tasks into the 4 tabs based on `AssignmentStatus`.
- [ ] Accepting or declining a pending assignment instantly updates the UI (optimistic update) and accurately reflects in the database.
- [ ] A volunteer can generate a presigned URL using the S3 client configuration to upload evidence and submit the task.
- [ ] When the last active volunteer submits their assignment, the global `Task` status changes to `IN_REVIEW`.
- [ ] Adding a comment broadcasts it via SSE and appears instantly on other connected clients viewing that task.

## Follow-up — 2026-06-11T00:56:00Z

Please read HANDOFF.md and complete the 5 pending steps outlined under "Pasos pendientes para el siguiente agente":
1. Install the missing S3 dependencies.
2. Verify the Login -> Dashboard -> Mis Tareas flow.
3. Fix the TypeScript errors in the tests (missing Prisma mock fields).
4. Configure S3 environment variables.
5. Perform a visual end-to-end test.

Report back once all steps are fully completed and verified.
