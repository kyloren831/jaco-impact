"use server";

import { requireRole, requireAuth } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/storage/r2";
import { PillarDomainService } from "@/domain/pillars/service";
import { PillarPrismaRepository } from "@/infrastructure/prisma/repositories/pillar.prisma-repository";

const pillarDomainService = new PillarDomainService(new PillarPrismaRepository());
import { DomainError } from "@/domain/shared/domain-error";

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

  try {
    const iconUrl = await uploadFileToR2(file, "pillars");

    await pillarDomainService.createPillar({
      coordinatorId,
      name,
      description,
      iconUrl,
      color,
      isActive,
    });

    revalidatePath("/dashboard/admin/pillars");
    return { success: true };
  } catch (error) {
    console.error("Error creating pillar:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo crear el pilar." };
  }
}

export async function getPillars() {
  await requireAuth();
  return pillarDomainService.getAllPillars();
}

export async function updatePillar(id: number, formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const coordinatorId = Number(formData.get("coordinatorId"));
  const file = formData.get("icon") as File | null;

  try {
    let iconUrl: string | undefined = undefined;
    if (file && file.size > 0) {
      iconUrl = await uploadFileToR2(file, "pillars");
    }

    await pillarDomainService.updatePillar(id, {
      name: name || undefined,
      description: description || undefined,
      color: color || undefined,
      coordinatorId: coordinatorId || undefined,
      iconUrl,
    });

    revalidatePath("/dashboard/admin/pillars");
    return { success: true };
  } catch (error) {
    console.error("Error updating pillar:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo actualizar el pilar." };
  }
}

export async function deletePillar(id: number) {
  await requireRole("ADMIN");

  try {
    await pillarDomainService.deletePillar(id);
    revalidatePath("/dashboard/admin/pillars");
    return { success: true };
  } catch (error) {
    console.error("Error deleting pillar:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo eliminar el pilar. Asegúrate de que no tenga proyectos asociados." };
  }
}
