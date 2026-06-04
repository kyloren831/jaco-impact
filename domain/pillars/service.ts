import { IPillarRepository } from "./pillar.repository";
import { PillarPrismaRepository } from "@/infrastructure/prisma/repositories/pillar.prisma-repository";
import { CreatePillarCommand, UpdatePillarCommand } from "./pillar.types";
import { PillarCoordinatorNotFoundError, PillarCoordinatorAlreadyAssignedError, PillarNotFoundError } from "./pillar.errors";
import { withTransaction } from "@/lib/prisma";

export class PillarDomainService {
  constructor(private readonly repository: IPillarRepository = new PillarPrismaRepository()) {}

  async createPillar(data: CreatePillarCommand) {
    return withTransaction(async (tx) => {
      const coordinatorExists = await this.repository.checkCoordinatorExists(data.coordinatorId, tx);
      if (!coordinatorExists) {
        throw new PillarCoordinatorNotFoundError();
      }

      const existingPillar = await this.repository.findByCoordinatorId(data.coordinatorId, tx);
      if (existingPillar) {
        throw new PillarCoordinatorAlreadyAssignedError();
      }

      return this.repository.create(data, tx);
    });
  }

  async getAllPillars() {
    return this.repository.findAll();
  }

  async updatePillar(id: number, data: UpdatePillarCommand) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new PillarNotFoundError(id);
      }

      if (data.coordinatorId !== undefined && data.coordinatorId !== existing.coordinatorId) {
        const coordinatorExists = await this.repository.checkCoordinatorExists(data.coordinatorId, tx);
        if (!coordinatorExists) {
          throw new PillarCoordinatorNotFoundError();
        }

        const conflicting = await this.repository.findByCoordinatorId(data.coordinatorId, tx);
        if (conflicting) {
          throw new PillarCoordinatorAlreadyAssignedError();
        }
      }

      return this.repository.update(id, data, tx);
    });
  }

  async deletePillar(id: number) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new PillarNotFoundError(id);
      }
      await this.repository.delete(id, tx);
    });
  }
}

export const pillarDomainService = new PillarDomainService();
