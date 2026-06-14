# Milestone 4 analysis: Frontend Volunteer UX Dashboard

This report provides the analysis and architectural layout proposal for Milestone 4 (Frontend Volunteer UX Dashboard) of the Jacó Impact "Mis Tareas" workflow.

---

## 1. Observation
The following observations were gathered by examining the project codebase, database schema, existing pages, components, and prior handoff documentation:

1. **Existing Component (`components/dashboard/VolunteerDashboard.tsx`)**:
   - Lines 19-20: Filters tasks using `!["APPROVED", "SUBMITTED", "DECLINED", "CANCELLED"].includes(t.status)`.
   - Uses `SubmitEvidenceModal` (passing `taskId`) to submit evidence.
2. **Existing Tasks Page (`app/dashboard/volunteer/tasks/page.tsx`)**:
   - Current implementation fetches tasks via `getVolunteerTasksAction(eventId)` (Lines 5-6).
   - Groups tasks into a Kanban board layout by `taskStatus` (OPEN, IN_PROGRESS, IN_REVIEW, COMPLETED) (Lines 15-20), which is based on the global `TaskStatus` rather than individual `AssignmentStatus`.
   - Renders a grid of columns containing `TaskCard` items (Lines 38-90).
3. **Task & Assignment Statuses (`prisma/schema.prisma`)**:
   - Line 38: Global `TaskStatus` values: `OPEN`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`.
   - Line 46: Individual `AssignmentStatus` values: `PENDING_ACCEPTANCE`, `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `REVISION_REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`.
4. **Server Actions (`features/volunteer/actions.ts` & `features/evidences/actions.ts`)**:
   - Transition actions: `acceptAssignmentAction`, `declineAssignmentAction`, `startAssignmentAction`, `submitAssignmentAction` (which wraps the transition and evidence creation).
   - Evidence submission: `submitEvidenceAction` takes a `FormData` object containing `file` and `taskId`.
   - Storage presigner: `getPresignedUploadUrlAction` takes `fileName` and `fileType` and returns `uploadUrl` and `fileUrl` for direct browser PUT uploads.
   - Comment thread actions: `addTaskCommentAction` and `getTaskCommentsAction`.
5. **Real-time SSE (`app/api/realtime/route.ts` & `hooks/useRealtime.ts`)**:
   - SSE streams parsed domain events to the browser.
   - Event types: `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED`.
   - `useRealtime` hook opens a single `EventSource` connection for the specified event type or receives all events if no type is passed.
6. **Existing Drawer Component (`components/ui/RightSidePanel.tsx`)**:
   - A slide-out panel that uses React Portals (`createPortal`) to overlay on the screen, managing body scroll locking and offering full dark mode classes.

---

## 2. Logic Chain
Based on the observations:
1. **Tabs vs Statuses**: The current `app/dashboard/volunteer/tasks/page.tsx` groups by global `TaskStatus`, but the requirements and `HANDOFF.md` specify a volunteer-focused view grouped by individual `AssignmentStatus`. Therefore, we must map volunteer assignments to 4 tabs: "Pendientes", "En curso", "En revisión", and "Completadas".
2. **Right-Side Panel for Details**: Since `RightSidePanel.tsx` is already built and handles all backdrop, dark mode, and slide-in transition physics, we should use it as the wrapper for `TaskDetailsDrawer.tsx`.
3. **Optimistic Updates**: To make the UI feel fast and responsive (satisfying Milestone 4 requirements), we should use React's `useOptimistic` hook to immediately shift cards between tabs on transition actions (e.g., Aceptar, Iniciar) and immediately render new comments in the thread, before the Server Actions confirm changes.
4. **SSE Event Subscription**: Using multiple instances of `useRealtime` opens multiple EventSource connections. Thus, the client dashboard should subscribe to a single, type-less connection (`useRealtime(undefined, callback)`) to receive all events and update tasks list/comments thread with minimal network footprint.

---

## 3. Caveats
- **Presigned URLs Integration**: The current `submitEvidenceAction` takes a binary `File` in `FormData` and uploads it to R2 on the server using `uploadFileToR2`. While `getPresignedUploadUrlAction` generates presigned URLs for client-side uploads, there is currently no server action configured to create a `TaskEvidence` record *from an already uploaded URL* without sending the file binary again. We recommend updating or adding a server action if pure browser-to-R2 direct upload is required, or using `submitEvidenceAction` as-is, where the server performs the upload.
- **Role Isolation**: The transitions `declineAssignmentAction`, `acceptAssignmentAction`, `startAssignmentAction`, and `submitAssignmentAction` require the `VOLUNTEER` role. If a coordinator or admin views this page, they may not be able to execute these actions.

---

## 4. Conclusion & Recommendations
We recommend the following architectural and component layout designs for Milestone 4.

### 4.1 Tab Mapping (`VolunteerTasksDashboard.tsx`)
The dashboard should filter the volunteer's assignments and sort them into 4 tabs:
1. **Pendientes (Pending)**:
   - Statuses: `PENDING_ACCEPTANCE`
   - Actions in Card: Quick buttons for "Aceptar" (green) and "Rechazar" (red). Clicking "Rechazar" opens a small modal/prompt asking for a decline reason.
