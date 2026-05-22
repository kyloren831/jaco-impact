import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { UpdateProjectSchema } from "@/lib/validators/project.validator";
import { ProjectService } from "@/lib/services/project.service";

const projectService = new ProjectService();

// ── Helper para extraer el ID numérico de los params ───────────────
async function extractId(
  params: Promise<{ id: string }>
): Promise<number | null> {
  const { id } = await params;
  const parsed = Number(id);
  return Number.isNaN(parsed) ? null : parsed;
}

// ── GET /api/projects/[id] — Obtener un proyecto ──────────────────
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

    const project = await projectService.findById(id);

    return NextResponse.json({ data: project });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return NextResponse.json(
        { message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    console.error("[GET PROJECT ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── PUT /api/projects/[id] — Actualizar un proyecto ───────────────
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
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const project = await projectService.update(id, parsed.data);

    return NextResponse.json(
      { message: "Proyecto actualizado exitosamente", data: project }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error) {
      if (error.message === "PROJECT_NOT_FOUND") {
        return NextResponse.json(
          { message: "Proyecto no encontrado" },
          { status: 404 }
        );
      }
      if (error.message === "PILLAR_NOT_FOUND") {
        return NextResponse.json(
          { message: "El pilar especificado no existe" },
          { status: 404 }
        );
      }
    }

    console.error("[PUT PROJECT ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/projects/[id] — Eliminar un proyecto ──────────────
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

    const project = await projectService.delete(id);

    return NextResponse.json(
      { message: "Proyecto eliminado exitosamente", data: project }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return NextResponse.json(
        { message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    console.error("[DELETE PROJECT ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
