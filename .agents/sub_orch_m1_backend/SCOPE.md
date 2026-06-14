# Scope: Milestone 1 - Backend State Transitions & Comments

## Architecture
- **Database Layer**: Prisma client with tables `Task`, `TaskAssignment`, `TaskComment`, `User`, `Volunteer`.
- **Domain Layer**:
  - `AssignmentService` (located in `domain/assignments/service.ts`): Implement automatic transition of the parent `Task` status to `IN_REVIEW` when all active assignments for that task are `SUBMITTED`, `UNDER_REVIEW`, or `APPROVED`. Active assignments are defined as those that are not `DECLINED` or `CANCELLED`.
  - `CommentService` (to be created in `domain/comments/service.ts` or similar): Implement creation and retrieval of task comments.
- **Features Layer (Server Actions)**:
  - Expose Server Actions in `features/volunteer/actions.ts` or `features/tasks/actions.ts`:
    - `acceptAssignmentAction(taskId: number)`
    - `declineAssignmentAction(taskId: number, reason: string)`
    - `startAssignmentAction(taskId: number)`
    - `submitAssignmentAction(taskId: number, note?: string)`
    - `addTaskCommentAction(taskId: number, content: string)`
    - `getTaskCommentsAction(taskId: number)`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1.1 | Comment Service & Actions | Create CommentService and expose actions for adding & getting comments. | None | PLANNED |
| 1.2 | Assignment Transitions | Expose server actions for accepting, declining, starting, and submitting assignments. | None | PLANNED |
| 1.3 | Task Status Auto-Transitions | Implement database rules in AssignmentService for auto-transitioning Task to `IN_REVIEW` when all active assignments are submitted. | 1.2 | PLANNED |

## Interface Contracts
### Features Actions ↔ Domain Services
- `acceptAssignmentAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
  - Calls `AssignmentService.acceptAssignment(taskId, volunteerId, actorId)`
- `declineAssignmentAction(taskId: number, reason: string): Promise<{ success: boolean; data?: any; error?: string }>`
  - Calls `AssignmentService.declineAssignment(taskId, volunteerId, actorId, reason)`
- `startAssignmentAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
  - Calls `AssignmentService.startAssignment(taskId, volunteerId, actorId)`
- `submitAssignmentAction(taskId: number, note?: string): Promise<{ success: boolean; data?: any; error?: string }>`
  - Calls `AssignmentService.submitAssignment(taskId, volunteerId, actorId, note)`
- `addTaskCommentAction(taskId: number, content: string): Promise<{ success: boolean; data?: any; error?: string }>`
  - Calls `CommentService.createComment(taskId, authorId, content)`
- `getTaskCommentsAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
  - Calls `CommentService.getCommentsByTaskId(taskId)`
