import { NextResponse } from "next/server";
import { RegisterVolunteerSchema, VolunteerService } from "@/lib/services/volunteer.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar el body con Zod
    const parsed = RegisterVolunteerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 2. Ejecutar servicio
    const volunteerService = new VolunteerService();
    const result = await volunteerService.register(parsed.data);

    // 3. Devolver respuesta exitosa
    return NextResponse.json(
      {
        message: "Voluntario registrado exitosamente",
        user: result.user,
        volunteer: result.volunteer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER VOLUNTEER ERROR]", error);

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
