import { prisma } from "@/lib/prisma";
import { IPillarRepository } from "@/domain/pillars/pillar.repository";
import { CreatePillarCommand, UpdatePillarCommand, Pillar } from "@/domain/pillars/pillar.types";
import { Prisma } from "@/generated/prisma/client";

export class PillarPrismaRepository implements IPillarRepository {
  async findById(id: number, tx?: Prisma.TransactionClient): Promise<Pillar | null> {
    const client = tx || prisma;
    return client.pillar.findUnique({ where: { id } });
  }

  async findByCoordinatorId(coordinatorId: number, tx?: Prisma.TransactionClient): Promise<Pillar | null> {
    const client = tx || prisma;
    return client.pillar.findUnique({ where: { coordinatorId } });
  }

  async findAll(tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.pillar.findMany({
      orderBy: { id: "asc" },
      include: {
        coordinator: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async create(data: CreatePillarCommand, tx?: Prisma.TransactionClient): Promise<Pillar> {
    const client = tx || prisma;
    return client.pillar.create({ data });
  }

  async update(id: number, data: UpdatePillarCommand, tx?: Prisma.TransactionClient): Promise<Pillar> {
    const client = tx || prisma;
    return client.pillar.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || prisma;
    await client.pillar.delete({ where: { id } });
  }

  async checkCoordinatorExists(coordinatorId: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx || prisma;
    const user = await client.user.findUnique({ where: { id: coordinatorId }, select: { id: true } });
    return user !== null;
  }
}
