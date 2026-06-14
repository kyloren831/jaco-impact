import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { prisma } from "../../../lib/prisma";
import { resetAndSeed } from "../helpers/db";
import { getAuthCookie } from "../helpers/auth";
import { executeAction } from "../helpers/actions";
import { SSEClient } from "../helpers/sse";

function createMockFile(content: string, name: string, type: string) {
  if (typeof File !== "undefined") {
    return new File([content], name, { type });
  } else {
    const { Blob } = require("buffer");
    const blob = new Blob([content], { type }) as any;
    blob.name = name;
    return blob;
  }
}

describe("Tier 3 E2E Test Suite - Cross-Feature Combinations", () => {
  let seed: any;
  let vol1Cookie: string;
  let vol2Cookie: string;
  let coordCookie: string;
  let adminCookie: string;

  before(async () => {
    seed = await resetAndSeed();
    vol1Cookie = await getAuthCookie({
      userId: seed.vol1User.id,
      email: seed.vol1User.email,
      role: "VOLUNTEER",
      roles: ["VOLUNTEER"],
    });
    vol2Cookie = await getAuthCookie({
      userId: seed.vol2User.id,
      email: seed.vol2User.email,
      role: "VOLUNTEER",
      roles: ["VOLUNTEER"],
    });
    coordCookie = await getAuthCookie({
      userId: seed.coordUser.id,
      email: seed.coordUser.email,
      role: "COORDINATOR",
      roles: ["COORDINATOR"],
      pillarId: seed.pillar.id,
    });
    adminCookie = await getAuthCookie({
      userId: seed.adminUser.id,
      email: seed.adminUser.email,
      role: "ADMIN",
      roles: ["ADMIN"],
    });
  });

  it("1. should complete the end-to-end happy path flow: register -> accept -> start -> submit -> comment -> SSE -> auto-transition -> coordinator approve", async () => {
    // 1. Establish SSE client
    const sse = new SSEClient("http://localhost:3005/api/realtime");
    await sse.connect();
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Clear previous assignments for task1
    await prisma.taskAssignment.deleteMany({ where: { taskId: seed.task1.id } });

    // 2. Register volunteer to event
    const regRes = await executeAction("registerToEventAction", [seed.event1.id], vol1Cookie);
    assert.strictEqual(regRes.success, true);

    // Assign volunteer to task1
    const assignRes = await executeAction("assignVolunteerAction", [seed.task1.id, seed.volunteer1.id], coordCookie);
    assert.strictEqual(assignRes.success, true);

    // 3. Accept assignment
    const acceptRes = await executeAction("acceptAssignmentAction", [seed.task1.id], vol1Cookie);
    assert.strictEqual(acceptRes.success, true);

    // 4. Start assignment
    const startRes = await executeAction("startAssignmentAction", [seed.task1.id], vol1Cookie);
    assert.strictEqual(startRes.success, true);

    // 5. Submit evidence
    const formData = new FormData();
    formData.append("taskId", String(seed.task1.id));
    formData.append("description", "Final work done");
    formData.append("file", createMockFile("img data", "work.png", "image/png"));

    const submitRes = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    assert.strictEqual(submitRes.success, true);
    const evidenceId = submitRes.data.id;
    assert.ok(evidenceId);

    // 6. Comment
    const commentRes = await executeAction("addTaskCommentAction", [seed.task1.id, "Happy path comment"], vol1Cookie);
    assert.strictEqual(commentRes.success, true);

    // Wait for SSE broadcasts
    await new Promise((resolve) => setTimeout(resolve, 300));
    const events = sse.getEvents();

    // Verify SSE broadcasts
    const registerEvent = events.find((e) => e.type === "VOLUNTEER_REGISTERED");
    const acceptEvent = events.find((e) => e.type === "ASSIGNMENT_ACCEPTED");
    const startEvent = events.find((e) => e.type === "ASSIGNMENT_STARTED");
    const submitEvent = events.find((e) => e.type === "EVIDENCE_SUBMITTED");
    const commentEvent = events.find((e) => e.type === "TASK_COMMENT");

    assert.ok(registerEvent, "Should receive VOLUNTEER_REGISTERED SSE event");
    assert.ok(acceptEvent, "Should receive ASSIGNMENT_ACCEPTED SSE event");
    assert.ok(startEvent, "Should receive ASSIGNMENT_STARTED SSE event");
    assert.ok(submitEvent, "Should receive EVIDENCE_SUBMITTED SSE event");
    assert.ok(commentEvent, "Should receive TASK_COMMENT SSE event");

    // 7. Verify auto-transition of TaskStatus to IN_REVIEW
    const task = await prisma.task.findUniqueOrThrow({ where: { id: seed.task1.id } });
    assert.strictEqual(task.taskStatus, "IN_REVIEW");

    // 8. Coordinator approves evidence
    const reviewRes = await executeAction("reviewEvidenceAction", [evidenceId, "APPROVED", "Excellent work"], coordCookie);
    assert.strictEqual(reviewRes.success, true);

    // Verify assignment is approved
    const assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "APPROVED");

    sse.close();
  });

  it("2. should handle double volunteer parallel assignments where one volunteer submits and the other declines", async () => {
    // Reset assignments for task 2
    await prisma.taskAssignment.deleteMany({ where: { taskId: seed.task2.id } });

    // Assign task 2 to volunteer 1 and volunteer 2
    await executeAction("assignVolunteerAction", [seed.task2.id, seed.volunteer1.id], coordCookie);
    await executeAction("assignVolunteerAction", [seed.task2.id, seed.volunteer2.id], coordCookie);

    // Ensure task 2 is in OPEN/IN_PROGRESS state initially
    await prisma.task.update({ where: { id: seed.task2.id }, data: { taskStatus: "OPEN" } });

    // Volunteer 1 accepts, starts, submits evidence
    await executeAction("acceptAssignmentAction", [seed.task2.id], vol1Cookie);
    await executeAction("startAssignmentAction", [seed.task2.id], vol1Cookie);

    const formData = new FormData();
    formData.append("taskId", String(seed.task2.id));
    formData.append("file", createMockFile("data", "v1.png", "image/png"));
    const submitRes = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    assert.strictEqual(submitRes.success, true);

    // Volunteer 2 declines assignment
    const declineRes = await executeAction("declineAssignmentAction", [seed.task2.id, "Unable to help"], vol2Cookie);
    assert.strictEqual(declineRes.success, true);

    // Verify task status derives to IN_REVIEW because only active assignment (Vol 1) is submitted
    const task = await prisma.task.findUniqueOrThrow({ where: { id: seed.task2.id } });
    assert.strictEqual(task.taskStatus, "IN_REVIEW");
  });

  it("3. should handle rejection and revision loops for a task assignment", async () => {
    // Fresh task for this flow
    const loopTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Revision Loop Task",
        priority: "HIGH",
        taskStatus: "OPEN",
      },
    });

    await executeAction("assignVolunteerAction", [loopTask.id, seed.volunteer1.id], coordCookie);
    await executeAction("acceptAssignmentAction", [loopTask.id], vol1Cookie);
    await executeAction("startAssignmentAction", [loopTask.id], vol1Cookie);

    // Volunteer submits first evidence
    let formData = new FormData();
    formData.append("taskId", String(loopTask.id));
    formData.append("file", createMockFile("draft 1", "draft1.png", "image/png"));
    const submit1 = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    assert.strictEqual(submit1.success, true);
    const evidenceId1 = submit1.data.id;

    // Coordinator reviews and rejects (requests revision)
    const rejectRes = await executeAction("reviewEvidenceAction", [evidenceId1, "REJECTED", "Please improve quality"], coordCookie);
    assert.strictEqual(rejectRes.success, true);

    // Verify assignment status transitioned to REVISION_REQUESTED
    let assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: loopTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "REVISION_REQUESTED");

    // Verify parent task reverted to IN_PROGRESS (so work can continue)
    let task = await prisma.task.findUniqueOrThrow({ where: { id: loopTask.id } });
    assert.strictEqual(task.taskStatus, "IN_PROGRESS");

    // Volunteer starts work again
    const startAgain = await executeAction("startAssignmentAction", [loopTask.id], vol1Cookie);
    assert.strictEqual(startAgain.success, true);

    // Volunteer submits second evidence
    formData = new FormData();
    formData.append("taskId", String(loopTask.id));
    formData.append("file", createMockFile("final version", "final.png", "image/png"));
    const submit2 = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    assert.strictEqual(submit2.success, true);
    const evidenceId2 = submit2.data.id;

    // Coordinator reviews and approves
    const approveRes = await executeAction("reviewEvidenceAction", [evidenceId2, "APPROVED", "Perfect!"], coordCookie);
    assert.strictEqual(approveRes.success, true);

    // Verify final state
    assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: loopTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "APPROVED");
  });

  it("4. should cascade event cancellation to all active task assignments", async () => {
    // Create an event with a task and assignment
    const cancelProj = await prisma.project.create({
      data: {
        pillarId: seed.pillar.id,
        createdBy: seed.coordUser.id,
        name: "Cancel Project",
        description: "Cancel Project Description",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
    });

    const cancelEvent = await prisma.event.create({
      data: {
        projectId: cancelProj.id,
        createdBy: seed.coordUser.id,
        name: "Soon to be cancelled event",
        eventDate: new Date(),
        visibility: "PUBLIC",
        status: "OPEN",
      },
    });

    const cancelTask = await prisma.task.create({
      data: {
        eventId: cancelEvent.id,
        createdBy: seed.coordUser.id,
        title: "Cancel Task",
        priority: "MEDIUM",
        taskStatus: "OPEN",
      },
    });

    // Register volunteer 1 to the event
    await prisma.eventParticipation.create({
      data: {
        eventId: cancelEvent.id,
        volunteerId: seed.volunteer1.id,
        status: "REGISTERED",
      },
    });

    // Assign task
    await executeAction("assignVolunteerAction", [cancelTask.id, seed.volunteer1.id], coordCookie);
    // Volunteer accepts task
    await executeAction("acceptAssignmentAction", [cancelTask.id], vol1Cookie);

    // Verify assignment is ACCEPTED
    let assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: cancelTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "ACCEPTED");

    // Coordinator cancels the event
    const cancelRes = await executeAction("cancelEventAction", [cancelEvent.id], coordCookie);
    assert.strictEqual(cancelRes.success, true);

    // Verify event is CANCELLED
    const event = await prisma.event.findUniqueOrThrow({ where: { id: cancelEvent.id } });
    assert.strictEqual(event.status, "CANCELLED");

    // Verify assignment cascaded to CANCELLED
    assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: cancelTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "CANCELLED");
  });

  it("5. should verify SSE synchronization for multiple clients during comments and transitions", async () => {
    // Setup two SSE Clients
    const client1 = new SSEClient("http://localhost:3005/api/realtime");
    const client2 = new SSEClient("http://localhost:3005/api/realtime");
    await client1.connect();
    await client2.connect();
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Clear and prepare task for commenting
    await prisma.taskComment.deleteMany({ where: { taskId: seed.task1.id } });
    client1.clearEvents();
    client2.clearEvents();

    // Add a comment
    const res = await executeAction("addTaskCommentAction", [seed.task1.id, "Multi-client comment"], vol1Cookie);
    assert.strictEqual(res.success, true);

    // Wait for SSE broadcast
    await new Promise((resolve) => setTimeout(resolve, 300));

    const events1 = client1.getEvents();
    const events2 = client2.getEvents();

    const commentEvent1 = events1.find((e) => e.type === "TASK_COMMENT" && e.payload.content === "Multi-client comment");
    const commentEvent2 = events2.find((e) => e.type === "TASK_COMMENT" && e.payload.content === "Multi-client comment");

    assert.ok(commentEvent1, "Client 1 should receive TASK_COMMENT event");
    assert.ok(commentEvent2, "Client 2 should receive TASK_COMMENT event");

    client1.close();
    client2.close();
  });

  it("6. should enforce security role isolation across all actions (VOLUNTEER, COORDINATOR, ADMIN)", async () => {
    // Coordinator actions should block VOLUNTEER
    const cancelRes = await executeAction("cancelEventAction", [seed.event1.id], vol1Cookie);
    assert.strictEqual(cancelRes.success, false);

    const reviewRes = await executeAction("reviewEvidenceAction", [1, "APPROVED", "nice"], vol1Cookie);
    assert.strictEqual(reviewRes.success, false);

    // Volunteer actions should block COORDINATOR
    const acceptRes = await executeAction("acceptAssignmentAction", [seed.task1.id], coordCookie);
    assert.strictEqual(acceptRes.success, false);
  });

  it("7. should handle task assignment removal by coordinator", async () => {
    // Setup task and accepted assignment
    const removeTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Removal Task",
        priority: "MEDIUM",
        taskStatus: "OPEN",
      },
    });

    await executeAction("assignVolunteerAction", [removeTask.id, seed.volunteer1.id], coordCookie);
    await executeAction("acceptAssignmentAction", [removeTask.id], vol1Cookie);

    // Verify assignment is ACCEPTED
    let assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: removeTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "ACCEPTED");

    // Coordinator removes volunteer from task
    const removeRes = await executeAction("removeVolunteerAction", [removeTask.id, seed.volunteer1.id], coordCookie);
    assert.strictEqual(removeRes.success, true);

    // Verify assignment status changed to CANCELLED
    assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: removeTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "CANCELLED");
  });

  it("8. should verify register -> accept -> decline -> re-assign cycle", async () => {
    const cycleTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Cycle Task",
        priority: "MEDIUM",
        taskStatus: "OPEN",
      },
    });

    // 1. Assign to volunteer
    await executeAction("assignVolunteerAction", [cycleTask.id, seed.volunteer1.id], coordCookie);

    // 2. Volunteer declines
    await executeAction("declineAssignmentAction", [cycleTask.id, "Changed mind"], vol1Cookie);
    let assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: cycleTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "DECLINED");

    // 3. Coordinator re-assigns
    const reassignRes = await executeAction("assignVolunteerAction", [cycleTask.id, seed.volunteer1.id], coordCookie);
    assert.strictEqual(reassignRes.success, true);

    // 4. Verify status is PENDING_ACCEPTANCE again
    assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: cycleTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "PENDING_ACCEPTANCE");

    // 5. Volunteer accepts
    const acceptRes = await executeAction("acceptAssignmentAction", [cycleTask.id], vol1Cookie);
    assert.strictEqual(acceptRes.success, true);

    assignment = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: cycleTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(assignment.status, "ACCEPTED");
  });

  it("9. should broadcast ASSIGNMENT_STATUS_CHANGED for all assignment status transitions including evidence submission and reviews", async () => {
    // 1. Establish SSE client
    const sse = new SSEClient("http://localhost:3005/api/realtime");
    await sse.connect();
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Fresh task for this flow
    const sseTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "SSE Lifecycle Task",
        priority: "HIGH",
        taskStatus: "OPEN",
      },
    });

    // 2. Assign to volunteer (PENDING_ACCEPTANCE)
    await executeAction("assignVolunteerAction", [sseTask.id, seed.volunteer1.id], coordCookie);
    
    // 3. Accept assignment -> should emit ASSIGNMENT_STATUS_CHANGED (ACCEPTED)
    sse.clearEvents();
    await executeAction("acceptAssignmentAction", [sseTask.id], vol1Cookie);
    await new Promise((resolve) => setTimeout(resolve, 200));
    let changeEvents = sse.getEvents().filter((e) => e.type === "ASSIGNMENT_STATUS_CHANGED");
    assert.strictEqual(changeEvents.length, 1, "Should emit exactly 1 ASSIGNMENT_STATUS_CHANGED for accept");
    assert.strictEqual(changeEvents[0].payload.newStatus, "ACCEPTED");

    // 4. Start assignment -> should emit ASSIGNMENT_STATUS_CHANGED (IN_PROGRESS)
    sse.clearEvents();
    await executeAction("startAssignmentAction", [sseTask.id], vol1Cookie);
    await new Promise((resolve) => setTimeout(resolve, 200));
    changeEvents = sse.getEvents().filter((e) => e.type === "ASSIGNMENT_STATUS_CHANGED");
    assert.strictEqual(changeEvents.length, 1, "Should emit exactly 1 ASSIGNMENT_STATUS_CHANGED for start");
    assert.strictEqual(changeEvents[0].payload.newStatus, "IN_PROGRESS");

    // 5. Submit evidence -> should emit ASSIGNMENT_STATUS_CHANGED (SUBMITTED)
    sse.clearEvents();
    const formData = new FormData();
    formData.append("taskId", String(sseTask.id));
    formData.append("file", createMockFile("sse test evidence", "sse.png", "image/png"));
    const submitRes = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    assert.strictEqual(submitRes.success, true);
    const evidenceId = submitRes.data.id;
    assert.ok(evidenceId);
    
    await new Promise((resolve) => setTimeout(resolve, 200));
    changeEvents = sse.getEvents().filter((e) => e.type === "ASSIGNMENT_STATUS_CHANGED");
    assert.strictEqual(changeEvents.length, 1, "Should emit exactly 1 ASSIGNMENT_STATUS_CHANGED for evidence submission");
    assert.strictEqual(changeEvents[0].payload.newStatus, "SUBMITTED");

    // 6. Review evidence (approve) -> should emit ASSIGNMENT_STATUS_CHANGED (APPROVED)
    sse.clearEvents();
    const reviewRes = await executeAction("reviewEvidenceAction", [evidenceId, "APPROVED", "SSE approved"], coordCookie);
    assert.strictEqual(reviewRes.success, true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    changeEvents = sse.getEvents().filter((e) => e.type === "ASSIGNMENT_STATUS_CHANGED");
    assert.strictEqual(changeEvents.length, 1, "Should emit exactly 1 ASSIGNMENT_STATUS_CHANGED for evidence approval");
    assert.strictEqual(changeEvents[0].payload.newStatus, "APPROVED");

    sse.close();
  });
});
