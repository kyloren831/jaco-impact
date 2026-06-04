import { prisma } from "@/lib/prisma";
import type { IUserRepository } from "@/domain/users/user.repository";
import type { CreateUserCommand, Role } from "@/domain/users/user.types";
import { Prisma } from "@/generated/prisma/client";

export class UserPrismaRepository implements IUserRepository {
  async findById(id: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });
  }

  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserCommand, hashedPassword: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        imageUrl: "",
        isActive: data.isActive ?? true,
        userRoles: {
          create: {
            role: "VOLUNTEER",
          },
        },
        volunteers: {
          create: {
            phone: "",
            nationality: "",
            profession: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
            inmediateAvailability: false,
          },
        },
      },
      include: {
        userRoles: true,
        volunteers: true,
      },
    });
  }

  async assignRole(userId: number, role: Role, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    await client.userRole.upsert({
      where: { userId_role: { userId, role } },
      update: {},
      create: { userId, role },
    });
  }

  async removeRole(userId: number, role: Role, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    await client.userRole.delete({
      where: { userId_role: { userId, role } },
    });
  }

  async checkRoleAssigned(userId: number, role: Role, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const existing = await client.userRole.findUnique({
      where: { userId_role: { userId, role } },
    });
    return existing !== null;
  }
}
