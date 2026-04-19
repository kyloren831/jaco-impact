import type { Pillar } from "@/generated/prisma/client";
import type { CreatePillarDTO } from "@/lib/validators/pillar.validator";

// ── Response DTO (lo que sale de la API) ───────────────────────────
export type PillarResponse = {
  id: number;
  coordinatorId: number;
  name: string;
  description: string;
  iconUrl: string;
  color: string;
  isActive: boolean;
};

// ── Mapper ─────────────────────────────────────────────────────────
export class PillarMapper {
  /**
   * DTO de creación → datos para Prisma (excluye campos auto-generados).
   */
  static toEntity(dto: CreatePillarDTO): Omit<Pillar, "id"> {
    return {
      coordinatorId: dto.coordinatorId,
      name: dto.name,
      description: dto.description,
      iconUrl: dto.iconUrl,
      color: dto.color,
      isActive: dto.isActive ?? true,
    };
  }

  /**
   * Entidad Prisma → DTO de respuesta (filtra campos internos si fuera necesario).
   */
  static toDto(pillar: Pillar): PillarResponse {
    return {
      id: pillar.id,
      coordinatorId: pillar.coordinatorId,
      name: pillar.name,
      description: pillar.description,
      iconUrl: pillar.iconUrl,
      color: pillar.color,
      isActive: pillar.isActive,
    };
  }

  /**
   * Array de entidades → array de DTOs.
   */
  static toDtoList(pillars: Pillar[]): PillarResponse[] {
    return pillars.map((p) => PillarMapper.toDto(p));
  }
}
