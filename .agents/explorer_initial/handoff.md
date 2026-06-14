# Handoff Report: "Mis Tareas" Initial Exploration & Architecture Plan

This report documents the findings from the initial exploration of the Jacó Impact codebase and outlines the architectural plan for implementing the **"Mis Tareas"** volunteer UX workflow.

---

## 1. Observation

### Directory Layout & Next.js Setup
* **Next.js & React Versions**: The application is built using Next.js `16.2.1` and React `19.2.4` (defined in `package.json` lines 19, 22). It uses Tailwind CSS `v4` for styling.
* **App Router Structure**: Next.js App Router is used. The main volunteer dashboard routes are located in:
  - `app/dashboard/volunteer/page.tsx` — Volunteer home dashboard.
  - `app/dashboard/volunteer/tasks/page.tsx` — Current volunteer tasks page (configured as a Kanban board).
  - `app/dashboard/volunteer/events/page.tsx` — View and register to events.
  - `app/dashboard/volunteer/projects/page.tsx` — View projects.
  - `app/dashboard/layout.tsx` — Wraps the dashboards and loads the sidebar component `components/layout/DashboardSidebar.tsx`.

### Prisma Schema (`prisma/schema.prisma`)
The schema already contains the necessary tables and fields for managing task lifecycles, assignments, evidence, and comments:
1. **`Task`** (lines 297-318):
   - Defines a general activity belonging to an `Event`.
   - Fields include: `id`, `eventId`, `createdBy`, `title`, `description`, `priority` (LOW, MEDIUM, HIGH), `taskStatus` (OPEN, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED).
   - Relations: `assignments` (`TaskAssignment[]`), `taskEvidences` (`TaskEvidence[]`), `comments` (`TaskComment[]`).
2. **`AssignmentStatus` Enum** (lines 46-57):
   - Tracks individual volunteer progress: `PENDING_ACCEPTANCE`, `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `REVISION_REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`.
3. **`TaskAssignment`** (lines 320-345):
   - Maps a `Task` to a `Volunteer`. Composite primary key is `@@id([taskId, volunteerId])`.
   - Fields: `assignedAt`, `acceptedAt`, `declinedAt`, `startedAt`, `submittedAt`, `completedAt`, `status` (`AssignmentStatus`), `completionNote`.
4. **`TaskEvidence`** (lines 347-372):
   - Stores submitted evidence files for a task assignment.
   - Fields: `id`, `fileUrl`, `fileName`, `fileSize`, `fileType` (IMAGE, VIDEO, DOCUMENT, OTHER), `description`, `status` (`ReviewStatus` enum: `PENDING`, `APPROVED`, `REJECTED`).
5. **`TaskComment`** (lines 374-388):
   - Stores user-generated discussion comments for a task.
   - Fields: `id`, `taskId`, `authorId`, `content`, `createdAt`.

### Server Actions & API Routes
* Server actions are categorized inside the `/features` directory:
  - `features/tasks/actions.ts` — Admin actions to create/update tasks and assign volunteers.
  - `features/volunteer/actions.ts` — Volunteer actions to register for events and get tasks.
  - `features/evidences/actions.ts` — Handles submitting (`submitEvidenceAction`) and reviewing evidence.
* API Routes are under `app/api/...`:
  - Contains endpoints for auth (`api/auth/register`, `/logout`, `/me`, `/refresh`).
  - Contains a real-time SSE stream route at `app/api/realtime/route.ts` which forwards events from `domainEventBus`.

### Database, S3/R2 & Real-Time Setup
* **Database Client**: Managed in `lib/prisma.ts`. It wraps the standard Prisma client with a Postgres driver adapter (`@prisma/adapter-pg` over `pg` driver pool) and exports a transaction utility `withTransaction` backed by `AsyncLocalStorage` to share transaction contexts between service domains.
* **Storage Client (S3/R2)**: Configured in `lib/storage/r2.ts`. Instantiates `@aws-sdk/client-s3` targeting Cloudflare R2 using:
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_DEV_URL`.
  - Exposes `uploadFileToR2(file, folder)` which processes direct server-side uploads.
* **Real-time SSE**: Implemented in `app/api/realtime/route.ts` (lines 7-53). It creates a persistent `text/event-stream` connection, registers event listeners on `domainEventBus` for all `DOMAIN_EVENTS`, encodes emitted payloads as JSON, and aborts cleanly when the client disconnects.

