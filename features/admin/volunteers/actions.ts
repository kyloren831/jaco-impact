"use server";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getVolunteersListAction() {
  try {
    await requireRole(["ADMIN", "COORDINATOR"]);
    const volunteers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: { role: "VOLUNTEER" }
        }
      },
      include: {
        volunteers: {
          include: {
            skills: true,
            availability: true
          }
        }
      },
      orderBy: { name: "asc" }
    });
    return { success: true, data: volunteers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVolunteerDetailAction(userId: number) {
  try {
    await requireRole(["ADMIN", "COORDINATOR"]);
    const volunteerUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        volunteers: {
          include: {
            skills: true,
            availability: {
              orderBy: { startDate: "asc" }
            },
            participations: {
              include: { event: true },
              orderBy: { registeredAt: "desc" }
            },
            assignments: {
              include: { task: true },
              orderBy: { assignedAt: "desc" }
            }
          }
        }
      }
    });
    return { success: true, data: volunteerUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleVolunteerStatusAction(userId: number, isActive: boolean) {
  try {
    await requireRole(["ADMIN", "COORDINATOR"]);
    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });
    revalidatePath("/dashboard/admin/volunteers");
    revalidatePath(`/dashboard/admin/volunteers/${userId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
