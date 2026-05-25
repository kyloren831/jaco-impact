"use server";

import { requireRole, requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserService } from "@/lib/services/user.service";

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
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Luego insertamos los nuevos
    if (newRoles.length > 0) {
      await prisma.userRole.createMany({
        data: newRoles.map((r) => ({
          userId,
          role: r as any, // as Role enum
        })),
      });
    }

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

    await prisma.user.create({
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
    const userService = new UserService();
    const user = await userService.getCurrentUser(session.userId);
    return { success: true as const, data: user };
  } catch (error) {
    return { success: false as const, error: "No autenticado" };
  }
}
