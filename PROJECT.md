# Project: Mis Tareas Volunteer UX Workflow

## Architecture
The "Mis Tareas" volunteer UX workflow decouples a volunteer's personal task dashboard from the global task status by displaying tasks based on the individual's `AssignmentStatus`. The architecture consists of:
1. **Database Layer (Prisma)**: Manages `Task`, `TaskAssignment`, `TaskEvidence`, and `TaskComment` records.
2. **Domain Layer**:
   - `AssignmentService` (updates to support auto-transitions of global `TaskStatus` to `IN_REVIEW` when the last active volunteer submits).
   - `CommentService` (new domain service to handle creating and retrieving task comments).
3. **Features Layer (Server Actions)**:
   - Volunteer actions for state transitions (`acceptAssignmentAction`, `declineAssignmentAction`, `startAssignmentAction`, `submitAssignmentAction`).
   - Storage action for generating presigned upload URLs (`getPresignedUploadUrlAction`).
   - Comment action for writing/saving comments (`addTaskCommentAction`).
4. **Real-time API Layer (SSE)**:
   - Exposes `/api/realtime` for client streaming.
   - Listens to Domain Events (`ASSIGNMENT_*`, `TASK_COMMENT`, etc.) and broadcasts them to clients.
5. **Frontend Client Layer**:
   - `VolunteerTasksDashboard`: Groups volunteer's assignments into 4 tabs.
   - `TaskDetailsDrawer`: Slid-out right panel showing task details, state transition buttons, evidence dropzone, and a real-time comments chat thread.
   - `useRealtime` hook: Connects to SSE to trigger cache invalidation and append new comments in real-time.

```
[UI Component: VolunteerTasksDashboard] ──(Server Actions)──> [Features Layer] ──> [Domain Services] ──> [Database (Prisma)]
                  │                                                                                             │
           (SSE Connection) <──(Event Stream) <── [API Realtime Route] <──(Event Bus) <─────────────────────────┘
```

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Backend State Transitions & Comments | Implement server actions for assignment transitions, comments, and the atomic auto-transition of TaskStatus to `IN_REVIEW`. | None | DONE |
| 2 | S3/R2 Storage Presigned URLs | Add `@aws-sdk/s3-request-presigner` and implement presigned URL generation Server Action and utility. | None | DONE |
| 3 | Real-Time SSE Integration | Add `TASK_COMMENT` event, emit events on transitions/comments, and implement frontend `useRealtime` hook. | M1 | DONE |
| 4 | Frontend Volunteer UX Dashboard | Build 4-tab dashboard, right details drawer (dropzone, comments, transition actions), and integrate `useOptimistic`. | M1, M2, M3 | DONE |

## Interface Contracts
### 1. Assignment Transitions & Comments Action Signatures (`features/volunteer/actions.ts`)
* `acceptAssignmentAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
* `declineAssignmentAction(taskId: number, reason: string): Promise<{ success: boolean; data?: any; error?: string }>`
* `startAssignmentAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
* `submitAssignmentAction(taskId: number, note?: string): Promise<{ success: boolean; data?: any; error?: string }>`
* `addTaskCommentAction(taskId: number, content: string): Promise<{ success: boolean; data?: any; error?: string }>`
* `getTaskCommentsAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`

### 2. Presigned URLs Client-Server Contract (`features/evidences/actions.ts`)
* `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`
* Expected Client behavior: Perform a HTTP PUT request to `uploadUrl` with the file blob and headers `Content-Type: fileType`.

### 3. SSE Payload Structure (`app/api/realtime/route.ts`)
* Broadcast format: `data: {"type": "TASK_COMMENT", "payload": { "taskId": 12, "comment": { "id": 1, "content": "...", "createdAt": "...", "author": { "name": "..." } } }}`
* Broadcast format: `data: {"type": "ASSIGNMENT_STATUS_CHANGED", "payload": { "taskId": 12, "volunteerId": 5, "newStatus": "ACCEPTED" }}`

## Code Layout
- `domain/assignments/service.ts` - Manage assignment status shifts & check task auto-transition.
- `domain/comments/service.ts` - Manage comments CRUD and broadcast `TASK_COMMENT` event.
- `lib/storage/r2.ts` - Add `getPresignedUploadUrl` function.
- `features/volunteer/actions.ts` - Server actions wrapper for volunteer workflow.
- `features/evidences/actions.ts` - Server action for S3/R2 presigned URL generation.
- `app/api/realtime/route.ts` - SSE endpoint.
- `app/dashboard/volunteer/tasks/page.tsx` - Next.js entry page for volunteer tasks board.
- `components/dashboard/VolunteerTasksDashboard.tsx` - Core client Kanban UI component.
- `components/dashboard/TaskDetailsDrawer.tsx` - Detailed right panel drawer (transitions, uploads, comment thread).
- `hooks/useRealtime.ts` - EventSource wrapper client hook.
