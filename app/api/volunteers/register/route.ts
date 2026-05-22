import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { CreateUserSchema } from "@/lib/validators/user.validator";

export const RegisterVolunteerSchema = CreateUserSchema.extend({
  phone: z.string().min(1, "El teléfono es requerido"),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  profession: z.string().min(1, "La profesión es requerida"),
  emergencyContactName: z.string().min(1, "El contacto de emergencia es requerido"),
  emergencyContactPhone: z.string().min(1, "El teléfono de emergencia es requerido"),
  inmediateAvailability: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = RegisterVolunteerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      phone,
      nationality,
      profession,
      emergencyContactName,
      emergencyContactPhone,
      inmediateAvailability,
    } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
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

      const volunteer = await tx.volunteer.create({
        data: {
          userId: user.id,
          phone,
          nationality,
          profession,
          emergencyContactName,
          emergencyContactPhone,
          inmediateAvailability,
        },
      });

      return { user, volunteer };
    });

    const { password: _, ...userWithoutPassword } = result.user;

    return NextResponse.json(
      {
        message: "Voluntario registrado exitosamente",
        user: userWithoutPassword,
        volunteer: result.volunteer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER VOLUNTEER ERROR]", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
