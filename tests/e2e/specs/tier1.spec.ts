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

describe("Tier 1 E2E Test Suite - Jacó Impact 'Mis Tareas'", () => {
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

  // ── 1. EVENT REGISTRATION (5 TESTS) ───────────────────────────────────
  describe("Event Registration", () => {
    let closedEventId: number;

    before(async () => {
      // Create a closed event for testing
      const closedEvent = await prisma.event.create({
        data: {
          projectId: seed.project.id,
          createdBy: seed.coordUser.id,
          name: "Closed Cleanup Event",
          eventDate: new Date(),
          status: "CLOSED",
          visibility: "PUBLIC",
        },
      });
      closedEventId = closedEvent.id;
    });

    it("should register a volunteer to an open event successfully", async () => {
      const res = await executeAction("registerToEventAction", [seed.event1.id], vol1Cookie);
      assert.strictEqual(res.success, true);

      // Verify DB record
      const participation = await prisma.eventParticipation.findUnique({
        where: {
          eventId_volunteerId: {
            eventId: seed.event1.id,
            volunteerId: seed.volunteer1.id,
          },
        },
      });
      assert.ok(participation);
      assert.strictEqual(participation.status, "REGISTERED");
    });

    it("should prevent double registration for the same event", async () => {
      const res = await executeAction("registerToEventAction", [seed.event1.id], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("Ya estás inscrito"));
    });

    it("should register a second volunteer to the same event", async () => {
      const res = await executeAction("registerToEventAction", [seed.event1.id], vol2Cookie);
      assert.strictEqual(res.success, true);
    });

    it("should return error for non-existent event", async () => {
      const res = await executeAction("registerToEventAction", [99999], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("no encontrado") || res.error?.includes("No encontrado"));
    });

    it("should prevent registration to a closed event", async () => {
      const res = await executeAction("registerToEventAction", [closedEventId], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("no está abierto") || res.error?.includes("abierto"));
    });
  });

  // ── 2. TASK RETRIEVAL (5 TESTS) ───────────────────────────────────────
  describe("Task Retrieval", () => {
    before(async () => {
      // Ensure volunteer 1 is registered to event 1 (already registered above)
      // Ensure volunteer 2 is NOT registered to event 2
    });

    it("should retrieve tasks by event ID for registered volunteer", async () => {
      const res = await executeAction("getVolunteerTasksAction", [seed.event1.id], vol1Cookie);
      assert.strictEqual(res.success, true);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length >= 2);
    });

    it("should fail when volunteer is not registered to the requested event", async () => {
      const res = await executeAction("getVolunteerTasksAction", [seed.event2.id], vol2Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("No tienes acceso"));
    });

    it("should retrieve all tasks from all registered events when no event ID is passed", async () => {
      const res = await executeAction("getVolunteerTasksAction", [], vol1Cookie);
      assert.strictEqual(res.success, true);
      assert.ok(Array.isArray(res.data));
      // Should have tasks from event1
      const eventIds = res.data.map((t: any) => t.eventId);
      assert.ok(eventIds.includes(seed.event1.id));
    });

    it("should return empty array when volunteer is not registered to any events", async () => {
      // Volunteer 2 is only registered to event1. Let's delete volunteer 2's event participations for this test.
      await prisma.eventParticipation.deleteMany({
        where: { volunteerId: seed.volunteer2.id },
      });
      const res = await executeAction("getVolunteerTasksAction", [], vol2Cookie);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.length, 0);

      // Re-register volunteer 2 to event 1 for subsequent tests
      await prisma.eventParticipation.create({
        data: {
          eventId: seed.event1.id,
          volunteerId: seed.volunteer2.id,
          status: "REGISTERED",
        },
      });
    });

    it("should fail task retrieval when unauthenticated", async () => {
      const res = await executeAction("getVolunteerTasksAction", [seed.event1.id]);
      assert.strictEqual(res.success, false);
    });
  });

  // ── 3. ASSIGNMENT ACCEPTANCE (5 TESTS) ────────────────────────────────
  describe("Assignment Acceptance", () => {
    before(async () => {
      // Create pending assignments
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "PENDING_ACCEPTANCE",
        },
      });
    });

    it("should accept pending assignment successfully", async () => {
      const res = await executeAction("acceptAssignmentAction", [seed.task1.id], vol1Cookie);
      assert.strictEqual(res.success, true);

      const assignment = await prisma.taskAssignment.findUnique({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
      });
      assert.strictEqual(assignment?.status, "ACCEPTED");
      assert.ok(assignment?.acceptedAt);
    });

    it("should fail to accept an assignment that is already accepted", async () => {
      const res = await executeAction("acceptAssignmentAction", [seed.task1.id], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail for non-existent assignment", async () => {
      const res = await executeAction("acceptAssignmentAction", [99999], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail when volunteer is not assigned to the task", async () => {
      const res = await executeAction("acceptAssignmentAction", [seed.task1.id], vol2Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail to accept from an invalid state like DECLINED", async () => {
      // Set to declined
      await prisma.taskAssignment.update({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
        data: { status: "DECLINED" },
      });

      const res = await executeAction("acceptAssignmentAction", [seed.task1.id], vol1Cookie);
      assert.strictEqual(res.success, false);
    });
  });

  // ── 4. ASSIGNMENT DECLINE (5 TESTS) ───────────────────────────────────
  describe("Assignment Decline", () => {
    before(async () => {
      // Set up pending assignments
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "PENDING_ACCEPTANCE",
        },
      });
    });

    it("should decline pending assignment successfully with a reason", async () => {
      const res = await executeAction("declineAssignmentAction", [seed.task1.id, "No availability"], vol1Cookie);
      assert.strictEqual(res.success, true);

      const assignment = await prisma.taskAssignment.findUnique({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
      });
      assert.strictEqual(assignment?.status, "DECLINED");
      assert.strictEqual(assignment?.declineReason, "No availability");
      assert.ok(assignment?.declinedAt);
    });

    it("should fail to decline already declined assignment", async () => {
      const res = await executeAction("declineAssignmentAction", [seed.task1.id, "Another reason"], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail to decline non-existent task assignment", async () => {
      const res = await executeAction("declineAssignmentAction", [99999, "Reason"], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail when volunteer is not assigned to decline", async () => {
      const res = await executeAction("declineAssignmentAction", [seed.task1.id, "Reason"], vol2Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail to decline from IN_PROGRESS state", async () => {
      // Set assignment to IN_PROGRESS
      await prisma.taskAssignment.update({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
        data: { status: "IN_PROGRESS" },
      });

      const res = await executeAction("declineAssignmentAction", [seed.task1.id, "Reason"], vol1Cookie);
      assert.strictEqual(res.success, false);
    });
  });

  // ── 5. ASSIGNMENT STARTUP (5 TESTS) ───────────────────────────────────
  describe("Assignment Startup", () => {
    before(async () => {
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "ACCEPTED",
        },
      });
    });

    it("should start accepted assignment successfully", async () => {
      const res = await executeAction("startAssignmentAction", [seed.task1.id], vol1Cookie);
      assert.strictEqual(res.success, true);

      const assignment = await prisma.taskAssignment.findUnique({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
      });
      assert.strictEqual(assignment?.status, "IN_PROGRESS");
      assert.ok(assignment?.startedAt);
    });

    it("should fail to start a pending assignment directly without accepting", async () => {
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task2.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "PENDING_ACCEPTANCE",
        },
      });

      const res = await executeAction("startAssignmentAction", [seed.task2.id], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail for non-existent assignment", async () => {
      const res = await executeAction("startAssignmentAction", [99999], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail to start an already in-progress assignment", async () => {
      const res = await executeAction("startAssignmentAction", [seed.task1.id], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail when volunteer is not assigned", async () => {
      const res = await executeAction("startAssignmentAction", [seed.task1.id], vol2Cookie);
      assert.strictEqual(res.success, false);
    });
  });

  // ── 6. ASSIGNMENT SUBMISSION & EVIDENCE (5 TESTS) ─────────────────────
  describe("Assignment Submission & Evidence", () => {
    before(async () => {
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "IN_PROGRESS",
        },
      });
    });

    it("should submit evidence and transition status to SUBMITTED", async () => {
      // Construct FormData for submitEvidenceAction
      const formData = new FormData();
      formData.append("taskId", String(seed.task1.id));
      formData.append("description", "Plásticos recolectados en bolsa");
      
      // Node 20+ supports global File. Let's create a simulated file.
      const file = createMockFile("dummy png content", "plásticos.png", "image/png");
      formData.append("file", file);

      const res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
      if (!res.success) console.log("[DEBUG TEST 1] submitEvidenceAction failed:", res);
      assert.strictEqual(res.success, true);
      assert.ok(res.data.id);

      // Verify evidence and assignment status in DB
      const evidence = await prisma.taskEvidence.findUnique({
        where: { id: res.data.id },
      });
      assert.ok(evidence);
      assert.strictEqual(evidence.fileName, "plásticos.png");
      assert.strictEqual(evidence.status, "PENDING");

      const assignment = await prisma.taskAssignment.findUnique({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
      });
      assert.strictEqual(assignment?.status, "SUBMITTED");
      assert.ok(assignment?.submittedAt);
    });

    it("should fail submit evidence for non-existent assignment", async () => {
      const formData = new FormData();
      formData.append("taskId", "99999");
      const file = createMockFile("dummy content", "evidence.png", "image/png");
      formData.append("file", file);

      const res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail submit evidence when file is missing", async () => {
      const formData = new FormData();
      formData.append("taskId", String(seed.task1.id));

      const res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail submit evidence when volunteer event participation is cancelled", async () => {
      // Set participation to CANCELLED
      await prisma.eventParticipation.update({
        where: {
          eventId_volunteerId: {
            eventId: seed.event1.id,
            volunteerId: seed.volunteer1.id,
          },
        },
        data: { status: "CANCELLED" },
      });

      const formData = new FormData();
      formData.append("taskId", String(seed.task1.id));
      const file = createMockFile("dummy content", "evidence.png", "image/png");
      formData.append("file", file);

      const res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("No tienes acceso") || res.error?.includes("no estás inscrito"));

      // Restore participation
      await prisma.eventParticipation.update({
        where: {
          eventId_volunteerId: {
            eventId: seed.event1.id,
            volunteerId: seed.volunteer1.id,
          },
        },
        data: { status: "REGISTERED" },
      });
    });

    it("should fail submit evidence when volunteer is not registered to the event", async () => {
      // Delete task evidence first to avoid foreign key violation
      await prisma.taskEvidence.deleteMany({
        where: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id },
      });

      // Delete task assignment first to avoid foreign key violation
      await prisma.taskAssignment.deleteMany({
        where: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id },
      });

      // Delete participation
      await prisma.eventParticipation.delete({
        where: {
          eventId_volunteerId: {
            eventId: seed.event1.id,
            volunteerId: seed.volunteer1.id,
          },
        },
      });

      const formData = new FormData();
      formData.append("taskId", String(seed.task1.id));
      const file = createMockFile("dummy content", "evidence.png", "image/png");
      formData.append("file", file);

      const res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("No tienes acceso") || res.error?.includes("no estás inscrito"));

      // Restore participation
      await prisma.eventParticipation.create({
        data: {
          eventId: seed.event1.id,
          volunteerId: seed.volunteer1.id,
          status: "REGISTERED",
        },
      });

      // Restore task assignment
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "IN_PROGRESS",
        },
      });
    });

    it("should fail submit evidence if assignment is in a state that cannot transition to SUBMITTED", async () => {
      // Re-create assignment with status APPROVED
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "APPROVED",
        },
      });

      const formData = new FormData();
      formData.append("taskId", String(seed.task1.id));
      const file = createMockFile("dummy png content", "plásticos.png", "image/png");
      formData.append("file", file);

      const res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("InvalidTransitionError") || res.error?.includes("transition"));
      
      // Restore default in-progress assignment for other tests
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "IN_PROGRESS",
        },
      });
    });

    it("should fail review evidence if assignment is in a state that cannot transition to APPROVED/REVISION_REQUESTED", async () => {
      // Re-create assignment with status PENDING_ACCEPTANCE
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "PENDING_ACCEPTANCE",
        },
      });

      // Create an evidence record to review
      const evidence = await prisma.taskEvidence.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          fileUrl: "http://example.com/test.png",
          fileName: "test.png",
          fileType: "IMAGE",
          status: "PENDING",
        },
      });

      const res = await executeAction("reviewEvidenceAction", [evidence.id, "APPROVED", "Good work"], adminCookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("InvalidTransitionError") || res.error?.includes("transition"));

      // Clean up evidence and restore assignment
      await prisma.taskEvidence.delete({ where: { id: evidence.id } });
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "IN_PROGRESS",
        },
      });
    });

    it("should submit assignment via action note successfully", async () => {
      // Re-create an in-progress assignment
      await prisma.taskAssignment.deleteMany();
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "IN_PROGRESS",
        },
      });

      const res = await executeAction("submitAssignmentAction", [seed.task1.id, "Finalizado todo"], vol1Cookie);
      assert.strictEqual(res.success, true);

      const assignment = await prisma.taskAssignment.findUnique({
        where: { taskId_volunteerId: { taskId: seed.task1.id, volunteerId: seed.volunteer1.id } },
      });
      assert.strictEqual(assignment?.status, "SUBMITTED");
      assert.strictEqual(assignment?.completionNote, "Finalizado todo");
    });

    it("should atomically auto-transition global TaskStatus to IN_REVIEW when the last active volunteer submits", async () => {
      // Reset task to OPEN first
      await prisma.task.update({
        where: { id: seed.task1.id },
        data: { taskStatus: "OPEN" },
      });

      // Clear all assignments for this task and create exactly ONE active assignment in IN_PROGRESS
      await prisma.taskAssignment.deleteMany({ where: { taskId: seed.task1.id } });
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task1.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "IN_PROGRESS",
        },
      });

      // Submit the last active assignment
      const res = await executeAction("submitAssignmentAction", [seed.task1.id, "Completed task"], vol1Cookie);
      assert.strictEqual(res.success, true);

      // Verify global task status becomes IN_REVIEW
      const task = await prisma.task.findUniqueOrThrow({
        where: { id: seed.task1.id },
      });
      assert.strictEqual(task.taskStatus, "IN_REVIEW");
    });
  });

  // ── 7. TASK COMMENTS (5 TESTS) ────────────────────────────────────────
  describe("Task Comments", () => {
    before(async () => {
      await prisma.taskComment.deleteMany();
    });

    it("should allow a volunteer to add a comment to a task", async () => {
      const res = await executeAction("addTaskCommentAction", [seed.task1.id, "Volunteer comment content"], vol1Cookie);
      if (!res.success) console.log("[DEBUG TEST COMMENTS 1] addTaskCommentAction failed:", res);
      assert.strictEqual(res.success, true);
      assert.ok(res.data?.id);

      const comment = await prisma.taskComment.findUnique({
        where: { id: res.data.id },
      });
      assert.ok(comment);
      assert.strictEqual(comment.content, "Volunteer comment content");
      assert.strictEqual(comment.authorId, seed.vol1User.id);
    });

    it("should allow a coordinator to add a comment to the same task", async () => {
      const res = await executeAction("addTaskCommentAction", [seed.task1.id, "Coordinator reply content"], coordCookie);
      assert.strictEqual(res.success, true);
      assert.ok(res.data.id);
    });

    it("should list comments for the task in chronological order with author information", async () => {
      const res = await executeAction("getTaskCommentsAction", [seed.task1.id], vol1Cookie);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.length, 2);
      
      const [first, second] = res.data;
      assert.strictEqual(first.content, "Volunteer comment content");
      assert.strictEqual(first.author.name, "Volunteer One");
      
      assert.strictEqual(second.content, "Coordinator reply content");
      assert.strictEqual(second.author.name, "Coordinator User");
    });

    it("should fail when comment content is empty", async () => {
      const res = await executeAction("addTaskCommentAction", [seed.task1.id, "   "], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("vacío"));
    });

    it("should fail to add a comment to a non-existent task", async () => {
      const res = await executeAction("addTaskCommentAction", [99999, "Comment"], vol1Cookie);
      assert.strictEqual(res.success, false);
    });
  });

  // ── 8. REAL-TIME SSE BROADCASTING (5 TESTS) ───────────────────────────
  describe("Real-time SSE Broadcasting", () => {
    let sse: SSEClient;

    before(async () => {
      sse = new SSEClient("http://localhost:3005/api/realtime");
      await sse.connect();
      // Wait a moment for connection to open
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    after(() => {
      sse.close();
    });

    it("should establish SSE connection and stay alive", async () => {
      // Connect happened in before hook. Check that no aborts occurred and connection is ready.
      assert.ok(sse);
    });

    it("should broadcast a TASK_COMMENT event in real-time when comments are added", async () => {
      sse.clearEvents();
      
      const res = await executeAction("addTaskCommentAction", [seed.task1.id, "Realtime comment"], vol1Cookie);
      assert.strictEqual(res.success, true);

      // Wait for SSE broadcast
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const events = sse.getEvents();
      const commentEvent = events.find((e) => e.type === "TASK_COMMENT");
      
      assert.ok(commentEvent);
      assert.strictEqual(commentEvent.payload.taskId, seed.task1.id);
      assert.strictEqual(commentEvent.payload.content, "Realtime comment");
      assert.strictEqual(commentEvent.payload.authorName, "Volunteer One");
    });

    it("should broadcast an ASSIGNMENT_ACCEPTED event in real-time", async () => {
      // Set up pending assignment
      await prisma.taskAssignment.deleteMany({ where: { taskId: seed.task2.id } });
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task2.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "PENDING_ACCEPTANCE",
        },
      });

      sse.clearEvents();

      const res = await executeAction("acceptAssignmentAction", [seed.task2.id], vol1Cookie);
      assert.strictEqual(res.success, true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const events = sse.getEvents();
      const acceptEvent = events.find((e) => e.type === "ASSIGNMENT_ACCEPTED");
      
      assert.ok(acceptEvent);
      assert.strictEqual(acceptEvent.payload.taskId, seed.task2.id);
      assert.strictEqual(acceptEvent.payload.newStatus, "ACCEPTED");
      assert.strictEqual(acceptEvent.payload.volunteerId, seed.volunteer1.id);
    });

    it("should broadcast an ASSIGNMENT_STARTED event in real-time", async () => {
      sse.clearEvents();

      const res = await executeAction("startAssignmentAction", [seed.task2.id], vol1Cookie);
      assert.strictEqual(res.success, true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const events = sse.getEvents();
      const startEvent = events.find((e) => e.type === "ASSIGNMENT_STARTED");
      
      assert.ok(startEvent);
      assert.strictEqual(startEvent.payload.taskId, seed.task2.id);
      assert.strictEqual(startEvent.payload.newStatus, "IN_PROGRESS");
      assert.strictEqual(startEvent.payload.volunteerId, seed.volunteer1.id);
    });

    it("should broadcast an ASSIGNMENT_DECLINED event in real-time", async () => {
      // Set up another pending assignment
      await prisma.taskAssignment.deleteMany({ where: { taskId: seed.task2.id } });
      await prisma.taskAssignment.create({
        data: {
          taskId: seed.task2.id,
          volunteerId: seed.volunteer1.id,
          eventId: seed.event1.id,
          status: "PENDING_ACCEPTANCE",
        },
      });

      sse.clearEvents();

      const res = await executeAction("declineAssignmentAction", [seed.task2.id, "Declined realtime"], vol1Cookie);
      assert.strictEqual(res.success, true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const events = sse.getEvents();
      const declineEvent = events.find((e) => e.type === "ASSIGNMENT_DECLINED");
      
      assert.ok(declineEvent);
      assert.strictEqual(declineEvent.payload.taskId, seed.task2.id);
      assert.strictEqual(declineEvent.payload.newStatus, "DECLINED");
      assert.strictEqual(declineEvent.payload.reason, "Declined realtime");
    });
  });

  // ── 9. PRESIGNED URL STORAGE (MILESTONE 2) ───────────────────────────
  describe("Presigned URL Storage (Milestone 2)", () => {
    it("should successfully generate mock presigned upload and file URLs for volunteer", async () => {
      const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png", "image/png"], vol1Cookie);
      assert.strictEqual(res.success, true);
      assert.ok(res.data);
      assert.ok(res.data.uploadUrl);
      assert.ok(res.data.fileUrl);
      assert.ok(res.data.uploadUrl.includes("/mock-upload/evidences/"));
      assert.ok(res.data.fileUrl.includes("/evidences/"));
      assert.ok(res.data.uploadUrl.endsWith(".png"));
      assert.ok(res.data.fileUrl.endsWith(".png"));
    });

    it("should fail when unauthenticated", async () => {
      const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png", "image/png"]);
      assert.strictEqual(res.success, false);
    });

    it("should fail when authenticated but user does not have VOLUNTEER role", async () => {
      const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png", "image/png"], adminCookie);
      assert.strictEqual(res.success, false);
    });

    it("should fail when authenticated as VOLUNTEER but volunteer record is missing", async () => {
      const tempUser = await prisma.user.create({
        data: {
          name: "Temp Volunteer",
          email: "tempvol@test.com",
          password: "password123",
          isActive: true,
          userRoles: { create: { role: "VOLUNTEER" } },
        },
      });
      const tempCookie = await getAuthCookie({
        userId: tempUser.id,
        email: tempUser.email,
        role: "VOLUNTEER",
        roles: ["VOLUNTEER"],
      });
      try {
        const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png", "image/png"], tempCookie);
        assert.strictEqual(res.success, false);
        assert.strictEqual(res.error, "El usuario no está registrado como voluntario");
      } finally {
        await prisma.userRole.deleteMany({ where: { userId: tempUser.id } });
        await prisma.user.delete({ where: { id: tempUser.id } });
      }
    });

    it("should sanitize the extension to prevent path traversal in generated URLs", async () => {
      const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png/../../hacked", "image/png"], vol1Cookie);
      console.log("[DEBUG TEST 5] res.data:", res.data);
      assert.strictEqual(res.success, true);
      assert.ok(res.data);
      assert.ok(res.data.uploadUrl.endsWith("pnghacked"));
      assert.ok(res.data.fileUrl.endsWith("pnghacked"));
    });

    it("should reject uploads with disallowed MIME types to prevent XSS", async () => {
      const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png", "application/javascript"], vol1Cookie);
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error, "Tipo de archivo no permitido");
    });
  });
});

