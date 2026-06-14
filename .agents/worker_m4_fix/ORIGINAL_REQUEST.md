## 2026-06-10T02:18:20Z

You are a Worker agent. Your working directory is /home/aaron/Projects/jaco-impact/.agents/worker_m4_fix/.
Objective: Refactor and fix the Frontend Volunteer UX Dashboard files for Milestone 4 to resolve Reviewers' vetoes.

Refactoring Tasks:
1. components/dashboard/TaskDetailsDrawer.tsx:
   - Import RightSidePanel from "@/components/ui/RightSidePanel".
   - Wrap the drawer content inside <RightSidePanel isOpen={true} onClose={onClose} title={drawerTitle} width="w-full sm:w-[500px] md:w-[600px]"> ... </RightSidePanel>.
   - Construct drawerTitle as a React node:
     ```tsx
     const drawerTitle = (
       <div>
         <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
           {task.event?.name || task.event?.title || "Evento"}
         </p>
         <span className="line-clamp-1">{task.title}</span>
       </div>
     );
     ```
   - Clean up the manually implemented absolute backdrop and overlay portal layout (lines 240-249 and 577-580).
   - In the comments rendering block, filter the optimisticComments to prevent temporary duplicate comment display:
     ```tsx
     const renderedComments = optimisticComments.filter((c) => {
       if (c.id < 0) {
         const hasReal = optimisticComments.some(
           (rc) => rc.id > 0 && rc.content === c.content && rc.authorId === c.authorId
         );
         if (hasReal) return false;
       }
       return true;
     });
     ```
     Use renderedComments.map(...) to render comments in the UI.

2. components/dashboard/VolunteerTasksDashboard.tsx:
   - In the `handleDrawerAction` under the `SUBMIT_WITH_FILE` case, remove the call to `getPresignedUploadUrlAction` and the subsequent direct `fetch(..., { method: "PUT" })` call.
   - Simply construct the `FormData` with `taskId`, `file`, and optionally `description` (note), and call `submitEvidenceAction(formData)` directly. This avoids double file uploads and matches the server action integration.

3. Verify:
   - Run type checks using `npx tsc --noEmit`.
   - Run the E2E tests using `npx tsx tests/e2e/run.ts` to ensure all 93 test cases complete successfully.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Save your handoff report to /home/aaron/Projects/jaco-impact/.agents/worker_m4_fix/handoff.md and notify the parent (conversation ID: 93d11d0f-cd6d-45aa-96d5-452d8bfb2e2d) when complete.
