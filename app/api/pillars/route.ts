import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { CreatePillarSchema } from "@/lib/validators/pillar.validator";
import { PillarService } from "@/lib/services/pillar.service";

const pillarService = new PillarService();

// ── GET /api/pillars — Listar todos los pilares ────────────────────
export async function GET() {
  try {
    // Solo ADMIN puede listar pilares
    await requireRole("ADMIN");

    const pillars = await pillarService.findAll();

    return NextResponse.json({ data: pillars });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.error("[GET PILLARS ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── POST /api/pillars — Crear un pilar ─────────────────────────────
export async function POST(request: Request) {
  try {
    // Solo ADMIN puede crear pilares
    await requireRole("ADMIN");

    const body = await request.json();

    // Validar con Zod
    const parsed = CreatePillarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const pillar = await pillarService.create(parsed.data);

    return NextResponse.json(
      { message: "Pilar creado exitosamente", data: pillar },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error) {
      if (error.message === "COORDINATOR_NOT_FOUND") {
        return NextResponse.json(
          { message: "El coordinador especificado no existe" },
          { status: 404 }
        );
      }
      if (error.message === "COORDINATOR_ALREADY_ASSIGNED") {
        return NextResponse.json(
          { message: "El coordinador ya está asignado a otro pilar" },
          { status: 409 }
        );
      }
    }

    console.error("[POST PILLAR ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
