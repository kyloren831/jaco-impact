import { prisma } from "@/lib/prisma";
import type { IVolunteerRepository } from "@/domain/volunteers/volunteer.repository";
import type { RegisterVolunteerCommand, Volunteer } from "@/domain/volunteers/volunteer.types";
import { Prisma } from "@/generated/prisma/client";

export class VolunteerPrismaRepository implements IVolunteerRepository {
  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  async createWithUser(data: RegisterVolunteerCommand, hashedPassword: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const user = await client.user.create({
      data: {
        name: data.name,
        email: data.email,
        imageUrl: "",
        password: hashedPassword,
        isActive: true,
        userRoles: {
          create: {
            role: "VOLUNTEER",
          },
        },
      },
    });

    const volunteer = await client.volunteer.create({
      data: {
        userId: user.id,
        phone: data.phone,
        nationality: data.nationality,
        profession: data.profession,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        inmediateAvailability: data.inmediateAvailability,
      },
    });

    return { user, volunteer };
  }

  async findAll(tx?: Prisma.TransactionClient, take?: number) {
    const client = tx || prisma;
    return client.volunteer.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
      take,
    });
  }
}
