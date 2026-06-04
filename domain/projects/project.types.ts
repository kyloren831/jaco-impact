import type { Project, ProjectStatus, Visibility } from "@/generated/prisma/client";

export type { Project, ProjectStatus, Visibility as ProjectVisibility };

export interface CreateProjectCommand {
  createdBy: number;
  pillarId: number;
  name: string;
  description: string;
  objectives?: string;
  status: ProjectStatus;
  visibility: Visibility;
  startDate?: Date | null;
  endDate?: Date | null;
  publishedAt?: Date | null;
  photoUrl?: string | null;
}

export interface UpdateProjectCommand {
  pillarId?: number;
  name?: string;
  description?: string;
  objectives?: string;
  status?: ProjectStatus;
  visibility?: Visibility;
  startDate?: Date | null;
  endDate?: Date | null;
  publishedAt?: Date | null;
  photoUrl?: string | null;
}
