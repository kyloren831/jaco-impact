import { prisma } from "@/lib/prisma";
import type { CreatePillarDTO, UpdatePillarDTO } from "@/lib/validators/pillar.validator";
import { PillarMapper, type PillarResponse } from "@/lib/mappers/pillar.mapper";

export class PillarService {
  // ── Crear pilar ──────────────────────────────────────────────────
  async create(data: CreatePillarDTO): Promise<PillarResponse> {
    // Verificar que el coordinador exista
    const coordinator = await prisma.user.findUnique({
      where: { id: data.coordinatorId },
    });

    if (!coordinator) {
      throw new Error("COORDINATOR_NOT_FOUND");
    }

    // Verificar que el coordinador no esté asignado a otro pilar
    const existingPillar = await prisma.pillar.findUnique({
      where: { coordinatorId: data.coordinatorId },
    });

    if (existingPillar) {
      throw new Error("COORDINATOR_ALREADY_ASSIGNED");
    }

    const entity = PillarMapper.toEntity(data);
    const pillar = await prisma.pillar.create({ data: entity });

    return PillarMapper.toDto(pillar);
  }

  // ── Obtener todos los pilares ────────────────────────────────────
  async findAll(): Promise<PillarResponse[]> {
    const pillars = await prisma.pillar.findMany({
      orderBy: { id: "asc" },
    });

    return PillarMapper.toDtoList(pillars);
  }

  // ── Obtener un pilar por ID ──────────────────────────────────────
  async findById(id: number): Promise<PillarResponse> {
    const pillar = await prisma.pillar.findUnique({
      where: { id },
    });

    if (!pillar) {
      throw new Error("PILLAR_NOT_FOUND");
    }

    return PillarMapper.toDto(pillar);
  }

  // ── Actualizar pilar ─────────────────────────────────────────────
  async update(id: number, data: UpdatePillarDTO): Promise<PillarResponse> {
    // Verificar que el pilar existe
    const existing = await prisma.pillar.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("PILLAR_NOT_FOUND");
    }

    // Si se está cambiando el coordinador, verificar que no esté asignado a otro pilar
    if (data.coordinatorId !== undefined && data.coordinatorId !== existing.coordinatorId) {
      const coordinator = await prisma.user.findUnique({
        where: { id: data.coordinatorId },
      });

      if (!coordinator) {
        throw new Error("COORDINATOR_NOT_FOUND");
      }

      const conflicting = await prisma.pillar.findUnique({
        where: { coordinatorId: data.coordinatorId },
      });

      if (conflicting) {
        throw new Error("COORDINATOR_ALREADY_ASSIGNED");
      }
    }

    const pillar = await prisma.pillar.update({
      where: { id },
      data,
    });

    return PillarMapper.toDto(pillar);
  }

  // ── Eliminar pilar ───────────────────────────────────────────────
  async delete(id: number): Promise<PillarResponse> {
    const existing = await prisma.pillar.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("PILLAR_NOT_FOUND");
    }

    const pillar = await prisma.pillar.delete({
      where: { id },
    });

    return PillarMapper.toDto(pillar);
  }
}
