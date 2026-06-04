import type { Project, CreateProjectCommand, UpdateProjectCommand } from "./project.types";

export interface IProjectRepository {
  findById(id: number, tx?: any): Promise<(Project & { pillar: { coordinatorId: number } }) | null>;
  findAll(whereClause: any, tx?: any): Promise<(Project & { pillar: { name: string; color: string; iconUrl: string }; creator: { name: string } })[]>;
  create(data: CreateProjectCommand, tx?: any): Promise<Project>;
  update(id: number, data: UpdateProjectCommand, tx?: any): Promise<Project>;
  delete(id: number, tx?: any): Promise<void>;
  checkPillarExists(pillarId: number, tx?: any): Promise<boolean>;
}
