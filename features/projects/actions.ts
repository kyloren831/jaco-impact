"use server";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/storage/r2";

export async function createProject(formData: FormData) {
  const session = await requireAuth();
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");
  const isCoordinator = roles.includes("COORDINATOR");

  if (!isAdmin && !isCoordinator) {
    return { success: false, error: "No tienes permisos para crear proyectos." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const objectives = formData.get("objectives") as string;
  const pillarId = Number(formData.get("pillarId"));
  const status = formData.get("status") as any;
  const visibility = formData.get("visibility") as any;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!name || !description || !pillarId || !status || !visibility) {
    return { success: false, error: "Faltan datos obligatorios." };
  }

  // Si no es ADMIN, validamos que el pilar le pertenezca al Coordinador
  if (!isAdmin) {
    const pillar = await prisma.pillar.findUnique({ where: { id: pillarId } });
    if (!pillar) return { success: false, error: "El pilar no existe." };
    if (pillar.coordinatorId !== session.userId) {
      return { success: false, error: "Solo puedes crear proyectos en el pilar que coordinas." };
    }
  }

  try {
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;
    let publishedAt = null;
    
    if (status === "PUBLISHED" || status === "IN_PROGRESS") {
      publishedAt = new Date();
    }

    // Upload photo to R2 if provided
    let photoUrl: string | null = null;
    const photoFile = formData.get("photoUrl") as File | null;
    if (photoFile && photoFile.size > 0) {
      photoUrl = await uploadFileToR2(photoFile, "projects");
    }

    await prisma.project.create({
      data: {
        createdBY: session.userId,
        pillarId,
        name,
        description,
        objectives,
        status,
        visibility,
        startDate,
        endDate,
        publishedAt,
        photoUrl,
      },
    });

    revalidatePath("/dashboard/admin/projects");
    return { success: true };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "No se pudo crear el proyecto." };
  }
}

export async function getProjects() {
  const session = await requireAuth();
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");

  // Admins ven todos, Coordinadores ven solo los suyos o los de su pilar
  let whereClause = {};
  if (!isAdmin) {
    whereClause = { pillar: { coordinatorId: session.userId } };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      pillar: {
        select: { name: true, color: true, iconUrl: true }
      },
      creator: {
        select: { name: true }
      }
    }
  });

  return projects;
}

export async function getProjectById(id: number) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, status: true },
  });
  return project;
}

export async function updateProject(id: number, formData: FormData) {
  const session = await requireAuth();
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");
  const isCoordinator = roles.includes("COORDINATOR");

  if (!isAdmin && !isCoordinator) {
    return { success: false, error: "No tienes permisos para editar." };
  }

  try {
    const existing = await prisma.project.findUnique({ 
      where: { id },
      include: { pillar: true }
    });

    if (!existing) return { success: false, error: "Proyecto no encontrado." };

    // Si no es ADMIN, validamos que el proyecto pertenezca al pilar del coordinador
    if (!isAdmin) {
      if (existing.pillar.coordinatorId !== session.userId) {
        return { success: false, error: "No puedes editar proyectos que no te pertenecen." };
      }
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const objectives = formData.get("objectives") as string;
    const status = formData.get("status") as any;
    const visibility = formData.get("visibility") as any;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (description) dataToUpdate.description = description;
    if (objectives !== null) dataToUpdate.objectives = objectives;
    if (status) dataToUpdate.status = status;
    if (visibility) dataToUpdate.visibility = visibility;
    
    if (startDateStr) {
      dataToUpdate.startDate = new Date(startDateStr);
    } else if (startDateStr === "") {
      dataToUpdate.startDate = null;
    }

    if (endDateStr) {
      dataToUpdate.endDate = new Date(endDateStr);
    } else if (endDateStr === "") {
      dataToUpdate.endDate = null;
    }

    // Upload new photo to R2 if provided
    const photoFile = formData.get("photoUrl") as File | null;
    if (photoFile && photoFile.size > 0) {
      dataToUpdate.photoUrl = await uploadFileToR2(photoFile, "projects");
    }

    await prisma.project.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/dashboard/admin/projects");
    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "No se pudo actualizar el proyecto." };
  }
}

export async function deleteProject(id: number) {
  const session = await requireAuth();
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");

  try {
    const existing = await prisma.project.findUnique({ 
      where: { id },
      include: { pillar: true }
    });

    if (!existing) return { success: false, error: "Proyecto no encontrado." };

    if (!isAdmin) {
      if (existing.pillar.coordinatorId !== session.userId) {
        return { success: false, error: "No puedes eliminar proyectos que no te pertenecen." };
      }
    }

    await prisma.project.delete({ where: { id } });
    revalidatePath("/dashboard/admin/projects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "No se pudo eliminar el proyecto. Asegúrate de que no tenga eventos vinculados." };
  }
}
