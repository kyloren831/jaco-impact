import type { User, CreateUserCommand, Role } from "./user.types";

export interface IUserRepository {
  findById(id: number, tx?: any): Promise<any | null>;
  findByEmail(email: string, tx?: any): Promise<any | null>;
  create(data: CreateUserCommand, hashedPassword: string, tx?: any): Promise<any>;
  assignRole(userId: number, role: Role, tx?: any): Promise<void>;
  removeRole(userId: number, role: Role, tx?: any): Promise<void>;
  checkRoleAssigned(userId: number, role: Role, tx?: any): Promise<boolean>;
}
