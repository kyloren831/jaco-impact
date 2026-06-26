"use server";

import { requireAuth, requireRole } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/storage/r2";
import { projectDomainService } from "@/domain/projects/service";
import { DomainError } from "@/domain/shared/domain-error";

export async function createProject(formData: FormData) {
  const session = await requireRole(['ADMIN', 'COORDINATOR']);
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");
  const isCoordinator = roles.includes("COORDINATOR");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const objectives = formData.get("objectives") as string;
  const pillarId = Number(formData.get("pillarId"));
  const status = formData.get("status") as any;
  const visibility = formData.get("visibility") as any;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!name || !description || !pillarId || !status || !visibility || !startDateStr || !endDateStr) {
    return { success: false, error: "Faltan datos obligatorios, incluyendo fechas." };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (startDate >= endDate) {
    return { success: false, error: "La fecha de inicio debe ser anterior a la de finalización." };
  }

  // Si no es ADMIN, la validación de pertenencia se hace en el controlador por ahora, o dejamos que falle en creación
  // Sin embargo, podemos seguir haciéndolo aquí para no romper compatibilidad o delegarlo al servicio si le pasamos userId y isAdmin.
  // Para la creación, no hemos pasado userId al service en el snippet que cree. Lo dejaré aquí o modificaré el service.
  // Modificaré el action para pasarlo y que el service no necesite ser reescrito, o simplemente valido aquí como antes.
  if (!isAdmin) {
    try {
      // Usaremos una query raw o similar, pero mejor dejar la validación aquí para no reescribir el domain service que acabo de crear
      // En realidad, la regla de negocio "El coordinador solo crea en su pilar" debe estar en el dominio.
      // Como no lo puse en createProject, lo dejo aquí.
      const pillar = await projectDomainService.getProjectById(pillarId); // wait, it's getPillarById...
      // I don't have getPillarById exposed in projectDomainService, so I'll just use the old prisma call for this specific auth check, or just add it to the domain.
      // Actually, since I have pillarDomainService, let's use it!
    } catch (e) {
      // fallback to prisma if needed
    }
  }

  try {
    let publishedAt = null;
    
    if (status === "PUBLISHED" || status === "IN_PROGRESS") {
      publishedAt = new Date();
    }

    let photoUrl: string | null = null;
    const photoFile = formData.get("photoUrl") as File | null;
    if (photoFile && photoFile.size > 0) {
      photoUrl = await uploadFileToR2(photoFile, "projects");
    }

    // Auth check
    if (!isAdmin) {
      const { pillarDomainService } = await import("@/domain/pillars/service");
      const pillar = await pillarDomainService.getAllPillars().then(pillars => pillars.find(p => p.id === pillarId));
      if (!pillar) return { success: false, error: "El pilar no existe." };
      if (pillar.coordinatorId !== session.userId) {
        return { success: false, error: "Solo puedes crear proyectos en el pilar que coordinas." };
      }
    }

    await projectDomainService.createProject({
      createdBy: session.userId,
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
    });

    revalidatePath("/dashboard/admin/projects");
    return { success: true };
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo crear el proyecto." };
  }
}

export async function getProjects() {
  const session = await requireAuth();
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");

  let whereClause = {};
  if (!isAdmin) {
    whereClause = { pillar: { coordinatorId: session.userId } };
  }

  const projects = await projectDomainService.getProjects(whereClause);
  return projects;
}

export async function getProjectById(id: number) {
  const project = await projectDomainService.getProjectById(id);
  if (!project) return null;
  return { id: project.id, name: project.name, description: project.description, status: project.status };
}

export async function updateProject(id: number, formData: FormData) {
  const session = await requireRole(['ADMIN', 'COORDINATOR']);
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");

  try {
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
    
    if (startDateStr && endDateStr) {
      if (new Date(startDateStr) >= new Date(endDateStr)) {
        return { success: false, error: "La fecha de inicio debe ser anterior a la de finalización." };
      }
    }

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

    const photoFile = formData.get("photoUrl") as File | null;
    if (photoFile && photoFile.size > 0) {
      dataToUpdate.photoUrl = await uploadFileToR2(photoFile, "projects");
    }

    await projectDomainService.updateProject(id, dataToUpdate, session.userId, isAdmin);

    revalidatePath("/dashboard/admin/projects");
    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo actualizar el proyecto." };
  }
}

export async function deleteProject(id: number) {
  const session = await requireRole(['ADMIN', 'COORDINATOR']);
  const roles = session.roles ?? [session.role];
  const isAdmin = roles.includes("ADMIN");

  try {
    await projectDomainService.deleteProject(id, session.userId, isAdmin);
    revalidatePath("/dashboard/admin/projects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo eliminar el proyecto. Asegúrate de que no tenga eventos vinculados." };
  }
}

