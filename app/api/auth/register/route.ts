import { NextResponse } from 'next/server';
import { CreateUserSchema } from '@/lib/validators/user.validator';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, isActive } = parsed.data;

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

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        imageUrl: "",
        isActive: isActive ?? true,
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

    const { password: _, ...userWithoutPassword } = createdUser;

    const { domainEventBus } = await import('@/domain/shared/domain-event-bus');
    const { DOMAIN_EVENTS } = await import('@/domain/shared/events');
    await domainEventBus.emit({
      type: DOMAIN_EVENTS.USER_REGISTERED,
      payload: {
        userId: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: "VOLUNTEER"
      },
      metadata: { timestamp: new Date(), actorId: createdUser.id, correlationId: `register-${createdUser.id}` }
    });

    return NextResponse.json(
      {
        message: "Registro exitoso. Se ha creado el usuario, su rol y su perfil de voluntario.",
        received: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER USER ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
