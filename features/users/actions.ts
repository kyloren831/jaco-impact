"use server";

import { requireRole, requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";


export async function getUsers() {
  await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      userRoles: {
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  await requireRole("ADMIN");

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    
    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user status:", error);
    return { success: false, error: "No se pudo actualizar el estado del usuario." };
  }
}

export async function updateUserRoles(userId: number, newRoles: string[]) {
  await requireRole("ADMIN");

  try {
    // Para Prisma, si newRoles es un array de strings (Role enums)
    // Primero, borramos los roles anteriores
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Luego insertamos los nuevos
      if (newRoles.length > 0) {
        await tx.userRole.createMany({
          data: newRoles.map((r) => ({
            userId,
            role: r as any, // as Role enum
          })),
        });
      }
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user roles:", error);
    return { success: false, error: "No se pudieron actualizar los roles del usuario." };
  }
}

import bcrypt from "bcryptjs";

export async function createUser(data: { name: string; email: string; password?: string; role: string }) {
  await requireRole("ADMIN");

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "El correo ya está registrado." };

    const hashedPassword = await bcrypt.hash(data.password || "JacoImpact2026!", 10);

    const created = await prisma.$transaction(async (tx) => {
      return await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          isActive: true,
          userRoles: {
            create: {
              role: data.role as any,
            },
          },
        },
      });
    });

    const { domainEventBus } = await import('@/domain/shared/domain-event-bus');
    const { DOMAIN_EVENTS } = await import('@/domain/shared/events');
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.USER_REGISTERED,
      payload: {
        userId: created.id,
        email: created.email,
        name: created.name,
        role: data.role
      },
      metadata: { timestamp: new Date(), actorId: created.id, correlationId: `register-admin-${created.id}` }
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "No se pudo crear el usuario." };
  }
}

export async function getCurrentUserAction() {
  try {
    const session = await requireAuth();
    const { UserDomainService } = await import("@/domain/users/service");
    const { UserPrismaRepository } = await import("@/infrastructure/prisma/repositories/user.prisma-repository");
    const userDomainService = new UserDomainService(new UserPrismaRepository());
    const user = await userDomainService.getCurrentUser(session.userId);
    return { success: true as const, data: user };
  } catch (error) {
    return { success: false as const, error: "No autenticado" };
  }
}

export async function getVolunteerDashboardDataAction() {
  try {
    const session = await requireAuth();
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId }
    });

    if (!volunteer) {
      return { success: false as const, error: "No eres un voluntario registrado", needsProfile: true };
    }

    const tasks = await prisma.taskAssignment.findMany({
      where: { volunteerId: volunteer.id },
      include: {
        task: {
          include: { event: true }
        }
      },
      orderBy: { assignedAt: "desc" }
    });

    const participations = await prisma.eventParticipation.findMany({
      where: { volunteerId: volunteer.id },
      include: {
        event: true
      },
      orderBy: { registeredAt: "desc" }
    });

    return { success: true as const, data: { tasks, participations } };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}
