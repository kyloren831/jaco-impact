import { prisma } from "./lib/prisma";
import { AssignmentService } from "./domain/assignments/service";
import { AssignmentStatus, TaskStatus } from "./generated/prisma/enums";
import { initializeDomainEvents } from "./domain/shared/init";

initializeDomainEvents();

const assignmentService = new AssignmentService();

async function runTests() {
  console.log("Initializing test database sandbox...");

  // 1. Setup mock data
  const user = await prisma.user.create({
    data: {
      name: "Test Coordinator",
      email: `coord-${Date.now()}@test.com`,
      password: "pwd",
      isActive: true
    }
  });

  const userVol1 = await prisma.user.create({
    data: {
      name: "Vol 1 User",
      email: `vol1-${Date.now()}@test.com`,
      password: "pwd",
      isActive: true
    }
  });

  const userVol2 = await prisma.user.create({
    data: {
      name: "Vol 2 User",
      email: `vol2-${Date.now()}@test.com`,
      password: "pwd",
      isActive: true
    }
  });

  const userVol3 = await prisma.user.create({
    data: {
      name: "Vol 3 User",
      email: `vol3-${Date.now()}@test.com`,
      password: "pwd",
      isActive: true
    }
  });

  const volunteer1 = await prisma.volunteer.create({
    data: {
      userId: userVol1.id,
      phone: "12345678",
      nationality: "Costa Rica",
      profession: "Developer",
      emergencyContactName: "Emergency 1",
      emergencyContactPhone: "87654321",
      inmediateAvailability: true
    }
  });

  const volunteer2 = await prisma.volunteer.create({
    data: {
      userId: userVol2.id,
      phone: "87654321",
      nationality: "Costa Rica",
      profession: "Designer",
      emergencyContactName: "Emergency 2",
      emergencyContactPhone: "12345678",
      inmediateAvailability: true
    }
  });

  const volunteer3 = await prisma.volunteer.create({
    data: {
      userId: userVol3.id,
      phone: "55555555",
      nationality: "Costa Rica",
      profession: "Other",
      emergencyContactName: "Emergency 3",
      emergencyContactPhone: "55555556",
      inmediateAvailability: true
    }
  });

  const pillar = await prisma.pillar.create({
    data: {
      name: `Pillar A - ${Date.now()}`,
      description: "Test Pillar",
      color: "#ff0000",
      iconUrl: "/icons/env.svg",
      coordinatorId: user.id
    }
  });

  const project = await prisma.project.create({
    data: {
      pillarId: pillar.id,
      createdBy: user.id,
      name: `Test Project - ${Date.now()}`,
      description: "Test project description",
      visibility: "PUBLIC",
      status: "PUBLISHED"
    }
  });

  const event = await prisma.event.create({
    data: {
      projectId: project.id,
      name: `Test Event - ${Date.now()}`,
      status: "OPEN",
      createdBy: user.id,
      visibility: "PUBLIC",
      eventDate: new Date()
    }
  });

  // Create event participations
  await prisma.eventParticipation.createMany({
    data: [
      { eventId: event.id, volunteerId: volunteer1.id, status: "REGISTERED" },
      { eventId: event.id, volunteerId: volunteer2.id, status: "REGISTERED" },
      { eventId: event.id, volunteerId: volunteer3.id, status: "REGISTERED" }
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

  console.log("Initial Setup Successful. Assigning volunteers...");

  // Assign task to volunteer1 and volunteer2
  await assignmentService.assignTask(task.id, volunteer1.id, user.id, event.id);
  await assignmentService.assignTask(task.id, volunteer2.id, user.id, event.id);

  // Test Case 1: First volunteer accepts, starts, and submits. Global task should transition from OPEN to IN_PROGRESS.
  console.log("\n--- Running Test Case 1: First submission ---");
  await assignmentService.acceptAssignment(task.id, volunteer1.id, user.id);
  await assignmentService.startAssignment(task.id, volunteer1.id, user.id);
  await assignmentService.submitAssignment(task.id, volunteer1.id, user.id, "Submission 1");

  const taskCheck1 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 1 (One Submit): Global status is", taskCheck1.taskStatus);
  if (taskCheck1.taskStatus !== "IN_PROGRESS") {
    throw new Error(`Failure: Task status is ${taskCheck1.taskStatus}, expected IN_PROGRESS!`);
  }

  // Test Case 2: Second volunteer accepts, starts, and submits. Global task should atomically go to IN_REVIEW.
  console.log("\n--- Running Test Case 2: All active assignments submitted ---");
  await assignmentService.acceptAssignment(task.id, volunteer2.id, user.id);
  await assignmentService.startAssignment(task.id, volunteer2.id, user.id);
  await assignmentService.submitAssignment(task.id, volunteer2.id, user.id, "Submission 2");

  const taskCheck2 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 2 (All Submitted): Global status is", taskCheck2.taskStatus);
  if (taskCheck2.taskStatus !== "IN_REVIEW") {
    throw new Error(`Failure: Task status is ${taskCheck2.taskStatus}, expected IN_REVIEW!`);
  }

  // Test Case 3: Revision requested for volunteer 1. Global task should revert to IN_PROGRESS.
  console.log("\n--- Running Test Case 3: Revision requested for one assignment ---");
  await assignmentService.reviewAssignment(task.id, volunteer1.id, user.id, "REVISION_REQUESTED");

  const taskCheck3 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 3 (One Revision Requested): Global status is", taskCheck3.taskStatus);
  if (taskCheck3.taskStatus !== "IN_PROGRESS") {
    throw new Error(`Failure: Task status is ${taskCheck3.taskStatus}, expected IN_PROGRESS!`);
  }

  // Test Case 4: Volunteer 1 resubmits. Global task should transition back to IN_REVIEW.
  console.log("\n--- Running Test Case 4: Volunteer 1 resubmits ---");
  await assignmentService.startAssignment(task.id, volunteer1.id, user.id);
  await assignmentService.submitAssignment(task.id, volunteer1.id, user.id, "Submission 1 v2");

  const taskCheck4 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 4 (Resubmitted): Global status is", taskCheck4.taskStatus);
  if (taskCheck4.taskStatus !== "IN_REVIEW") {
    throw new Error(`Failure: Task status is ${taskCheck4.taskStatus}, expected IN_REVIEW!`);
  }

  // Test Case 5: Assign volunteer 3. Global task should revert to IN_PROGRESS.
  console.log("\n--- Running Test Case 5: Assign new volunteer ---");
  await assignmentService.assignTask(task.id, volunteer3.id, user.id, event.id);

  const taskCheck5 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 5 (New Volunteer Assigned): Global status is", taskCheck5.taskStatus);
  if (taskCheck5.taskStatus !== "IN_PROGRESS") {
    throw new Error(`Failure: Task status is ${taskCheck5.taskStatus}, expected IN_PROGRESS!`);
  }

  // Test Case 6: Volunteer 3 declines. Since volunteer 3 is no longer active, the task should transition back to IN_REVIEW.
  console.log("\n--- Running Test Case 6: Volunteer declines (not active anymore) ---");
  await assignmentService.declineAssignment(task.id, volunteer3.id, user.id, "Not interested");

  const taskCheck6 = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  console.log("Check 6 (Volunteer Declined): Global status is", taskCheck6.taskStatus);
  if (taskCheck6.taskStatus !== "IN_REVIEW") {
    throw new Error(`Failure: Task status is ${taskCheck6.taskStatus}, expected IN_REVIEW!`);
  }

  console.log("\nAll tests passed successfully!");
}

async function cleanup() {
  console.log("Cleaning up test database...");
  try {
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
    console.log("Cleanup finished.");
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    process.exit();
  });
