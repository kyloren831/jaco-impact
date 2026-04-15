import { NextResponse } from 'next/server';
import { CreateUserSchema } from '@/lib/validators/user.validator';
import { UserService } from '@/lib/services/user.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar el body con Zod
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 2. Usar la capa de servicios para la lógica de negocio completa (creación de usuario + rol + voluntario)
    const userService = new UserService();
    const createdUser = await userService.create(parsed.data);

    // 3. Responder
    return NextResponse.json(
      {
        message: "Registro exitoso. Se ha creado el usuario, su rol y su perfil de voluntario.",
        received: createdUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER USER ERROR]", error);

    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

