import type { Volunteer, RegisterVolunteerCommand } from "./volunteer.types";

export interface IVolunteerRepository {
  findByEmail(email: string, tx?: any): Promise<any | null>;
  createWithUser(data: RegisterVolunteerCommand, hashedPassword: string, tx?: any): Promise<{ user: any; volunteer: Volunteer }>;
  findAll(tx?: any): Promise<any[]>;
}
