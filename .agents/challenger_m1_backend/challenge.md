# Concurrency & Deadlock Stress Test Verification Report — Milestone 1

This report provides a formal adversarial review, concurrent transition analysis, and deadlock evaluation for **Milestone 1: Backend State Transitions & Comments**.

---

## Challenge Summary

- **Overall Risk Assessment**: **LOW** (The row-locking mechanism is highly robust against the status derivation race condition, and the locking architecture prevents deadlocks).
- **Secondary Risks / Integrity Gaps**: **MEDIUM** (State machine transitions are bypassed in `EvidenceService`, allowing invalid status updates that can trigger incorrect global task status changes).

---

## 1. Concurrency Analysis (Reviewer Finding 5)

### The Race Condition Scenario
Under default PostgreSQL `Read Committed` isolation level, if two volunteers ($V_1$ and $V_2$) concurrently submit assignments for the same task ($T$):
1. **Transaction A ($V_1$)** updates $V_1$'s assignment status to `SUBMITTED`.
2. **Transaction B ($V_2$)** updates $V_2$'s assignment status to `SUBMITTED`.
3. **Transaction A** reads all assignments for task $T$. Since Transaction B's changes are not yet committed, Transaction A sees $V_2$ as `IN_PROGRESS`. It decides *not* to update the task status to `IN_REVIEW`.
4. **Transaction B** reads all assignments for task $T$. Since Transaction A's changes are not yet committed, Transaction B sees $V_1$ as `IN_PROGRESS`. It also decides *not* to update the task status to `IN_REVIEW`.
5. Both transactions commit. The task $T$ is left stuck in `IN_PROGRESS` despite all active assignments being submitted.

### Efficacy of the `FOR UPDATE` Row Lock
To resolve this, `checkAndDeriveTaskStatus` introduces a pessimistic row lock:
```typescript
await tx.$executeRaw`SELECT 1 FROM tasks WHERE id = ${taskId} FOR UPDATE`;
```

Here is the serialized execution flow under the lock:
1. **Transaction A** updates $V_1$'s assignment to `SUBMITTED`.
2. **Transaction B** updates $V_2$'s assignment to `SUBMITTED`.
3. **Transaction A** executes the `FOR UPDATE` query on `tasks` for $T$. It immediately acquires the exclusive row lock on $T$.
4. **Transaction B** attempts to execute the `FOR UPDATE` query on $T$ but is blocked, waiting for Transaction A to release the lock.
5. **Transaction A** (holding the lock) queries all assignments. It sees $V_1$ as `SUBMITTED` and $V_2$ as `IN_PROGRESS` (uncommitted change from B is invisible). It concludes the task is not yet fully submitted and commits without changing `taskStatus`.
6. Upon commit, Transaction A releases the lock on task $T$ and assignment $V_1$.
7. **Transaction B** is unblocked and acquires the lock on task $T$.
8. **Transaction B** queries all assignments. Because Transaction A has committed, Transaction B sees **both** $V_1$ and $V_2$ as `SUBMITTED`.
9. **Transaction B** updates the parent task status to `IN_REVIEW` and commits, releasing the lock.

**Conclusion**: The row-locking mechanism successfully and cleanly resolves the status derivation race condition.

---

## 2. Deadlock Analysis

A deadlock requires a cyclic dependency of locks (e.g., T1 locks X and waits for Y; T2 locks Y and waits for X). We audit the locking hierarchy of all database modification operations.

### Lock Acquisition Hierarchy
Across all service methods, database writes are executed in the following order:

1. **`TaskEvidence`** row lock (Insert / Update in `EvidenceService`)
2. **`TaskAssignment`** row lock (Update / Upsert in `AssignmentService` and `EvidenceService`)
3. **`Task`** row lock (Pessimistic `FOR UPDATE` + subsequent Update in `checkAndDeriveTaskStatus`)

Let's evaluate potential conflict patterns:

#### Pattern A: Concurrent transitions for the same Task ($T$) but different Volunteers ($V_1$ and $V_2$)
- **Transaction A (for $V_1$)**:
  - Locks `TaskAssignment(T, V_1)` (Step 1)
  - Locks `Task(T)` (Step 2)
