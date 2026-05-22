import { prisma } from "@/lib/prisma";
import type { CreateProjectDTO, UpdateProjectDTO } from "@/lib/validators/project.validator";
import { ProjectMapper, type ProjectResponse } from "@/lib/mappers/project.mapper";

export class ProjectService {
  // ── Crear proyecto ────────────────────────────────────────────────
  async create(data: CreateProjectDTO, createdBY: number): Promise<ProjectResponse> {
    // Verificar que el pilar exista
    const pillar = await prisma.pillar.findUnique({
      where: { id: data.pillarId },
    });

    if (!pillar) {
      throw new Error("PILLAR_NOT_FOUND");
    }

    const entity = ProjectMapper.toEntity(data, createdBY);
    const project = await prisma.project.create({ data: entity });

    return ProjectMapper.toDto(project);
  }

  // ── Obtener todos los proyectos ──────────────────────────────────
  async findAll(): Promise<ProjectResponse[]> {
    const projects = await prisma.project.findMany({
      orderBy: { id: "asc" },
    });

    return ProjectMapper.toDtoList(projects);
  }

  // ── Obtener un proyecto por ID ───────────────────────────────────
  async findById(id: number): Promise<ProjectResponse> {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    return ProjectMapper.toDto(project);
  }

  // ── Actualizar proyecto ──────────────────────────────────────────
  async update(id: number, data: UpdateProjectDTO): Promise<ProjectResponse> {
    // Verificar que el proyecto existe
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Si se está cambiando el pilar, verificar que exista
    if (data.pillarId !== undefined && data.pillarId !== existing.pillarId) {
      const pillar = await prisma.pillar.findUnique({
        where: { id: data.pillarId },
      });

      if (!pillar) {
        throw new Error("PILLAR_NOT_FOUND");
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return ProjectMapper.toDto(project);
  }

  // ── Eliminar proyecto ────────────────────────────────────────────
  async delete(id: number): Promise<ProjectResponse> {
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const project = await prisma.project.delete({
      where: { id },
    });

    return ProjectMapper.toDto(project);
  }
}
