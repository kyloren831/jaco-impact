# Review Findings: Milestone 1 - Backend State Transitions & Comments

## Review Summary

**Verdict**: REQUEST_CHANGES

The backend state transitions and comment services are mostly implemented with correct transition logic, but they suffer from critical integration issues, bootstrap gaps, and security vulnerabilities that must be addressed before approval.

---

## Findings

### 1. [Critical] Missing Domain Event Initialization in Volunteer Actions
- **What**: The server actions file `features/volunteer/actions.ts` does not call `initializeDomainEvents()`.
- **Where**: `features/volunteer/actions.ts` (entire file, imports section).
- **Why**: Next.js server actions are compiled and code-split independently. If a volunteer performs an action (such as accepting or submitting an assignment) on a fresh serverless instance/V8 engine context where no other action files have been loaded, the event listeners for audit logging and notifications are never registered. Thus, the events (`ASSIGNMENT_ACCEPTED`, `ASSIGNMENT_SUBMITTED`, etc.) will be emitted but discarded, leaving the system without audit logs or notifications for volunteer activities.
- **Suggestion**: Import `initializeDomainEvents` from `@/domain/shared/init` and call it at the top level of `features/volunteer/actions.ts` (as is done in `features/tasks/actions.ts`).

---

### 2. [Critical] Stale Task Status Stems from Evidence Actions
- **What**: The `EvidenceService` updates task assignment status but bypasses the status recalculation.
- **Where**: `domain/evidences/service.ts` (lines 65-74 and lines 123-136).
- **Why**: When a volunteer uploads evidence using `submitEvidence` or a coordinator reviews evidence using `reviewEvidence`, the database state of the `TaskAssignment` is directly updated to `SUBMITTED`, `APPROVED`, or `REVISION_REQUESTED`. However, `AssignmentService.checkAndDeriveTaskStatus` is never called. Consequently, uploading evidence does not transition the parent `Task` to `IN_REVIEW`, and rejecting/revising evidence does not revert the `Task` to `IN_PROGRESS`.
- **Suggestion**: Import and invoke `checkAndDeriveTaskStatus` (or expose it/inject the assignment service) within `EvidenceService` transactions when modifying assignment statuses.

---

### 3. [Major] Authorization Bypass in Comment Server Actions
- **What**: Lack of task visibility validation for volunteers in comment actions.
- **Where**: `features/volunteer/actions.ts` (functions `addTaskCommentAction` and `getTaskCommentsAction`).
- **Why**: The actions only verify if the user has the role `VOLUNTEER`. They do not verify whether the volunteer is registered to the event or assigned to the task. An authenticated volunteer could view or write comments on any task in the system simply by calling the server action with arbitrary task IDs.
- **Suggestion**: In both actions, check if the authenticated volunteer has access to the task's event before calling the comment service (similar to the verification done in `getVolunteerTasksAction`).

---

### 4. [Major] Database Foreign Key Constraint Violations on System Events
- **What**: Hardcoded system actor IDs (0 and 1) fail foreign key constraints on the `ActivityLog` table.
- **Where**: `domain/assignments/service.ts` (lines 327, 349) and `domain/notifications/service.ts` (line 30).
- **Why**: The `ActivityLog` model in `schema.prisma` defines `actorId` as a required integer with a foreign key referencing the `User` table. Emitting system events with `actorId: 0` or `actorId: 1` will fail database insertion in production if no user with that ID exists. While the error is caught, the audit logs are not written.
- **Suggestion**: Either update the database schema to make `actorId` nullable in `ActivityLog` for system events, or create a designated system user record in the seed script and use its ID.

---

### 5. [Medium] Concurrency Race Condition in Status Derivation
- **What**: `checkAndDeriveTaskStatus` is subject to a race condition under "Read Committed" isolation.
- **Where**: `domain/assignments/service.ts` (lines 290-358).
- **Why**: If two volunteers submit assignments for the same task at the same time, both transactions will read the assignments concurrently. Since neither transaction has committed, both will see the other's status as `IN_PROGRESS` (not yet `SUBMITTED`). Thus, neither transaction will trigger the transition of the parent `Task` to `IN_REVIEW`, leaving the task stuck in `IN_PROGRESS`.
- **Suggestion**: Use a row lock (e.g. locking the parent `Task` row using a raw query or updating it at the start of the transaction) to serialize status derivation checks on the same task.

---

### 6. [Minor] Raw Database Exceptions on Assignment Constraint Failures
- **What**: Raw database error leakage when assigning unregistered volunteers to tasks.
- **Where**: `domain/assignments/service.ts` (lines 33-49).
- **Why**: `TaskAssignment` has a foreign key pointing to `EventParticipation(eventId, volunteerId)`. If a coordinator attempts to assign a task to a volunteer who is not registered for the event, the transaction fails with a raw Prisma foreign key violation instead of a clean, descriptive validation error.
- **Suggestion**: Check if `EventParticipation` exists prior to upserting `TaskAssignment` and throw a descriptive application error.

---

## Verified Claims

- **State Machine Transitions**: The state machine correctly restricts assignment status paths (e.g. `PENDING_ACCEPTANCE` -> `ACCEPTED` -> `IN_PROGRESS` -> `SUBMITTED`) and implements the necessary coordinator review flows. Verified via inspection of `domain/assignments/state.ts` and `test-transitions.ts`. -> **PASS**
- **Comment Creation Integrity**: Comments are persisted cleanly with proper input validation (`trim()`) and author/task relation. Verified via inspection of `domain/comments/service.ts`. -> **PASS**

---

## Coverage Gaps

- **Integration Testing for Events**: The current test runner (`test-transitions.ts`) does not call `initializeDomainEvents()`, meaning event handlers (audit logging, notifications) were completely unexecuted during development tests. This hidden gap is why the hardcoded system `actorId` foreign key errors were not observed during local test runs. Risk Level: **Medium**. Recommendation: Add event initialization to integration tests.

---

## Unverified Items

- **S3/R2 Evidence File Upload**: The storage upload functionality inside `EvidenceService` was not verified since we are review-only and offline.
