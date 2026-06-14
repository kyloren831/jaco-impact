import { prisma } from "../lib/prisma";
import { AssignmentService } from "../domain/assignments/service";
import { AssignmentStatus, TaskStatus } from "../generated/prisma/enums";
import { initializeDomainEvents } from "../domain/shared/init";

initializeDomainEvents();

const assignmentService = new AssignmentService();

async function runStressTest() {
  console.log("=== STARTING CONCURRENCY AND STRESS TEST ===");

  // 1. Setup mock data
  const timestamp = Date.now();
  const user = await prisma.user.create({
    data: {
      name: "Stress Test Coordinator",
      email: `stress-coord-${timestamp}@test.com`,
      password: "pwd",
      isActive: true
    }
  });

  const userVol1 = await prisma.user.create({
    data: {
      name: "Stress Vol 1 User",
      email: `stress-vol1-${timestamp}@test.com`,
      password: "pwd",
      isActive: true
    }
  });

  const userVol2 = await prisma.user.create({
    data: {
      name: "Stress Vol 2 User",
      email: `stress-vol2-${timestamp}@test.com`,
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

  const pillar = await prisma.pillar.create({
    data: {
      name: `Stress Pillar - ${timestamp}`,
      description: "Stress Test Pillar",
      color: "#0000ff",
      iconUrl: "/icons/env.svg",
      coordinatorId: user.id
    }
  });

  const project = await prisma.project.create({
    data: {
      pillarId: pillar.id,
      createdBy: user.id,
      name: `Stress Project - ${timestamp}`,
      description: "Stress Project Description",
      visibility: "PUBLIC",
      status: "PUBLISHED"
    }
  });

  const event = await prisma.event.create({
    data: {
      projectId: project.id,
      name: `Stress Event - ${timestamp}`,
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
      { eventId: event.id, volunteerId: volunteer2.id, status: "REGISTERED" }
    ]
  });

  const task = await prisma.task.create({
    data: {
      eventId: event.id,
      createdBy: user.id,
      title: "Stress Task",
      priority: "HIGH",
      taskStatus: "OPEN"
    }
  });

  // Assign task to both volunteers
  await assignmentService.assignTask(task.id, volunteer1.id, user.id, event.id);
  await assignmentService.assignTask(task.id, volunteer2.id, user.id, event.id);

  // Both volunteers accept and start
  await assignmentService.acceptAssignment(task.id, volunteer1.id, user.id);
  await assignmentService.startAssignment(task.id, volunteer1.id, user.id);

  await assignmentService.acceptAssignment(task.id, volunteer2.id, user.id);
  await assignmentService.startAssignment(task.id, volunteer2.id, user.id);

  console.log("Setup complete. Spawning concurrent submit transitions...");

  // Run concurrent submissions
  const start = Date.now();
  
  const results = await Promise.allSettled([
    assignmentService.submitAssignment(task.id, volunteer1.id, user.id, "Submission Vol 1"),
    assignmentService.submitAssignment(task.id, volunteer2.id, user.id, "Submission Vol 2")
  ]);

  const duration = Date.now() - start;
  console.log(`Concurrent execution finished in ${duration}ms.`);

  // Check results
  let successCount = 0;
  let failureCount = 0;
  results.forEach((r, idx) => {
    if (r.status === "fulfilled") {
      console.log(`Volunteer ${idx + 1} submission succeeded.`);
      successCount++;
    } else {
      console.error(`Volunteer ${idx + 1} submission failed:`, r.reason);
      failureCount++;
    }
  });

  // Verify DB state
  const taskCheck = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  const assignments = await prisma.taskAssignment.findMany({ where: { taskId: task.id } });

  console.log("\n=== POST-STRESS STATE ANALYSIS ===");
  console.log("Global Task Status:", taskCheck.taskStatus);
  assignments.forEach((a) => {
    console.log(`Volunteer Assignment (id: ${a.volunteerId}): Status = ${a.status}`);
  });

  if (taskCheck.taskStatus === "IN_REVIEW") {
    console.log("\n✅ SUCCESS: Task transitioned to IN_REVIEW successfully under concurrent load.");
  } else {
    console.error("\n❌ FAILURE: Task failed to transition to IN_REVIEW under concurrent load!");
  }

  // Cleanup
  console.log("\nCleaning up stress test database sandbox...");
  await prisma.taskComment.deleteMany({ where: { taskId: task.id } });
  await prisma.taskEvidence.deleteMany({ where: { taskId: task.id } });
  await prisma.taskAssignment.deleteMany({ where: { taskId: task.id } });
  await prisma.task.delete({ where: { id: task.id } });
  await prisma.eventParticipation.deleteMany({ where: { eventId: event.id } });
  await prisma.event.delete({ where: { id: event.id } });
  await prisma.project.delete({ where: { id: project.id } });
  await prisma.pillar.delete({ where: { id: pillar.id } });
  await prisma.volunteer.deleteMany({ where: { id: { in: [volunteer1.id, volunteer2.id] } } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log("Cleanup finished.");

  if (taskCheck.taskStatus !== "IN_REVIEW") {
    throw new Error("Stress test failed!");
  }
}

runStressTest()
  .catch((err) => {
    console.error("Stress test execution failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.exit();
  });
