# Handoff Report: Milestone 4 (Frontend Volunteer UX Dashboard) Requirements Analysis

## 1. Observation

Direct observations made within the codebase:
1. **Page Grouping Logic**: In `app/dashboard/volunteer/tasks/page.tsx` (lines 14-20), tasks are currently grouped by `task.taskStatus`:
   ```typescript
   const groupedTasks = {
     OPEN: tasks.filter((t: any) => t.taskStatus === "OPEN"),
     IN_PROGRESS: tasks.filter((t: any) => t.taskStatus === "IN_PROGRESS"),
     IN_REVIEW: tasks.filter((t: any) => t.taskStatus === "IN_REVIEW"),
     COMPLETED: tasks.filter((t: any) => t.taskStatus === "COMPLETED"),
   };
   ```
2. **Server-Side File Upload**: In `features/evidences/actions.ts` (lines 10-67), the `submitEvidenceAction` expects a raw `file` from `FormData`:
   ```typescript
   const file = formData.get('file') as File | null;
   ...
   const evidence = await evidenceService.submitEvidence({
     taskId,
     volunteerId: volunteer.id,
     actorId: payload.userId,
     file,
     description,
   });
   ```
   There is no server action or service method allowing registration of a pre-uploaded S3/R2 URL.
3. **Presigned URL Actions**: In `features/evidences/actions.ts` (lines 89-123), `getPresignedUploadUrlAction` generates upload URLs, but lacks a backend counterpart to associate the uploaded link with the database.
4. **SSE Event Payloads**: In `app/api/realtime/route.ts` (lines 15-41), the events for `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` format their payloads with specific properties like `taskId`, `comment` (including `id`, `content`, `author`), `volunteerId`, and `newStatus`.
5. **RightSidePanel Interface**: In `components/ui/RightSidePanel.tsx` (lines 4-18), the portal-based slide-out panel supports props `isOpen`, `onClose`, `title`, and `children`.

---

## 2. Logic Chain

1. **Decoupling Requirement**: The `PROJECT.md` specifies that the dashboard must decouple a volunteer's personal view from the global task status by displaying tasks based on the individual's `AssignmentStatus`. 
2. **Mapping and UI**: Since the current page groups by global `taskStatus` (Observation 1), it fails to meet the decoupling requirement. Therefore, the tasks must be grouped client-side using `VolunteerTasksDashboard.tsx` based on each task's `assignment.status` for the logged-in volunteer (Tab 1: Pendientes, Tab 2: En curso, Tab 3: En revisión, Tab 4: Completadas).
3. **Evidence Upload Approach**: The codebase provides `getPresignedUploadUrlAction` for client-side uploads (Observation 3), but because there is no API or action to save a pre-uploaded URL into the DB (Observation 2), the client-side drag-and-drop dropzone should submit files directly using `submitEvidenceAction` via `FormData` to ensure database registration.
4. **Real-time Synchronization**: The `useRealtime` hook can listen to SSE broadcasts (Observation 4). To keep the volunteer's view updated:
   - Comment streams (`TASK_COMMENT`) should be listened to in the drawer and appended to the local comments thread, deduplicated by the comment ID.
   - Assignment state changes (`ASSIGNMENT_STATUS_CHANGED`) should be listened to in the dashboard and trigger a `router.refresh()` to fetch updated data and re-categorize the tasks.

---

## 3. Caveats

- **Client-Side Upload Limitation**: The `getPresignedUploadUrlAction` is not fully integrated with a database record creation step on the backend. Unless a new action is implemented to persist a pre-uploaded S3/R2 URL, the frontend must perform server-side uploads via `submitEvidenceAction`.
- **E2E Test Environment**: S3/R2 upload tests are mocked when `MOCK_S3` is set to true or in `test` environment (as observed in `lib/storage/r2.ts` lines 32-37). Manual verification with local or real dev credentials is required to ensure direct S3 upload functionality if the presigned URL flow is eventually fully implemented.

---

## 4. Conclusion

Milestone 4 should be implemented by:
- Updating `app/dashboard/volunteer/tasks/page.tsx` to pass the raw tasks and current volunteer ID to a client-side `VolunteerTasksDashboard` component.
- Implementing `VolunteerTasksDashboard.tsx` to filter tasks into 4 tabs matching the volunteer's individual `AssignmentStatus` states, and subscribing to `ASSIGNMENT_STATUS_CHANGED` events to trigger router refreshes.
- Implementing `TaskDetailsDrawer.tsx` using `RightSidePanel.tsx` to handle state transitions (Accept, Decline, Start, Submit), direct file uploads via `submitEvidenceAction` (FormData), and real-time comment thread updates via the `TASK_COMMENT` SSE event.

---

## 5. Verification Method

1. **Verify Backend Correctness**:
   Run the backend E2E tests to check that state transitions and comments work under load:
   ```bash
   npx tsx tests/e2e/run.ts
   ```
2. **Inspect Proposal Files**:
   Verify that the proposed components conform to the structural layout specified in:
   - `/home/aaron/Projects/jaco-impact/.agents/explorer_m4_2/analysis.md`
