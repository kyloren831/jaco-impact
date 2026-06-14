## 2026-06-09T20:08:54Z
Objective: Implement the frontend volunteer UX dashboard files for Milestone 4.
Files to implement/modify:
1. components/dashboard/VolunteerTasksDashboard.tsx (New Client Component)
2. components/dashboard/TaskDetailsDrawer.tsx (New Client Component)
3. app/dashboard/volunteer/tasks/page.tsx (Overwriting Server Component)

Detailed Guidelines:
- Volunteer-Specific Filtering & Tab Mapping: In VolunteerTasksDashboard.tsx, filter the user's assignments and sort them into 4 tabs:
  - "Pendientes" (Pending): status = "PENDING_ACCEPTANCE" or "ACCEPTED"
  - "En curso" (In Progress): status = "IN_PROGRESS" or "REVISION_REQUESTED"
  - "En revisión" (In Review): status = "SUBMITTED" or "UNDER_REVIEW"
  - "Completadas" (Completed): status = "APPROVED"
- Transitions in TaskDetailsDrawer.tsx:
  - For "PENDING_ACCEPTANCE": Render buttons to accept (acceptAssignmentAction) and decline (declineAssignmentAction). Decline should prompt for a text reason.
  - For "ACCEPTED": Render a button to start (startAssignmentAction).
  - For "IN_PROGRESS" or "REVISION_REQUESTED": Render a text note field, drag-and-drop evidence dropzone (calls getPresignedUploadUrlAction, PUT to R2, then submitEvidenceAction), and button to submit (submitEvidenceAction). Also allow "Submit without file" via submitAssignmentAction.
- Real-time updates:
  - In VolunteerTasksDashboard.tsx: useRealtime("ASSIGNMENT_STATUS_CHANGED") to call router.refresh() when the current volunteer's assignment status is updated by the coordinator.
  - In TaskDetailsDrawer.tsx: useRealtime("TASK_COMMENT") to append new comments to the thread in real time. Deduplicate comments to prevent showing duplicate entries for the local user. Scroll the comments container to the bottom on change.
- UI styling: Use Tailwind classes matching the project layout. Use date-fns for formatting dates using Spanish locale ("es").
- Optimistic updates: Integrate useOptimistic for immediate UI responsiveness.
- Verification: Run TypeScript validation (npx tsc --noEmit) and the full E2E test suite (npx tsx tests/e2e/run.ts) to verify everything passes.
