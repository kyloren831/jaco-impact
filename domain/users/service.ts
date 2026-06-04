import { IUserRepository } from "./user.repository";
import { UserPrismaRepository } from "@/infrastructure/prisma/repositories/user.prisma-repository";
import { CreateUserCommand, AssignRoleCommand } from "./user.types";
import { UserEmailAlreadyExistsError, UserNotFoundError, UserRoleNotAssignedError } from "./user.errors";
import { withTransaction } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export class UserDomainService {
  constructor(private readonly repository: IUserRepository = new UserPrismaRepository()) {}

  async create(data: CreateUserCommand) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findByEmail(data.email, tx);
      if (existing) {
        throw new UserEmailAlreadyExistsError();
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const created = await this.repository.create(data, hashedPassword, tx);
      
      const { password: _, ...userWithoutPassword } = created;
      return userWithoutPassword;
    });
  }

  async assignRole(data: AssignRoleCommand) {
    return withTransaction(async (tx) => {
      const user = await this.repository.findById(data.userId, tx);
      if (!user) {
        throw new UserNotFoundError();
      }

      await this.repository.assignRole(data.userId, data.role as any, tx);

      const updated = await this.repository.findById(data.userId, tx);
      const { password: _, ...userWithoutPassword } = updated;
      return userWithoutPassword;
    });
  }

  async removeRole(data: AssignRoleCommand) {
    return withTransaction(async (tx) => {
      const user = await this.repository.findById(data.userId, tx);
      if (!user) {
        throw new UserNotFoundError();
      }

      const assigned = await this.repository.checkRoleAssigned(data.userId, data.role as any, tx);
      if (!assigned) {
        throw new UserRoleNotAssignedError();
      }

      await this.repository.removeRole(data.userId, data.role as any, tx);

      const updated = await this.repository.findById(data.userId, tx);
      const { password: _, ...userWithoutPassword } = updated;
      return userWithoutPassword;
    });
  }

  async getCurrentUser(userId: number) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const userDomainService = new UserDomainService();
