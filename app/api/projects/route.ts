import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { CreateProjectSchema } from "@/lib/validators/project.validator";
import { ProjectService } from "@/lib/services/project.service";

const projectService = new ProjectService();

// ── GET /api/projects — Listar todos los proyectos ─────────────────
export async function GET() {
  try {
    // Solo ADMIN puede listar proyectos
    await requireRole("ADMIN");

    const projects = await projectService.findAll();

    return NextResponse.json({ data: projects });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.error("[GET PROJECTS ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── POST /api/projects — Crear un proyecto ─────────────────────────
export async function POST(request: Request) {
  try {
    // Solo ADMIN puede crear proyectos
    const payload = await requireRole("ADMIN");

    const body = await request.json();

    // Validar con Zod
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // El creador es el usuario autenticado (sub del token)
    const createdBY = Number(payload.sub);

    const project = await projectService.create(parsed.data, createdBY);

    return NextResponse.json(
      { message: "Proyecto creado exitosamente", data: project },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error && error.message === "PILLAR_NOT_FOUND") {
      return NextResponse.json(
        { message: "El pilar especificado no existe" },
        { status: 404 }
      );
    }

    console.error("[POST PROJECT ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
