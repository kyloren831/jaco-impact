import type { Pillar, CreatePillarCommand, UpdatePillarCommand } from "./pillar.types";

export interface IPillarRepository {
  findById(id: number, tx?: any): Promise<Pillar | null>;
  findByCoordinatorId(coordinatorId: number, tx?: any): Promise<Pillar | null>;
  findAll(tx?: any): Promise<(Pillar & { coordinator: { name: string; email: string } | null })[]>;
  create(data: CreatePillarCommand, tx?: any): Promise<Pillar>;
  update(id: number, data: UpdatePillarCommand, tx?: any): Promise<Pillar>;
  delete(id: number, tx?: any): Promise<void>;
  checkCoordinatorExists(coordinatorId: number, tx?: any): Promise<boolean>;
}
