import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { UpdatePillarSchema } from "@/lib/validators/pillar.validator";
import { PillarService } from "@/lib/services/pillar.service";

const pillarService = new PillarService();

// ── Helper para extraer el ID numérico de los params ───────────────
async function extractId(
  params: Promise<{ id: string }>
): Promise<number | null> {
  const { id } = await params;
  const parsed = Number(id);
  return Number.isNaN(parsed) ? null : parsed;
}

// ── GET /api/pillars/[id] — Obtener un pilar ──────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const id = await extractId(params);
    if (id === null) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const pillar = await pillarService.findById(id);

    return NextResponse.json({ data: pillar });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error && error.message === "PILLAR_NOT_FOUND") {
      return NextResponse.json(
        { message: "Pilar no encontrado" },
        { status: 404 }
      );
    }

    console.error("[GET PILLAR ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── PUT /api/pillars/[id] — Actualizar un pilar ───────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const id = await extractId(params);
    if (id === null) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar con Zod (parcial — todos los campos son opcionales)
    const parsed = UpdatePillarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const pillar = await pillarService.update(id, parsed.data);

    return NextResponse.json(
      { message: "Pilar actualizado exitosamente", data: pillar }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error) {
      if (error.message === "PILLAR_NOT_FOUND") {
        return NextResponse.json(
          { message: "Pilar no encontrado" },
          { status: 404 }
        );
      }
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

    console.error("[PUT PILLAR ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/pillars/[id] — Eliminar un pilar ──────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const id = await extractId(params);
    if (id === null) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const pillar = await pillarService.delete(id);

    return NextResponse.json(
      { message: "Pilar eliminado exitosamente", data: pillar }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error && error.message === "PILLAR_NOT_FOUND") {
      return NextResponse.json(
        { message: "Pilar no encontrado" },
        { status: 404 }
      );
    }

    console.error("[DELETE PILLAR ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
