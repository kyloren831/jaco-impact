"use server";

import { requireRole, requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { uploadFileToR2 } from "@/lib/storage/r2";

export async function createPillar(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const coordinatorId = Number(formData.get("coordinatorId"));
  const isActive = formData.get("isActive") !== "false";
  const file = formData.get("icon") as File | null;

  if (!name || !description || !color || !coordinatorId || !file) {
    return { success: false, error: "Faltan datos obligatorios." };
  }

  const coordinator = await prisma.user.findUnique({
    where: { id: coordinatorId },
  });

  if (!coordinator) {
    return { success: false, error: "El coordinador asignado no existe." };
  }

  const existingPillar = await prisma.pillar.findUnique({
    where: { coordinatorId: coordinatorId },
  });

  if (existingPillar) {
    return { success: false, error: "Este coordinador ya está asignado a otro pilar." };
  }

  try {
    const iconUrl = await uploadFileToR2(file, "pillars");

    await prisma.pillar.create({
      data: {
        coordinatorId,
        name,
        description,
        iconUrl,
        color,
        isActive,
      },
    });

    revalidatePath("/dashboard/admin/pillars");
    return { success: true };
  } catch (error) {
    console.error("Error creating pillar:", error);
    return { success: false, error: "No se pudo crear el pilar." };
  }
}

export async function getPillars() {
  // Pillares podrían ser públicos o requerir autenticación
  // Permitimos a cualquier usuario autenticado verlos para selectores (Admins y Coordinators)
  await requireAuth();

  const pillars = await prisma.pillar.findMany({
    orderBy: { id: "asc" },
    include: {
      coordinator: {
        select: { name: true, email: true }
      }
    }
  });

  return pillars;
}

export async function updatePillar(id: number, formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const coordinatorId = Number(formData.get("coordinatorId"));
  const file = formData.get("icon") as File | null;

  try {
    const existing = await prisma.pillar.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Pilar no encontrado." };

    if (coordinatorId && coordinatorId !== existing.coordinatorId) {
      const coordinator = await prisma.user.findUnique({ where: { id: coordinatorId } });
      if (!coordinator) return { success: false, error: "El coordinador asignado no existe." };

      const conflicting = await prisma.pillar.findUnique({ where: { coordinatorId } });
      if (conflicting) return { success: false, error: "Este coordinador ya está asignado a otro pilar." };
    }

    let iconUrl = existing.iconUrl;
    if (file && file.size > 0) {
      iconUrl = await uploadFileToR2(file, "pillars");
    }

    await prisma.pillar.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        color: color || undefined,
        coordinatorId: coordinatorId || undefined,
        iconUrl,
      },
    });

    revalidatePath("/dashboard/admin/pillars");
    return { success: true };
  } catch (error) {
    console.error("Error updating pillar:", error);
    return { success: false, error: "No se pudo actualizar el pilar." };
  }
}

export async function deletePillar(id: number) {
  await requireRole("ADMIN");

  try {
    await prisma.pillar.delete({ where: { id } });
    revalidatePath("/dashboard/admin/pillars");
    return { success: true };
  } catch (error) {
    console.error("Error deleting pillar:", error);
    return { success: false, error: "No se pudo eliminar el pilar. Asegúrate de que no tenga proyectos asociados." };
  }
}
