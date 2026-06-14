# Handoff Report: Backend State Transitions & Comments (Milestone 1)

## 1. Observation
- **State Machine Definition**: In `domain/assignments/state.ts` (lines 4-36), the allowed transitions are governed by `assignmentTransitions`:
  ```typescript
  [AssignmentStatus.IN_PROGRESS]: [
    AssignmentStatus.SUBMITTED,
    AssignmentStatus.CANCELLED
  ],
  [AssignmentStatus.SUBMITTED]: [
    AssignmentStatus.UNDER_REVIEW,
    AssignmentStatus.CANCELLED
  ],
  ```
- **Database Schema**: In `prisma/schema.prisma` (lines 320-345), `TaskAssignment` is defined as:
  ```prisma
  model TaskAssignment {
    taskId         Int
    volunteerId    Int
    eventId        Int
    assignedBy     Int?
    assignedAt     DateTime         @default(now())
    ...
    status         AssignmentStatus
    ...
    @@id([taskId, volunteerId])
  }
  ```
- **Transaction Utility**: In `lib/prisma.ts` (lines 23-36), the transaction context is managed via `AsyncLocalStorage` and `withTransaction`:
  ```typescript
  export const transactionContext = new AsyncLocalStorage<Prisma.TransactionClient>();

  export async function withTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    const currentTx = transactionContext.getStore();
    if (currentTx) {
      return fn(currentTx);
    }
    return prisma.$transaction(async (tx) => {
      return transactionContext.run(tx, () => fn(tx));
    });
  }
  ```
- **Domain Event Registry**: In `domain/shared/events.ts` (lines 63-95), `DOMAIN_EVENTS` lists the available events but does not contain a `TASK_COMMENT` event:
  ```typescript
  export const DOMAIN_EVENTS = {
    ...
    TASK_STATUS_DERIVED: 'TASK_STATUS_DERIVED',
    ...
  } as const;
  ```
- **Test Scripts**: In `package.json` (lines 5-10), there are no testing frameworks or runner libraries configured:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
  ```

---

## 2. Logic Chain
1. **Comment Persistence & Service**: The `TaskComment` model in `prisma/schema.prisma` (lines 374-388) needs to be integrated. By designing `CommentService` in `domain/comments/service.ts`, we encapsulate the CRUD logic. Calling `withTransaction` (from `lib/prisma.ts`) guarantees that DB queries and event dispatching (`domainEventBus.emit`) are performed consistently.
2. **Event Configuration**: Real-time comment notifications depend on SSE streams listening to comment events. Thus, `TASK_COMMENT` must be added to `DOMAIN_EVENTS` in `domain/shared/events.ts` and mapped in `domain/audit/service.ts` for auditing.
3. **Atomic Task Auto-Transitions**:
   - To avoid race conditions when multiple volunteers submit assignments concurrently, `AssignmentService` methods must run inside a Prisma interactive transaction using `withTransaction`.
   - In `submitAssignment` and `reviewAssignment`, we must load the current task's assignments inside the transaction, filter active ones (`status !== DECLINED` and `status !== CANCELLED`), and check if every active assignment has transitioned to `SUBMITTED`, `UNDER_REVIEW`, or `APPROVED`. If so, we atomically update `task.taskStatus` to `IN_REVIEW`.
   - If a coordinator changes an assignment status to `REVISION_REQUESTED` (not in the target set), we must transition `task.taskStatus` back to `IN_PROGRESS`.
4. **Server Actions**:
   - Volunteer UI clients trigger actions via Server Actions. Implementing the contract (`acceptAssignmentAction`, `declineAssignmentAction`, etc.) in `features/volunteer/actions.ts` permits proper authentication guards (`requireRole`), volunteer record lookup via `session.userId`, domain service invocation, and Next.js page revalidation (`revalidatePath`).
5. **Testing**:
   - Due to the lack of test runner dependencies in `package.json`, database tests can be executed via an independent script `test-transitions.ts` using `npx tsx test-transitions.ts`.

---

## 3. Caveats
- We assume the `volunteerId` in server actions must match the currently authenticated user's `Volunteer` profile ID. Admins or coordinators acting on behalf of volunteers should not bypass this logic unless explicit admin transition endpoints are exposed.
- We assume that if there are no active assignments on a task, the task status remains unchanged (since there is nothing to review).

---

## 4. Conclusion
Milestone 1 is ready for implementation using:
1. `CommentService` at `domain/comments/service.ts` (persisting comments, emitting `TASK_COMMENT`).
2. Server Actions at `features/volunteer/actions.ts` mapping UI demands to `AssignmentService` and `CommentService`.
3. Transaction-wrapped atomic status calculations in `AssignmentService` methods (`submitAssignment`, etc.).
4. Sandbox test file `test-transitions.ts` for end-to-end transition verification.

---

## 5. Verification Method
1. **File Inspection**: Verify `domain/comments/service.ts` and changes to `domain/assignments/service.ts`, `domain/shared/events.ts`, and `features/volunteer/actions.ts` match the proposed architecture.
2. **Execute Test Script**: Create and run the sandbox test script:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:port/db" npx tsx test-transitions.ts
   ```
   If successful, it prints `"All tests passed successfully!"` and cleans up the sandbox records.