2. **En curso (In Progress)**:
   - Statuses: `ACCEPTED`, `IN_PROGRESS`, `REVISION_REQUESTED`
   - Details: When `ACCEPTED`, the drawer/card shows a "Iniciar Tarea" button. When `IN_PROGRESS` or `REVISION_REQUESTED`, it displays a progress indicator and allows submitting evidence.
3. **En revisión (In Review)**:
   - Statuses: `SUBMITTED`, `UNDER_REVIEW`
   - Details: Displayed with a yellow/amber badge. Actions are locked.
4. **Completadas (Completed)**:
   - Statuses: `APPROVED`
   - Details: Displayed with a green checkmark badge. Actions are locked.

*Note*: Assignments with statuses `DECLINED`, `REJECTED`, or `CANCELLED` are terminal/inactive states and should be excluded from these active tabs (or shown in a collapsible History section).

---

### 4.2 Component Architecture

#### A. `app/dashboard/volunteer/tasks/page.tsx`
This will serve as the server entry point:
- Fetch the user's session and verify authorization.
- Fetch the tasks list using `getVolunteerTasksAction(eventId)`.
- Render the client-side `VolunteerTasksDashboard.tsx` component, passing down the fetched tasks and the volunteer's user metadata.

#### B. `components/dashboard/VolunteerTasksDashboard.tsx`
A client component that manages:
- Tab selection state (active tab: "Pendientes", "En curso", etc.).
- Selection of active task for the drawer (state: `selectedTask: Task | null` and `isDrawerOpen: boolean`).
- **Optimistic State** using `useOptimistic`:
  ```typescript
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { taskId, newStatus }) => state.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assignments: t.assignments.map(a => 
            a.volunteer.userId === currentUserId ? { ...a, status: newStatus } : a
          )
        };
      }
      return t;
    })
  );
  ```
- Groups `optimisticTasks` dynamically based on the mapped statuses for the selected tab.
- Renders the list of tasks. Clicking a task opens the `TaskDetailsDrawer`.

#### C. `components/dashboard/TaskDetailsDrawer.tsx`
A client component wrapping `RightSidePanel`:
- **Task Metadata Section**: Displays title, priority, event title, event date, task description, and due date.
- **Workflow Action Panel**:
  - Displays state transition buttons based on the current assignment status:
    - `PENDING_ACCEPTANCE`: Buttons to trigger `acceptAssignmentAction` and `declineAssignmentAction`.
    - `ACCEPTED`: Button to trigger `startAssignmentAction`.
    - `IN_PROGRESS` or `REVISION_REQUESTED`: Displays the Evidence Dropzone and a "Enviar para revisión" button (triggering `submitAssignmentAction`).
- **Drag-and-Drop Evidence Dropzone**:
  - A file dropzone that accepts images, PDFs, etc.
  - When a file is dropped:
    - If using the standard flow: Append file to `FormData` and call `submitEvidenceAction`.
    - If using the direct S3 flow: Call `getPresignedUploadUrlAction`, perform a client-side `PUT` to R2, then call a submission server action linking the URL.
- **Comments Thread Component**:
  - Fetches comments on mount/drawer open using `getTaskCommentsAction(taskId)`.
  - Maintains a local state `comments` representing the thread.
  - Form with input to submit a new comment via `addTaskCommentAction(taskId, commentText)`.
  - Integrates `useOptimistic` to show the comment instantly:
    ```typescript
    const [optimisticComments, addOptimisticComment] = useOptimistic(
      comments,
      (state, newComment: string) => [...state, {
        id: Date.now(),
        content: newComment,
        createdAt: new Date(),
        author: { name: currentUserName }
      }]
    );
    ```

---

### 4.3 Real-time SSE Integration
To keep the dashboard updated without forcing manual page reloads:
1. **Listen to Events**: In `VolunteerTasksDashboard.tsx`, set up `useRealtime` without a filter to listen to all events on a single SSE connection:
   ```typescript
   useRealtime(undefined, (event) => {
     if (event.type === "ASSIGNMENT_STATUS_CHANGED") {
       // Refresh Next.js server data cache to update all columns/tabs
       router.refresh();
     }
   });
   ```
2. **Listen to Comments**: In `TaskDetailsDrawer.tsx`, listen for `TASK_COMMENT` events:
   ```typescript
   useRealtime("TASK_COMMENT", (event) => {
     const { taskId: eventTaskId, comment } = event.payload;
     if (eventTaskId === currentTaskId) {
       // Append the comment to the local comments state
       setComments((prev) => {
         // Avoid duplicates if posted by the user
         if (prev.some((c) => c.id === comment.id)) return prev;
         return [...prev, comment];
       });
     }
   });
   ```

---

## 5. Verification Method
To verify the layout and architectural recommendations:
1. **Type Safety Verification**:
   Ensure all imports and status mappings are correct by running:
   ```bash
   npx tsc --noEmit
   ```
2. **E2E Test Execution**:
   Verify that existing backend transitions, SSE broadcasting, and comments work as expected (verifying contract interfaces):
   ```bash
   npx tsx tests/e2e/run.ts
   ```
3. **Inspect Target Paths**:
   Confirm code files for components/pages are located correctly:
   - Component: `components/dashboard/VolunteerTasksDashboard.tsx`
   - Component: `components/dashboard/TaskDetailsDrawer.tsx`
   - Page: `app/dashboard/volunteer/tasks/page.tsx`
