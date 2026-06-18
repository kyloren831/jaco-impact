import { prisma } from "@/lib/prisma";
import type { IUserRepository } from "@/domain/users/user.repository";
import type { CreateUserCommand, UpdateProfileCommand, Role } from "@/domain/users/user.types";
import { Prisma } from "@/generated/prisma/client";

export class UserPrismaRepository implements IUserRepository {
  async findById(id: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.user.findUnique({
      where: { id },
      include: { userRoles: true, volunteers: true },
    });
  }

  async updateProfile(data: UpdateProfileCommand, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    
    // Update basic user fields
    if (data.name !== undefined || data.imageUrl !== undefined) {
      await client.user.update({
        where: { id: data.userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        },
      });
    }

    // Update volunteer data if provided
    if (data.volunteerData) {
      await client.volunteer.upsert({
        where: { userId: data.userId },
        update: data.volunteerData,
        create: {
          userId: data.userId,
          phone: data.volunteerData.phone || "",
          nationality: data.volunteerData.nationality || "",
          profession: data.volunteerData.profession || "",
          emergencyContactName: data.volunteerData.emergencyContactName || "",
          emergencyContactPhone: data.volunteerData.emergencyContactPhone || "",
          inmediateAvailability: data.volunteerData.inmediateAvailability || false,
        },
      });
    }

    return this.findById(data.userId, tx);
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
