# Analysis Report: Backend State Transitions & Comments (Milestone 1)

## Executive Summary
This report analyzes the existing backend architecture of the "Mis Tareas" volunteer UX workflow and details a concrete implementation plan for Milestone 1. We address the state machine integration, atomic auto-transitions of tasks, comment persistence, and the testing strategy.

---

## 1. Analysis of Existing Codebase & Architecture

### A. Database Models (`prisma/schema.prisma`)
- **`Task`**:
  - Contains `taskStatus` (`OPEN`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`).
  - Contains relations `assignments` (`TaskAssignment[]`), `comments` (`TaskComment[]`), and `taskEvidences` (`TaskEvidence[]`).
- **`TaskAssignment`**:
  - Composite key: `@@id([taskId, volunteerId])`.
  - Holds `status` of type `AssignmentStatus`.
  - Fields for timestamps: `assignedAt`, `acceptedAt`, `declinedAt`, `startedAt`, `submittedAt`, `completedAt`.
  - Has `completionNote` and `declineReason`.
- **`TaskComment`**:
  - Fields: `id`, `taskId`, `authorId`, `content`, `createdAt`, `updatedAt`.
  - Relations to `Task` and `User`.

### B. State Machine & Domain Services
- **`domain/assignments/state.ts`**:
  - Defines `assignmentStateMachine` with transitions between `AssignmentStatus` states.
  - Correctly validates state progressions: e.g., `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` / `REJECTED` / `REVISION_REQUESTED`.
- **`domain/assignments/service.ts`**:
  - Implements transitions (`acceptAssignment`, `declineAssignment`, `startAssignment`, `submitAssignment`, `reviewAssignment`).
  - Utilizes `domainEventBus` to emit corresponding events (e.g. `DOMAIN_EVENTS.ASSIGNMENT_SUBMITTED`).
  - Currently writes to the database using `prisma` directly (non-transactional for multi-step ops) and hardcodes `actorId: 1` in event metadata.
- **`lib/prisma.ts`**:
  - Configures Prisma with the Postgres adapter.
  - Implements `withTransaction` backed by `AsyncLocalStorage` to share transactional context.
- **`domain/shared/domain-event-bus.ts` & `events.ts`**:
  - Provides an in-process, synchronous/asynchronous Event Bus.
  - Lists event types in `DOMAIN_EVENTS`. Needs expansion to support comments (`TASK_COMMENT`).

---

## 2. Proposed Implementation Plan

### A. CommentService (`domain/comments/service.ts`)
We will create a new domain service `CommentService` utilizing the transaction context wrapper.

```typescript
import { withTransaction } from "@/lib/prisma";
import { domainEventBus } from "../shared/domain-event-bus";
import { DOMAIN_EVENTS } from "../shared/events";

export class CommentService {
  async createComment(taskId: number, authorId: number, content: string) {
    if (!content.trim()) {
      throw new Error("El comentario no puede estar vacío");
    }

    return withTransaction(async (tx) => {
      // 1. Verify task exists
      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { eventId: true }
      });

      // 2. Persist the comment
      const comment = await tx.taskComment.create({
        data: {
          taskId,
          authorId,
          content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            }
          }
        }
      });

      // 3. Emit Domain Event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId: authorId },
        type: 'TASK_COMMENT', // To be added to DOMAIN_EVENTS
        payload: {
          taskId,
          commentId: comment.id,
          authorId,
          content: comment.content,
          createdAt: comment.createdAt,
          authorName: comment.author.name,
          eventId: task.eventId,
        }
      });

      return comment;
    });
  }

  async getCommentsByTaskId(taskId: number) {
    return withTransaction(async (tx) => {
      return tx.taskComment.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            }
          }
        }
      });
    });
  }
}

export const commentService = new CommentService();
```

### B. Server Actions (`features/volunteer/actions.ts`)
Expose the actions required by the volunteer dashboard. Resolve the volunteer's ID from the session and call the appropriate domain service within error-handling boundaries.

```typescript
"use server";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AssignmentService } from "@/domain/assignments/service";
import { commentService } from "@/domain/comments/service";
import { revalidatePath } from "next/cache";

const assignmentService = new AssignmentService();

