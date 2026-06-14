# Handoff Report: Review and Verification of Backend State Transitions & Comments

This report summarizes the results of the code review and verification of Milestone 1 backend features.

## 1. Observation

1. **Missing Domain Event Initialization in Volunteer Actions**:
   In `features/volunteer/actions.ts`, the file imports do not include `initializeDomainEvents`:
   ```typescript
   import { requireAuth, requireRole } from "@/lib/auth/guards";
   import { prisma } from "@/lib/prisma";
   import { revalidatePath } from "next/cache";
   import { AssignmentService } from "@/domain/assignments/service";
   import { commentService } from "@/domain/comments/service";
   ```
   By contrast, `features/tasks/actions.ts` imports and immediately invokes it on lines 2–3:
   ```typescript
   import { initializeDomainEvents } from "@/domain/shared/init";
   initializeDomainEvents();
   ```

2. **Bypassing Task Status Recalculation on Evidence Events**:
   In `domain/evidences/service.ts` (`submitEvidence` on lines 65-74 and `reviewEvidence` on lines 123-136), the database state of the `TaskAssignment` is directly updated without invoking status derivation logic. For example, during evidence submission:
   ```typescript
         // 2. Update Assignment Status
         await tx.taskAssignment.update({
           where: {
             taskId_volunteerId: { taskId, volunteerId }
           },
           data: {
             status: 'SUBMITTED',
             submittedAt: new Date(),
           }
         });
   ```
   No invocation of `checkAndDeriveTaskStatus` or similar method is present here.

3. **No Event Visibility Checks for Volunteers in Comments Actions**:
   In `features/volunteer/actions.ts` (lines 234–254), the comment actions do not verify if a volunteer is registered to the event or assigned to the task:
   ```typescript
   export async function addTaskCommentAction(taskId: number, content: string) {
     try {
       const session = await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);
       const result = await commentService.createComment(taskId, session.userId, content);
   ```

4. **Hardcoded System actorId Constraint Violations**:
   In `domain/assignments/service.ts` line 327, system events are emitted with `actorId: 1`:
   ```typescript
             metadata: { timestamp: new Date(), actorId: 1 }, // System actor
   ```
   In `domain/notifications/service.ts` line 30, events are emitted with `actorId: 0`:
   ```typescript
           metadata: {
             timestamp: new Date(),
             actorId: 0, // system
           }
   ```
   However, the database model `ActivityLog` in `prisma/schema.prisma` requires `actorId` to reference a valid user in the `users` table:
   ```prisma
   model ActivityLog {
     id            Int            @id @default(autoincrement())
     actorId       Int
     ...
     actor User @relation("ActorLogs", fields: [actorId], references: [id])
   ```

5. **Omission of Domain Events in Test Setup**:
   In `test-transitions.ts`, there are no imports or references to `initializeDomainEvents()`.

---

## 2. Logic Chain

1. **Bootstrap Flaw**: Because Next.js server actions are loaded dynamically on demand, executing volunteer actions in `features/volunteer/actions.ts` on a fresh server instance without preloading other actions files will leave the domain event listeners unregistered. Therefore, events like `ASSIGNMENT_ACCEPTED` and `ASSIGNMENT_SUBMITTED` will be emitted but not handled, causing silent failures of audit logs and notifications.
2. **Stale Task Status**: Since `EvidenceService` modifies assignment statuses to `SUBMITTED`, `APPROVED`, or `REVISION_REQUESTED` directly in the database without calling the recalculation method `checkAndDeriveTaskStatus`, any status changes driven by evidence submission/reviews will leave the parent task status in a stale state.
3. **Security Vulnerability**: A volunteer with a valid account can bypass UI restrictions and read/write comments for any task by calling the server actions directly with a known or guessed `taskId`, since the actions only verify the role `VOLUNTEER` rather than checking event registration.
4. **Audit Log Failures**: In production, trying to log system-driven events where `actorId` is `0` or `1` will cause a foreign key constraint violation in the database if those users do not exist. Even though the listener catches the error, the log entry is never persisted.
5. **Incomplete Test Validation**: Since `test-transitions.ts` did not call `initializeDomainEvents()`, the event handlers (which attempt to log activities and notifications) were never run during tests. This hid the foreign key constraint issue during initial verification.

---

## 3. Caveats

- We did not verify the S3/R2 storage integration functionality inside `EvidenceService` as we are offline.
- We assumed default database isolation levels (Read Committed in PostgreSQL).

---

## 4. Conclusion

The implementation contains critical architectural and security defects. A verdict of **REQUEST_CHANGES** is issued. Key issues to fix include bootstrapping domain events in volunteer actions, integrating status derivation into `EvidenceService`, enforcing task visibility guards on volunteer comments, and correcting the schema or seed data for system activity log actors.

---

## 5. Verification Method

To verify these claims and fixes:
1. Inspect the top imports of `features/volunteer/actions.ts` to ensure `initializeDomainEvents()` is imported and executed.
2. Inspect `domain/evidences/service.ts` to confirm `checkAndDeriveTaskStatus` is invoked during `submitEvidence` and `reviewEvidence`.
3. In `features/volunteer/actions.ts`, check that `addTaskCommentAction` and `getTaskCommentsAction` query volunteer event participations to verify visibility permissions before proceeding.
4. Verify that running `npx tsx test-transitions.ts` executes successfully (once database and seed sequences are properly configured to support system actors, or database schema makes `actorId` nullable in `ActivityLog`).