### Frontend Volunteer UX Components
* **Sidebar**: `components/layout/DashboardSidebar.tsx` configures the navigation menu showing "Mis Tareas" linking to `/dashboard/volunteer/tasks`.
* **Dashboard Home**: `components/dashboard/VolunteerDashboard.tsx` displays "Mis Tareas Pendientes" (filtered using `!["APPROVED", "SUBMITTED", "DECLINED", "CANCELLED"].includes(status)`) and "Mis Próximos Eventos".
* **Evidence Submission**: `components/dashboard/SubmitEvidenceModal.tsx` handles selecting a file and triggering `submitEvidenceAction`.
* **Kanban Board**: `app/dashboard/volunteer/tasks/page.tsx` shows all tasks for events the volunteer is registered to. However, it filters and groups them by global `TaskStatus` rather than individual `AssignmentStatus`. It does not support task status transitions, comments, or detailed task views.

---

## 2. Logic Chain

The objective is to implement a personal, Asana-like task manager ("Mis Tareas") for volunteers. The current implementation has several gaps that the planned architecture will solve:

1. **State Machine Decoupling**: Currently, `app/dashboard/volunteer/tasks/page.tsx` organizes the Kanban board by the global `Task.taskStatus` (OPEN, IN_PROGRESS, etc.). In contrast, a volunteer's view should be decoupled and grouped by their personal `TaskAssignment.status` (AssignmentStatus).
2. **Missing State Transitions**: While `domain/assignments/service.ts` implements methods to transition assignment states (`acceptAssignment`, `declineAssignment`, `startAssignment`, `submitAssignment`), these are not wrapped in Server Actions or exposed in the UI. We must expose them as Server Actions in `features/volunteer/actions.ts` or `features/tasks/actions.ts`.
3. **Atomic Global Task Updates**: Requirement R1 dictates that when the last active volunteer submits their assignment, the global `Task` status changes to `IN_REVIEW`. We need to intercept this transition inside `submitAssignment` (or in a domain event listener for `ASSIGNMENT_SUBMITTED`) by checking if all other assignments for that task are also submitted/approved, and then updating `Task.taskStatus`.
4. **Presigned Upload URLs**: Requirement R3 requires generating presigned URLs for client-side uploads. The current `lib/storage/r2.ts` only supports direct server-side file uploads using `uploadFileToR2`. Presigned URL generation will require using `@aws-sdk/s3-request-presigner` on the server and calling it from a Server Action, allowing the client to execute a PUT request directly to Cloudflare R2/MinIO/S3.
5. **Interactive Detail Panel**: The volunteer UI lacks a task detail view. We will create a Right Panel (drawer) that opens when a volunteer clicks "Ver detalles" on a task. This drawer will contain:
   - Task info (title, description, dates, priority).
   - Dynamic action buttons to transition assignment state (Accept, Decline, Start, Submit).
   - An evidence upload dropzone (interacting with presigned URLs).
   - A real-time chat panel displaying comments (fetching and creating `TaskComment`s).
6. **Real-time SSE Synchronicity**: We will build a client-side hook/context that connects to `/api/realtime`. When events like `TASK_COMMENT` or `ASSIGNMENT_STATUS_CHANGED` are broadcasted, the UI will reflect changes instantly.

---

## 3. Caveats

* **Missing Dependencies**: `@aws-sdk/s3-request-presigner` is required to generate presigned URLs on the server but is not currently listed in `package.json`. The implementer will need to add this dependency.
* **Auto-Transition Hook**: The current `AssignmentService.submitAssignment` (lines 146-171) updates only the `TaskAssignment` status. It does not verify if all assignments are complete to transition the parent `Task` status to `IN_REVIEW`. This check needs to be written explicitly in the database transaction.
* **Direct Upload Fallback**: If R3 (presigned URL) fails due to local dev config mismatches, the existing `submitEvidenceAction` (which uploads the file through the server to R2) serves as a functional fallback.

---

## 4. Conclusion & Architectural Design

The proposed architecture is structured as follows:

```
[Client Components] ──(Server Actions)──> [Features Layer] ──> [Domain Services] ──> [Database (Prisma)]
        │                                                                               │
 (SSE Connection) <──(Readable Stream) <── [API Realtime Route] <──(Event Bus) <────────┘
```

### Proposed Action Plan
1. **Dependency Installation**: Install `@aws-sdk/s3-request-presigner`.
2. **Server Actions (Backend)**:
   - Expose Server Actions for:
     - `acceptAssignmentAction(taskId, volunteerId)`
     - `declineAssignmentAction(taskId, volunteerId, reason)`
     - `startAssignmentAction(taskId, volunteerId)`
     - `submitAssignmentAction(taskId, volunteerId, completionNote)`
     - `addTaskCommentAction(taskId, content)`
   - Implement S3 presigned URL generation Server Action (`getPresignedUploadUrlAction(fileName, fileType)`).
3. **Database Rules (Domain)**:
   - Update `AssignmentService.submitAssignment` to query all active assignments for the task. If all are in `SUBMITTED`, `UNDER_REVIEW`, or `APPROVED`, automatically transition the global `Task.taskStatus` to `IN_REVIEW`.