export async function acceptAssignmentAction(taskId: number) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.acceptAssignment(taskId, volunteer.id, session.userId);
    
    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function declineAssignmentAction(taskId: number, reason: string) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.declineAssignment(taskId, volunteer.id, session.userId, reason);
    
    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function startAssignmentAction(taskId: number) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.startAssignment(taskId, volunteer.id, session.userId);
    
    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitAssignmentAction(taskId: number, note?: string) {
  try {
    const session = await requireRole(["VOLUNTEER"]);
    const volunteer = await prisma.volunteer.findUniqueOrThrow({
      where: { userId: session.userId },
    });

    const result = await assignmentService.submitAssignment(taskId, volunteer.id, session.userId, note);
    
    revalidatePath("/dashboard/volunteer/tasks");
    revalidatePath("/dashboard/volunteer");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addTaskCommentAction(taskId: number, content: string) {
  try {
    const session = await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);
    const result = await commentService.createComment(taskId, session.userId, content);
    
    revalidatePath("/dashboard/volunteer/tasks");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTaskCommentsAction(taskId: number) {
  try {
    await requireRole(["VOLUNTEER", "ADMIN", "COORDINATOR"]);
    const result = await commentService.getCommentsByTaskId(taskId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### C. Atomic Task Status Updates in `AssignmentService`
To make task state updates atomic, we will wrap the transition methods of `AssignmentService` in `withTransaction` and inspect the collective state of assignments inside the transaction.

We define **Active Assignments** as those whose status is **NOT** `DECLINED` or `CANCELLED`.
If all active assignments are `SUBMITTED`, `UNDER_REVIEW`, or `APPROVED`, the task's global status transitions to `IN_REVIEW`.
If a coordinator requests a revision (causing an assignment to become `REVISION_REQUESTED` again), or if a new assignment is added, the task transitions back to `IN_PROGRESS` (if it was `IN_REVIEW`).

#### Update to `AssignmentService` (within `domain/assignments/service.ts`):
```typescript
import { withTransaction } from '@/lib/prisma';
import { AssignmentStatus, TaskStatus } from '../../generated/prisma/enums';

export class AssignmentService {
  
  // Wrap all transition methods (acceptAssignment, startAssignment, etc.) in withTransaction.
  // For example:
  async submitAssignment(taskId: number, volunteerId: number, actorId: number, note?: string) {
    return withTransaction(async (tx) => {
      const current = await tx.taskAssignment.findUniqueOrThrow({
        where: { taskId_volunteerId: { taskId, volunteerId } }
      });

      const newStatus = assignmentStateMachine.transition(current.status, AssignmentStatus.SUBMITTED);

      const updated = await tx.taskAssignment.update({
        where: { taskId_volunteerId: { taskId, volunteerId } },
        data: { status: newStatus, submittedAt: new Date(), completionNote: note }
      });

      // Recalculate parent Task status atomically
      await this.checkAndDeriveTaskStatus(taskId, tx);

      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId },
        type: DOMAIN_EVENTS.ASSIGNMENT_SUBMITTED,
        payload: {
          taskId,
          volunteerId,
          eventId: current.eventId,
          actorId,
          previousStatus: current.status,
          newStatus
        }
      });

      return updated;
    });
  }

  // Also apply withTransaction inside acceptAssignment, startAssignment, declineAssignment, reviewAssignment, removeAssignment.

  private async checkAndDeriveTaskStatus(taskId: number, tx: Prisma.TransactionClient) {
    // 1. Fetch all assignments for this task
    const assignments = await tx.taskAssignment.findMany({
      where: { taskId }
    });

    // 2. Identify active assignments (not DECLINED and not CANCELLED)
    const activeAssignments = assignments.filter(
      a => a.status !== AssignmentStatus.DECLINED && a.status !== AssignmentStatus.CANCELLED
    );

    // If there are no active assignments, do not modify task status.
    if (activeAssignments.length === 0) {
      return;
    }

    // 3. Check if all active assignments are SUBMITTED, UNDER_REVIEW, or APPROVED
    const allSubmittedOrReviewed = activeAssignments.every(
      a =>
        a.status === AssignmentStatus.SUBMITTED ||
        a.status === AssignmentStatus.UNDER_REVIEW ||
        a.status === AssignmentStatus.APPROVED
    );

    if (allSubmittedOrReviewed) {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { taskStatus: true }
      });

      if (task && task.taskStatus !== 'IN_REVIEW') {
        await tx.task.update({
          where: { id: taskId },
          data: { taskStatus: 'IN_REVIEW' }
        });

        await domainEventBus.emit({
          metadata: { timestamp: new Date(), actorId: 1 }, // System actor
          type: DOMAIN_EVENTS.TASK_STATUS_DERIVED,
          payload: {
            taskId,
            newStatus: 'IN_REVIEW'
          }
        });
      }
    } else {
      // Revert to IN_PROGRESS if a revision is requested or new assignments open
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { taskStatus: true }
      });

      if (task && task.taskStatus === 'IN_REVIEW') {
        await tx.task.update({
          where: { id: taskId },
          data: { taskStatus: 'IN_PROGRESS' }
        });

        await domainEventBus.emit({
          metadata: { timestamp: new Date(), actorId: 1 },
          type: DOMAIN_EVENTS.TASK_STATUS_DERIVED,
          payload: {
            taskId,
            newStatus: 'IN_PROGRESS'
          }
        });
      }
    }
  }
}
```

---

## 3. Database Testing Strategy

Since no test runner (like Vitest or Jest) is pre-configured in `package.json`, we propose the following strategy to verify the database state machine transitions and atomic updates.

### A. Independent Test Script (`test-transitions.ts`)
We can create a test script that sets up a clean sandbox state, executes the backend logic, verifies status transitions in the database, and clears the test data.

```typescript
// test-transitions.ts
import { prisma } from "./lib/prisma";
import { AssignmentService } from "./domain/assignments/service";
import { AssignmentStatus, TaskStatus } from "./generated/prisma/enums";

const assignmentService = new AssignmentService();

async function runTests() {
  console.log("Initializing test database sandbox...");

  // 1. Setup mock data
  const user = await prisma.user.create({
    data: {
      name: "Test Coordinator",
      email: "coord@test.com",
      password: "pwd",
      isActive: true
    }
  });

  const volunteer1 = await prisma.volunteer.create({
    data: {
      userId: user.id,
      bio: "Vol 1"
    }
  });

  const volunteer2 = await prisma.volunteer.create({
    data: {
      userId: user.id, // Re-use user for mock ease
      bio: "Vol 2"
    }
  });

  const pillar = await prisma.pillar.create({
    data: {
      name: "Pillar A",
      description: "Test Pillar",
      color: "#ff0000"
    }
  });

  const project = await prisma.project.create({
    data: {
      pillarId: pillar.id,
      name: "Test Project",
      status: "PUBLISHED"
    }
  });

  const event = await prisma.event.create({
    data: {
      projectId: project.id,
      name: "Test Event",
      status: "OPEN",
      createdBy: user.id
    }
  });

  // Create event participations
  await prisma.eventParticipation.createMany({
    data: [
      { eventId: event.id, volunteerId: volunteer1.id, status: "REGISTERED" },
      { eventId: event.id, volunteerId: volunteer2.id, status: "REGISTERED" }
    ]
  });

  const task = await prisma.task.create({
    data: {
      eventId: event.id,
      createdBy: user.id,
      title: "Test Task",
      priority: "MEDIUM",
      taskStatus: "OPEN"
    }
  });

  // Assign task to both volunteers
  await assignmentService.assignTask(task.id, volunteer1.id, user.id, event.id);
  await assignmentService.assignTask(task.id, volunteer2.id, user.id, event.id);

  console.log("Initial Setup Successful.");

  // Test Case 1: First submission. Global task should remain IN_PROGRESS/OPEN
  await assignmentService.acceptAssignment(task.id, volunteer1.id, user.id);
  await assignmentService.startAssignment(task.id, volunteer1.id, user.id);
  await assignmentService.submitAssignment(task.id, volunteer1.id, user.id, "Submission 1");

  const taskCheck1 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 1 (One Submit): Global status is", taskCheck1.taskStatus);
  if (taskCheck1.taskStatus === "IN_REVIEW") {
    throw new Error("Failure: Task status went to IN_REVIEW before all submissions!");
  }

  // Test Case 2: Second submission. Global task should atomically go to IN_REVIEW
  await assignmentService.acceptAssignment(task.id, volunteer2.id, user.id);
  await assignmentService.startAssignment(task.id, volunteer2.id, user.id);
  await assignmentService.submitAssignment(task.id, volunteer2.id, user.id, "Submission 2");

  const taskCheck2 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 2 (All Submitted): Global status is", taskCheck2.taskStatus);
  if (taskCheck2.taskStatus !== "IN_REVIEW") {
    throw new Error("Failure: Task status did not transition to IN_REVIEW!");
  }

  console.log("All tests passed successfully!");
}

async function cleanup() {
  console.log("Cleaning up test database...");
  await prisma.taskComment.deleteMany();
  await prisma.taskEvidence.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.eventParticipation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.project.deleteMany();
  await prisma.pillar.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.user.deleteMany();
}

runTests()
  .catch(console.error)
  .finally(async () => {
    await cleanup();
    process.exit(0);
  });
```

### B. Execution Command
The test script can be run locally using the existing environment variables:
```bash
DATABASE_URL="postgresql://user:pass@host:port/db" npx tsx test-transitions.ts
```
