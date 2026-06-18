import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { prisma } from "../../../lib/prisma";
import { resetAndSeed } from "../helpers/db";
import { getAuthCookie } from "../helpers/auth";
import { executeAction } from "../helpers/actions";
import { SSEClient } from "../helpers/sse";
import bcrypt from "bcryptjs";

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

describe("Tier 4 E2E Test Suite - Real-World Application Workloads", () => {
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

  it("1. Beach Clean-up Campaign Workflow Scenario", async () => {
    // 1. Setup a complex Beach Clean-up Event
    const campaignEvent = await prisma.event.create({
      data: {
        projectId: seed.project.id,
        createdBy: seed.coordUser.id,
        name: "Jaco Beach Cleanup Campaign 2026",
        eventDate: new Date(),
        visibility: "PUBLIC",
        status: "OPEN",
      },
    });

    // Register Volunteer 1 and 2 to this new event
    await prisma.eventParticipation.createMany({
      data: [
        { eventId: campaignEvent.id, volunteerId: seed.volunteer1.id, status: "REGISTERED" },
        { eventId: campaignEvent.id, volunteerId: seed.volunteer2.id, status: "REGISTERED" },
      ],
    });

    // Create 3 Tasks:
    // Task A: Trash Bag Distribution
    // Task B: Plastic Collection
    // Task C: Sorting & Counting
    const taskA = await prisma.task.create({
      data: { eventId: campaignEvent.id, createdBy: seed.coordUser.id, title: "Trash Bag Distribution", priority: "HIGH", taskStatus: "OPEN" },
    });
    const taskB = await prisma.task.create({
      data: { eventId: campaignEvent.id, createdBy: seed.coordUser.id, title: "Plastic Collection", priority: "HIGH", taskStatus: "OPEN" },
    });
    const taskC = await prisma.task.create({
      data: { eventId: campaignEvent.id, createdBy: seed.coordUser.id, title: "Sorting & Counting", priority: "MEDIUM", taskStatus: "OPEN" },
    });

    // 2. Assign volunteers:
    // Volunteer 1 -> Task A & B
    // Volunteer 2 -> Task B & C
    await executeAction("assignVolunteerAction", [taskA.id, seed.volunteer1.id], coordCookie);
    await executeAction("assignVolunteerAction", [taskB.id, seed.volunteer1.id], coordCookie);
    await executeAction("assignVolunteerAction", [taskB.id, seed.volunteer2.id], coordCookie);
    await executeAction("assignVolunteerAction", [taskC.id, seed.volunteer2.id], coordCookie);

    // 3. Both accept their tasks
    await executeAction("acceptAssignmentAction", [taskA.id], vol1Cookie);
    await executeAction("acceptAssignmentAction", [taskB.id], vol1Cookie);
    await executeAction("acceptAssignmentAction", [taskB.id], vol2Cookie);
    await executeAction("acceptAssignmentAction", [taskC.id], vol2Cookie);

    // 4. Vol 1 starts and submits Task A (Trash Bag Distribution)
    await executeAction("startAssignmentAction", [taskA.id], vol1Cookie);
    let formData = new FormData();
    formData.append("taskId", String(taskA.id));
    formData.append("file", createMockFile("distribution logs", "log.txt", "text/plain"));
    const subARes = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    assert.strictEqual(subARes.success, true);

    // Verify Task A transitioned to IN_REVIEW because its only active assignment (Vol 1) is submitted
    const freshTaskA = await prisma.task.findUniqueOrThrow({ where: { id: taskA.id } });
    assert.strictEqual(freshTaskA.taskStatus, "IN_REVIEW");

    // 5. Both Vol 1 and Vol 2 work on Task B (Plastic Collection)
    await executeAction("startAssignmentAction", [taskB.id], vol1Cookie);
    await executeAction("startAssignmentAction", [taskB.id], vol2Cookie);

    // Vol 1 submits Task B evidence
    formData = new FormData();
    formData.append("taskId", String(taskB.id));
    formData.append("file", createMockFile("v1 plastic collection", "v1.png", "image/png"));
    await executeAction("submitEvidenceAction", [formData], vol1Cookie);

    // Task B status should still be IN_PROGRESS (since Volunteer 2 is still working)
    let freshTaskB = await prisma.task.findUniqueOrThrow({ where: { id: taskB.id } });
    assert.strictEqual(freshTaskB.taskStatus, "IN_PROGRESS");

    // Vol 2 submits Task B evidence
    formData = new FormData();
    formData.append("taskId", String(taskB.id));
    formData.append("file", createMockFile("v2 plastic collection", "v2.png", "image/png"));
    await executeAction("submitEvidenceAction", [formData], vol2Cookie);

    // Now Task B status should transition to IN_REVIEW (since both active volunteers submitted)
    freshTaskB = await prisma.task.findUniqueOrThrow({ where: { id: taskB.id } });
    assert.strictEqual(freshTaskB.taskStatus, "IN_REVIEW");

    // 6. Coordinator approves Task A and Task B evidence
    await executeAction("reviewEvidenceAction", [subARes.data.id, "APPROVED", "Great distribution logs"], coordCookie);

    const evB1 = await prisma.taskEvidence.findFirstOrThrow({ where: { taskId: taskB.id, volunteerId: seed.volunteer1.id } });
    const evB2 = await prisma.taskEvidence.findFirstOrThrow({ where: { taskId: taskB.id, volunteerId: seed.volunteer2.id } });
    await executeAction("reviewEvidenceAction", [evB1.id, "APPROVED", "Good volume Vol 1"], coordCookie);
    await executeAction("reviewEvidenceAction", [evB2.id, "APPROVED", "Good volume Vol 2"], coordCookie);

    // Verify assignments are APPROVED
    const asgA = await prisma.taskAssignment.findUniqueOrThrow({ where: { taskId_volunteerId: { taskId: taskA.id, volunteerId: seed.volunteer1.id } } });
    const asgB1 = await prisma.taskAssignment.findUniqueOrThrow({ where: { taskId_volunteerId: { taskId: taskB.id, volunteerId: seed.volunteer1.id } } });
    const asgB2 = await prisma.taskAssignment.findUniqueOrThrow({ where: { taskId_volunteerId: { taskId: taskB.id, volunteerId: seed.volunteer2.id } } });

    assert.strictEqual(asgA.status, "APPROVED");
    assert.strictEqual(asgB1.status, "APPROVED");
    assert.strictEqual(asgB2.status, "APPROVED");
  });

  it("2. Real-time Event Coordination Thread Workload Scenario", async () => {
    // Setup a task for coordination
    const threadTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Real-time Communication Thread Task",
        priority: "MEDIUM",
        taskStatus: "OPEN",
      },
    });

    // Establish SSE client to listen to thread comments
    const sse = new SSEClient("http://localhost:3005/api/realtime");
    await sse.connect();
    await new Promise((resolve) => setTimeout(resolve, 200));

    sse.clearEvents();

    // Volunteers and coordinator concurrently add comments
    const c1 = await executeAction("addTaskCommentAction", [threadTask.id, "Volunteer 1: I arrived at the sector."], vol1Cookie);
    const c2 = await executeAction("addTaskCommentAction", [threadTask.id, "Volunteer 2: Me too, starting now."], vol2Cookie);
    const c3 = await executeAction("addTaskCommentAction", [threadTask.id, "Coordinator: Excellent, please check the map."], coordCookie);

    assert.strictEqual(c1.success, true);
    assert.strictEqual(c2.success, true);
    assert.strictEqual(c3.success, true);

    // Wait for SSE broadcasts
    await new Promise((resolve) => setTimeout(resolve, 400));

    const events = sse.getEvents();
    const commentEvents = events.filter((e) => e.type === "TASK_COMMENT" && e.payload.taskId === threadTask.id);

    // Verify we received exactly 3 comment broadcasts
    assert.strictEqual(commentEvents.length, 3);
    assert.strictEqual(commentEvents[0].payload.content, "Volunteer 1: I arrived at the sector.");
    assert.strictEqual(commentEvents[1].payload.content, "Volunteer 2: Me too, starting now.");
    assert.strictEqual(commentEvents[2].payload.content, "Coordinator: Excellent, please check the map.");

    // Retrieve comments via action in chronological order
    const listRes = await executeAction("getTaskCommentsAction", [threadTask.id], vol1Cookie);
    assert.strictEqual(listRes.success, true);
    assert.strictEqual(listRes.data.length, 3);
    assert.strictEqual(listRes.data[0].content, "Volunteer 1: I arrived at the sector.");
    assert.strictEqual(listRes.data[1].content, "Volunteer 2: Me too, starting now.");
    assert.strictEqual(listRes.data[2].content, "Coordinator: Excellent, please check the map.");

    sse.close();
  });

  it("3. Rejection/Revision Cycle Workload Scenario", async () => {
    const cycleTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Workload Revision Cycle Task",
        priority: "MEDIUM",
        taskStatus: "OPEN",
      },
    });

    await executeAction("assignVolunteerAction", [cycleTask.id, seed.volunteer1.id], coordCookie);
    await executeAction("acceptAssignmentAction", [cycleTask.id], vol1Cookie);
    await executeAction("startAssignmentAction", [cycleTask.id], vol1Cookie);

    // 1. Submit evidence V1
    let formData = new FormData();
    formData.append("taskId", String(cycleTask.id));
    formData.append("file", createMockFile("V1 data", "v1.png", "image/png"));
    formData.append("description", "V1 submission");
    let res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    const evId1 = res.data.id;

    // 2. Coordinator rejects and requests revision
    await executeAction("reviewEvidenceAction", [evId1, "REJECTED", "V1 rejected: blurry photo"], coordCookie);

    // 3. Volunteer posts comment explaining the issue and restarts task
    await executeAction("addTaskCommentAction", [cycleTask.id, "Sorry about that, my camera lens was dirty. Retaking."], vol1Cookie);
    await executeAction("startAssignmentAction", [cycleTask.id], vol1Cookie);

    // 4. Submit evidence V2
    formData = new FormData();
    formData.append("taskId", String(cycleTask.id));
    formData.append("file", createMockFile("V2 data", "v2.png", "image/png"));
    formData.append("description", "V2 submission");
    res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    const evId2 = res.data.id;

    // 5. Coordinator rejects and requests revision again
    await executeAction("reviewEvidenceAction", [evId2, "REJECTED", "V2 rejected: still missing details"], coordCookie);

    // 6. Volunteer restarts and submits V3
    await executeAction("startAssignmentAction", [cycleTask.id], vol1Cookie);
    formData = new FormData();
    formData.append("taskId", String(cycleTask.id));
    formData.append("file", createMockFile("V3 data", "v3.png", "image/png"));
    formData.append("description", "V3 submission - final");
    res = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    const evId3 = res.data.id;

    // 7. Coordinator approves
    await executeAction("reviewEvidenceAction", [evId3, "APPROVED", "Looks great, approved!"], coordCookie);

    // Verify final assignment and evidence status
    const asg = await prisma.taskAssignment.findUniqueOrThrow({
      where: { taskId_volunteerId: { taskId: cycleTask.id, volunteerId: seed.volunteer1.id } },
    });
    assert.strictEqual(asg.status, "APPROVED");

    const evs = await prisma.taskEvidence.findMany({
      where: { taskId: cycleTask.id, volunteerId: seed.volunteer1.id },
      orderBy: { uploadedAt: "asc" },
    });

    assert.strictEqual(evs.length, 3);
    assert.strictEqual(evs[0].status, "REJECTED");
    assert.strictEqual(evs[1].status, "REJECTED");
    assert.strictEqual(evs[2].status, "APPROVED");
  });

  it("4. Multi-volunteer Task Scaling Workload Scenario", async () => {
    // We scale by assigning a task to 5 volunteers.
    // Let's create 3 additional volunteers dynamically so we have 5 total.
    const hashedPassword = bcrypt.hashSync("password123", 10);
    const volUsers: any[] = [];
    const volunteers: any[] = [];
    const volCookies: string[] = [];

    // Volunteer 1 and 2 are already in seed. Let's create 3 more.
    volUsers.push(seed.vol1User, seed.vol2User);
    volunteers.push(seed.volunteer1, seed.volunteer2);
    volCookies.push(vol1Cookie, vol2Cookie);

    for (let i = 3; i <= 5; i++) {
      const u = await prisma.user.create({
        data: {
          name: `Volunteer ${i}`,
          email: `volunteer${i}@test.com`,
          password: hashedPassword,
          isActive: true,
          userRoles: { create: { role: "VOLUNTEER" } },
        },
      });
      const v = await prisma.volunteer.create({
        data: {
          userId: u.id,
          phone: `1111111${i}`,
          nationality: "Costa Rica",
          profession: "Volunteer",
          emergencyContactName: "Emergency",
          emergencyContactPhone: "88888888",
          inmediateAvailability: true,
        },
      });
      const cookie = await getAuthCookie({
        userId: u.id,
        email: u.email,
        role: "VOLUNTEER",
        roles: ["VOLUNTEER"],
      });

      volUsers.push(u);
      volunteers.push(v);
      volCookies.push(cookie);
    }

    // Create a single scale task
    const scaleTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Scale Task 5 Volunteers",
        priority: "HIGH",
        taskStatus: "OPEN",
      },
    });

    // Register all 5 volunteers to event 1 (1 and 2 are already registered)
    for (let i = 2; i < 5; i++) {
      const isReg = await prisma.eventParticipation.findUnique({
        where: { eventId_volunteerId: { eventId: seed.event1.id, volunteerId: volunteers[i].id } },
      });
      if (!isReg) {
        await prisma.eventParticipation.create({
          data: { eventId: seed.event1.id, volunteerId: volunteers[i].id, status: "REGISTERED" },
        });
      }
    }

    // Assign all 5 volunteers to scaleTask
    for (const v of volunteers) {
      await executeAction("assignVolunteerAction", [scaleTask.id, v.id], coordCookie);
    }

    // Step A: 3 volunteers (1, 2, 3) accept, start and submit
    for (let idx = 0; idx < 3; idx++) {
      await executeAction("acceptAssignmentAction", [scaleTask.id], volCookies[idx]);
      await executeAction("startAssignmentAction", [scaleTask.id], volCookies[idx]);

      const formData = new FormData();
      formData.append("taskId", String(scaleTask.id));
      formData.append("file", createMockFile(`evidence vol ${idx + 1}`, `v${idx + 1}.png`, "image/png"));
      await executeAction("submitEvidenceAction", [formData], volCookies[idx]);
    }

    // Step B: 1 volunteer (4) declines
    await executeAction("declineAssignmentAction", [scaleTask.id, "No availability"], volCookies[3]);

    // Step C: 1 volunteer (5) accepts but does not start or submit yet
    await executeAction("acceptAssignmentAction", [scaleTask.id], volCookies[4]);

    // Verify task status is IN_PROGRESS (not IN_REVIEW because volunteer 5 is still active in ACCEPTED state)
    let freshTask = await prisma.task.findUniqueOrThrow({ where: { id: scaleTask.id } });
    assert.strictEqual(freshTask.taskStatus, "IN_PROGRESS");

    // Step D: Volunteer 5 starts and submits
    await executeAction("startAssignmentAction", [scaleTask.id], volCookies[4]);
    const formData5 = new FormData();
    formData5.append("taskId", String(scaleTask.id));
    formData5.append("file", createMockFile("evidence vol 5", "v5.png", "image/png"));
    await executeAction("submitEvidenceAction", [formData5], volCookies[4]);

    // Verify task status now automatically transitions to IN_REVIEW
    freshTask = await prisma.task.findUniqueOrThrow({ where: { id: scaleTask.id } });
    assert.strictEqual(freshTask.taskStatus, "IN_REVIEW");
  });

  it("5. Admin Auditing of Logs and Activities Workload Scenario", async () => {
    // 1. Create a specific task to generate audit trail
    const auditTask = await prisma.task.create({
      data: {
        eventId: seed.event1.id,
        createdBy: seed.coordUser.id,
        title: "Audit Logging Test Task",
        priority: "LOW",
        taskStatus: "OPEN",
      },
    });

    // Register, assign, accept, start, submit evidence, comment, approve
    await executeAction("assignVolunteerAction", [auditTask.id, seed.volunteer1.id], coordCookie);
    await executeAction("acceptAssignmentAction", [auditTask.id], vol1Cookie);
    await executeAction("startAssignmentAction", [auditTask.id], vol1Cookie);

    const formData = new FormData();
    formData.append("taskId", String(auditTask.id));
    formData.append("file", createMockFile("audit evidence", "audit.png", "image/png"));
    const subRes = await executeAction("submitEvidenceAction", [formData], vol1Cookie);
    const evId = subRes.data.id;

    await executeAction("addTaskCommentAction", [auditTask.id, "Audit log comment"], vol1Cookie);
    await executeAction("reviewEvidenceAction", [evId, "APPROVED", "Audit approve"], coordCookie);

    // 2. Fetch activity logs via action
    const logsRes = await executeAction("getActivityLogs", [{ limit: 20, eventId: seed.event1.id }], adminCookie);
    assert.strictEqual(logsRes.success, true);
    
    // Search the logs for our auditTask actions
    const logs = logsRes.data.filter((l: any) => l.entityId === auditTask.id || l.entityId === evId);

    // We should have logs for:
    // ASSIGNED (Task)
    // ACCEPTED (Assignment)
    // UPDATED (Assignment started)
    // SUBMITTED (Assignment/Evidence)
    // CREATED (Comment)
    // REVIEWED (Evidence/Assignment)
    assert.ok(logs.length >= 5, `Should have recorded several logs, found: ${logs.length}`);

    // Verify actor name exists
    for (const log of logs) {
      assert.ok(log.actor.name);
      assert.strictEqual(log.actorType, "USER");
    }
  });
});