4. **Task Dashboard Tabs (Frontend)**:
   - Refactor `app/dashboard/volunteer/tasks/page.tsx` to fetch `TaskAssignment`s instead of raw `Task`s.
   - Separate assignments into 4 tabs:
     - **Pendientes** (status: `PENDING_ACCEPTANCE`)
     - **En curso** (status: `ACCEPTED`, `IN_PROGRESS`, `REVISION_REQUESTED`)
     - **En revisión** (status: `SUBMITTED`, `UNDER_REVIEW`)
     - **Completadas** (status: `APPROVED`)
5. **Right Drawer Component (Frontend)**:
   - Implement `components/dashboard/TaskDetailsDrawer.tsx`.
   - Embed state actions, evidence upload dropzone, and comment section.
   - Use `useOptimistic` for instant feedback on state transitions.
6. **Real-time SSE Connection**:
   - Create a React hook `useRealtime` that opens an `EventSource` to `/api/realtime`.
   - Re-fetch task data or optimistically append comments when `EVIDENCE_SUBMITTED`, `TASK_COMMENT`, or status change events are received.

---

## 5. Verification Method

### 1. Database & Server Liveness
* Run `npx tsx test-prisma.ts` to confirm database connectivity.
* Run `npm run lint` to verify that no static code errors exist.

### 2. Manual End-to-End Test Scenarios
* **Scenario A (Assignment Workflow)**:
  1. Log in as an Administrator/Coordinator.
  2. Create a task and assign it to a volunteer.
  3. Log in as that Volunteer, navigate to `/dashboard/volunteer/tasks`.
  4. Verify the task appears in the **Pendientes** tab.
  5. Click "Aceptar" inside the details drawer. Verify it optimistically moves to the **En curso** tab and updates the database status to `ACCEPTED`.
  6. Click "Iniciar" to transition to `IN_PROGRESS`.
* **Scenario B (Evidence Submission & Auto-Transition)**:
  1. Under the **En curso** tab, click "Subir Evidencia".
  2. Drop/select a file. Confirm the client fetches a presigned URL, uploads it directly to storage, and saves `TaskEvidence` to the database.
  3. Verify the assignment moves to **En revisión** and status updates to `SUBMITTED`.
  4. If this is the only volunteer assigned to the task, check that the global `Task` status changes to `IN_REVIEW`.
* **Scenario C (Real-Time Comments)**:
  1. Open two browser windows (one as Coordinator, one as Volunteer).
  2. Open the details drawer for the same task in both.
  3. Type a comment in the Volunteer window.
  4. Verify that the comment appears instantly in the Coordinator window via SSE without a page reload.

---

## 6. Code Mapping

| File Path | Component / Layer | Role / Responsibility |
|---|---|---|
| `prisma/schema.prisma` | DB Schema | Defines `Task`, `TaskAssignment`, `TaskEvidence`, and `TaskComment` fields and relationships. |
| `lib/prisma.ts` | DB Client | Configures Prisma client adapter and provides transactional context wrapper (`withTransaction`). |
| `lib/storage/r2.ts` | Storage Client | Instantiates S3 client for Cloudflare R2 bucket storage. Needs extension for presigned URLs. |
| `lib/auth/guards.ts` | Auth guards | Enforces role policies (`requireRole`, `requireAuth`) for secure action invocation. |
| `domain/assignments/service.ts` | Domain Business Logic | Manages state changes of assignments via the `assignmentStateMachine`. |
| `domain/assignments/state.ts` | Domain State Machine | Strict transition definition rules for `AssignmentStatus`. |
| `domain/evidences/service.ts` | Domain Business Logic | Manages evidence submission and review workflows. |
| `domain/shared/domain-event-bus.ts` | Event Bus | Decouples modules. Emits and registers event listeners in memory. |
| `app/api/realtime/route.ts` | API Route | Exposes real-time event updates to the client via Server-Sent Events (SSE). |
| `features/volunteer/actions.ts` | Server Actions | Backend entry point for volunteer state changes (Accept, Decline, Start). |
| `features/evidences/actions.ts` | Server Actions | Backend entry point for evidence operations. |
| `app/dashboard/volunteer/tasks/page.tsx` | Frontend Page | Main Kanban dashboard page to view tasks. |
| `components/dashboard/VolunteerDashboard.tsx` | Frontend Component | Sub-component displaying pending assignments and events. |
| `components/dashboard/SubmitEvidenceModal.tsx` | Frontend Component | Modal to upload evidence directly (fallback helper). |
| `components/layout/DashboardSidebar.tsx` | Frontend Component | Contains navigation links to Volunteer pages. |
