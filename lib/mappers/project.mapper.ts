import type { Project } from "@/generated/prisma/client";
import type { CreateProjectDTO } from "@/lib/validators/project.validator";

// ── Response DTO (lo que sale de la API) ───────────────────────────
export type ProjectResponse = {
  id: number;
  pillarId: number;
  createdBY: number;
  name: string;
  description: string;
  objectives: string | null;
  status: string;
  visibility: string;
  startDate: Date | null;
  endDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};

// ── Mapper ─────────────────────────────────────────────────────────
export class ProjectMapper {
  /**
   * DTO de creación → datos para Prisma (excluye campos auto-generados).
   * Requiere el ID del usuario autenticado para asignar createdBY.
   */
  static toEntity(
    dto: CreateProjectDTO,
    createdBY: number
  ): Omit<Project, "id" | "createdAt"> {
    return {
      pillarId: dto.pillarId,
      createdBY,
      name: dto.name,
      description: dto.description,
      objectives: dto.objectives ?? null,
      status: dto.status ?? "DRAFT",
      visibility: dto.visibility,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      publishedAt: null,
    };
  }

  /**
   * Entidad Prisma → DTO de respuesta.
   */
  static toDto(project: Project): ProjectResponse {
    return {
      id: project.id,
      pillarId: project.pillarId,
      createdBY: project.createdBY,
      name: project.name,
      description: project.description,
      objectives: project.objectives,
      status: project.status,
      visibility: project.visibility,
      startDate: project.startDate,
      endDate: project.endDate,
      publishedAt: project.publishedAt,
      createdAt: project.createdAt,
    };
  }

  /**
   * Array de entidades → array de DTOs.
   */
  static toDtoList(projects: Project[]): ProjectResponse[] {
    return projects.map((p) => ProjectMapper.toDto(p));
  }
}
