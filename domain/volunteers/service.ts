import { IVolunteerRepository } from "./volunteer.repository";
import { VolunteerPrismaRepository } from "@/infrastructure/prisma/repositories/volunteer.prisma-repository";
import { RegisterVolunteerCommand } from "./volunteer.types";
import { VolunteerEmailAlreadyExistsError } from "./volunteer.errors";
import { withTransaction } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export class VolunteerDomainService {
  constructor(private readonly repository: IVolunteerRepository = new VolunteerPrismaRepository()) {}

  async register(data: RegisterVolunteerCommand) {
    return withTransaction(async (tx) => {
      const existing = await this.repository.findByEmail(data.email, tx);
      if (existing) {
        throw new VolunteerEmailAlreadyExistsError();
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const result = await this.repository.createWithUser(data, hashedPassword, tx);
      
      const { password: _, ...userWithoutPassword } = result.user;
      return {
        user: userWithoutPassword,
        volunteer: result.volunteer,
      };
    });
  }

  async getAllVolunteers() {
    return this.repository.findAll();
  }
}

export const volunteerDomainService = new VolunteerDomainService();
