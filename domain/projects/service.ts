import { IProjectRepository } from "./project.repository";
import { ProjectPrismaRepository } from "@/infrastructure/prisma/repositories/project.prisma-repository";
import { CreateProjectCommand, UpdateProjectCommand } from "./project.types";
import { ProjectNotFoundError, ProjectPillarNotFoundError, ProjectUnauthorizedActionError } from "./project.errors";
import { withTransaction } from "@/lib/prisma";

export class ProjectDomainService {
  constructor(private readonly repository: IProjectRepository = new ProjectPrismaRepository()) {}

  async createProject(data: CreateProjectCommand) {
    return withTransaction(async (tx) => {
      const pillarExists = await this.repository.checkPillarExists(data.pillarId, tx);
      if (!pillarExists) {
        throw new ProjectPillarNotFoundError();
      }

      return this.repository.create(data, tx);
    });
  }

  async getProjects(whereClause: any) {
    return this.repository.findAll(whereClause);
  }

  async getProjectById(id: number) {
    return this.repository.findById(id);
  }

  async updateProject(id: number, data: UpdateProjectCommand, userId: number, isAdmin: boolean) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new ProjectNotFoundError(id);
      }

      if (!isAdmin && existing.pillar.coordinatorId !== userId) {
        throw new ProjectUnauthorizedActionError("No puedes editar proyectos que no te pertenecen.");
      }

      if (data.pillarId !== undefined && data.pillarId !== existing.pillarId) {
        const pillarExists = await this.repository.checkPillarExists(data.pillarId, tx);
        if (!pillarExists) {
          throw new ProjectPillarNotFoundError();
        }
      }

      return this.repository.update(id, data, tx);
    });
  }

  async deleteProject(id: number, userId: number, isAdmin: boolean) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new ProjectNotFoundError(id);
      }

      if (!isAdmin && existing.pillar.coordinatorId !== userId) {
        throw new ProjectUnauthorizedActionError("No puedes eliminar proyectos que no te pertenecen.");
      }

      await this.repository.delete(id, tx);
    });
  }
}

export const projectDomainService = new ProjectDomainService();