- **Transaction B (for $V_2$)**:
  - Locks `TaskAssignment(T, V_2)` (Step 1)
  - Locks `Task(T)` (Step 2)

*Analysis*: The transactions lock distinct rows in the `TaskAssignment` table in Step 1. In Step 2, they both attempt to lock `Task(T)`. One will win and run to completion; the other will block and execute safely afterward. **No deadlock is possible.**

#### Pattern B: Concurrent transitions for different Tasks ($T_1$ and $T_2$) by the same Volunteer ($V$)
- **Transaction A (for $T_1$)**:
  - Locks `TaskAssignment(T_1, V)` (Step 1)
  - Locks `Task(T_1)` (Step 2)
- **Transaction B (for $T_2$)**:
  - Locks `TaskAssignment(T_2, V)` (Step 1)
  - Locks `Task(T_2)` (Step 2)

*Analysis*: Since the task IDs are different, the locks are acquired on entirely distinct rows in both tables. There is no resource contention. **No deadlock is possible.**

#### Pattern C: Coordinator updating Task details while Volunteer updates Assignment
- **Transaction A (Coordinator updating Task $T$)**:
  - Updates `Task(T)`, acquiring a row lock on `Task(T)`. (Does not lock assignments).
- **Transaction B (Volunteer transitioning assignment on $T$)**:
  - Locks `TaskAssignment(T, V)` (Step 1)
  - Attempts to lock `Task(T)` (Step 2)

*Analysis*: Transaction A holds the lock on `Task(T)`. Transaction B locks `TaskAssignment(T, V)` and blocks waiting for `Task(T)`. Transaction A has no dependencies on `TaskAssignment`, so it completes and commits, releasing `Task(T)`. Transaction B then acquires the lock and completes. **No deadlock is possible.**

**Conclusion**: Because the lock acquisition order is strictly hierarchical (`TaskEvidence` $\rightarrow$ `TaskAssignment` $\rightarrow$ `Task`) and transactions only lock a single task row at a time, there are no cyclical dependencies. The system is mathematically deadlock-free.

---

## 3. Attack Surface & Vulnerabilities Found

During adversarial code review, we discovered the following integrity and security weaknesses:

### 1. State Machine Bypass in `EvidenceService` (Medium Risk)
- **Vulnerability**: In `domain/evidences/service.ts`, both `submitEvidence` and `reviewEvidence` update the status of `TaskAssignment` directly in the database without invoking `assignmentStateMachine.transition()`.
- **Attack Scenario**: If an assignment is in a terminated state such as `DECLINED` or `CANCELLED`, a volunteer could still make a direct call to `submitEvidenceAction` (which invokes `EvidenceService.submitEvidence`). This forces the assignment status to `SUBMITTED`, effectively resurrecting a cancelled assignment and forcing an invalid global task status recalculation to `IN_REVIEW`.
- **Mitigation**: Add state machine checks inside `EvidenceService` before updating the database:
  ```typescript
  const newStatus = assignmentStateMachine.transition(assignment.status, AssignmentStatus.SUBMITTED);
  ```

### 2. Authorization Defect in Evidence Server Actions (Medium Risk)
- **Vulnerability**: While the comment actions (`addTaskCommentAction`) were updated to check if the volunteer has active access/registration to the task's event, `submitEvidenceAction` in `features/evidences/actions.ts` lacks this check. It only queries the `TaskAssignment` table to see if a record exists.
- **Attack Scenario**: If a volunteer is assigned to a task but has their event participation status updated to `CANCELLED`, they can still successfully submit evidence and force the assignment status to `SUBMITTED`, bypass-locking event access restrictions.
- **Mitigation**: Ensure `submitEvidenceAction` performs the same `EventParticipation` visibility checks as the other volunteer actions.

---

## 4. Verification Code

We wrote a custom stress test suite in `tests/stress-concurrency.ts` to empirically demonstrate concurrent execution:
- The script sets up a task with multiple active assignments.
- It initiates concurrent status submissions using `Promise.allSettled`.
- It verifies that status derivation is serialized correctly and the final task status transitions to `IN_REVIEW` without concurrency failures or database deadlocks.
