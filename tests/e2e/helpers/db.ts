import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function resetAndSeed() {
  console.log("Resetting database...");
  
  // 1. Delete all existing records in reverse dependency order
  await prisma.taskComment.deleteMany();
  await prisma.taskEvidence.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.eventParticipation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.projectReview.deleteMany();
  await prisma.project.deleteMany();
  await prisma.pillar.deleteMany();
  await prisma.volunteerSkill.deleteMany();
  await prisma.volunteerAvailability.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.userRole.deleteMany();
  if ((prisma as any).notification) {
    await (prisma as any).notification.deleteMany();
  }
  await prisma.user.deleteMany();

  console.log("Seeding database...");
  
  const hashedPassword = bcrypt.hashSync("password123", 10);

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      isActive: true,
      userRoles: {
        create: { role: "ADMIN" }
      }
    }
  });

  const coordUser = await prisma.user.create({
    data: {
      name: "Coordinator User",
      email: "coordinator@test.com",
      password: hashedPassword,
      isActive: true,
      userRoles: {
        create: { role: "COORDINATOR" }
      }
    }
  });

  const vol1User = await prisma.user.create({
    data: {
      name: "Volunteer One",
      email: "volunteer1@test.com",
      password: hashedPassword,
      isActive: true,
      userRoles: {
        create: { role: "VOLUNTEER" }
      }
    }
  });

  const vol2User = await prisma.user.create({
    data: {
      name: "Volunteer Two",
      email: "volunteer2@test.com",
      password: hashedPassword,
      isActive: true,
      userRoles: {
        create: { role: "VOLUNTEER" }
      }
    }
  });

  // 3. Create Volunteers
  const volunteer1 = await prisma.volunteer.create({
    data: {
      userId: vol1User.id,
      phone: "12345678",
      nationality: "Costa Rica",
      profession: "Developer",
      emergencyContactName: "Emergency 1",
      emergencyContactPhone: "87654321",
      inmediateAvailability: true,
    }
  });

  const volunteer2 = await prisma.volunteer.create({
    data: {
      userId: vol2User.id,
      phone: "87654321",
      nationality: "Costa Rica",
      profession: "Designer",
      emergencyContactName: "Emergency 2",
      emergencyContactPhone: "12345678",
      inmediateAvailability: true,
    }
  });

  // 4. Create Pillar
  const pillar = await prisma.pillar.create({
    data: {
      name: "Ambiental",
      description: "Pilar de medio ambiente",
      color: "#00ff00",
      iconUrl: "/icons/env.svg",
      coordinatorId: coordUser.id,
      isActive: true
    }
  });

  // 5. Create Project
  const project = await prisma.project.create({
    data: {
      pillarId: pillar.id,
      createdBy: coordUser.id,
      name: "Limpieza de Playa Jacó",
      description: "Proyecto para limpiar la playa de Jacó",
      status: "PUBLISHED",
      visibility: "PUBLIC",
    }
  });

  // 6. Create Events
  const event1 = await prisma.event.create({
    data: {
      projectId: project.id,
      createdBy: coordUser.id,
      name: "Gran Limpieza Sector Sur",
      description: "Evento principal de limpieza",
      eventDate: new Date(Date.now() + 86400000), // tomorrow
      status: "OPEN",
      visibility: "PUBLIC",
      volunteersNeeded: 10,
    }
  });

  const event2 = await prisma.event.create({
    data: {
      projectId: project.id,
      createdBy: coordUser.id,
      name: "Clasificación de Residuos",
      description: "Clasificar lo recolectado",
      eventDate: new Date(Date.now() + 172800000), // in 2 days
      status: "OPEN",
      visibility: "PUBLIC",
      volunteersNeeded: 5,
    }
  });

  // 7. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      eventId: event1.id,
      createdBy: coordUser.id,
      title: "Recolección de plásticos",
      description: "Recolectar botellas de plástico en la playa",
      priority: "HIGH",
      taskStatus: "OPEN",
    }
  });

  const task2 = await prisma.task.create({
    data: {
      eventId: event1.id,
      createdBy: coordUser.id,
      title: "Recolección de vidrios",
      description: "Recolectar botellas de vidrio en la playa",
      priority: "MEDIUM",
      taskStatus: "OPEN",
    }
  });

  console.log("Database seeded successfully.");
  return {
    adminUser,
    coordUser,
    vol1User,
    vol2User,
    volunteer1,
    volunteer2,
    pillar,
    project,
    event1,
    event2,
    task1,
    task2,
  };
}
