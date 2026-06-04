import { prisma } from "@/lib/prisma";
import type { IProjectRepository } from "@/domain/projects/project.repository";
import type { CreateProjectCommand, UpdateProjectCommand, Project } from "@/domain/projects/project.types";
import { Prisma } from "@/generated/prisma/client";

export class ProjectPrismaRepository implements IProjectRepository {
  async findById(id: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.project.findUnique({
      where: { id },
      include: { pillar: { select: { coordinatorId: true } } },
    });
  }

  async findAll(whereClause: any, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        pillar: {
          select: { name: true, color: true, iconUrl: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });
  }

  async create(data: CreateProjectCommand, tx?: Prisma.TransactionClient): Promise<Project> {
    const client = tx || prisma;
    return client.project.create({ data });
  }

  async update(id: number, data: UpdateProjectCommand, tx?: Prisma.TransactionClient): Promise<Project> {
    const client = tx || prisma;
    return client.project.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || prisma;
    await client.project.delete({ where: { id } });
  }

  async checkPillarExists(pillarId: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx || prisma;
    const pillar = await client.pillar.findUnique({ where: { id: pillarId }, select: { id: true } });
    return pillar !== null;
  }
}
