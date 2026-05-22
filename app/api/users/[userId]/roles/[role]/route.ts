import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { AssignRoleSchema } from "@/lib/validators/user.validator";
import { UserService } from "@/lib/services/user.service";

const userService = new UserService();

// Roles válidos del sistema (deben coincidir con el enum Role de Prisma)
const VALID_ROLES = ["ADMIN", "COORDINATOR", "MODERATOR", "VOLUNTEER", "PYME_MANAGER"];

// ── Helper para extraer y validar los params de la ruta ────────────
async function extractParams(
  params: Promise<{ userId: string; role: string }>
): Promise<{ userId: number; role: string } | null> {
  const { userId, role } = await params;
  const parsedId = Number(userId);

  if (Number.isNaN(parsedId)) return null;
  if (!VALID_ROLES.includes(role.toUpperCase())) return null;

  return { userId: parsedId, role: role.toUpperCase() };
}

// ── POST /api/users/[userId]/roles/[role] — Asignar rol ───────────
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string; role: string }> }
) {
  try {
    // Solo ADMIN puede asignar roles
    await requireRole("ADMIN");

    const extracted = await extractParams(params);
    if (!extracted) {
      return NextResponse.json(
        { message: "Parámetros inválidos. userId debe ser numérico y role debe ser un rol válido." },
        { status: 400 }
      );
    }

    // Validar con Zod
    const parsed = AssignRoleSchema.safeParse(extracted);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await userService.assignRole(parsed.data);

    return NextResponse.json(
      { message: "Rol asignado exitosamente", data: user },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    console.error("[POST USER ROLE ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/users/[userId]/roles/[role] — Eliminar rol ────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string; role: string }> }
) {
  try {
    // Solo ADMIN puede eliminar roles
    await requireRole("ADMIN");

    const extracted = await extractParams(params);
    if (!extracted) {
      return NextResponse.json(
        { message: "Parámetros inválidos. userId debe ser numérico y role debe ser un rol válido." },
        { status: 400 }
      );
    }

    // Validar con Zod
    const parsed = AssignRoleSchema.safeParse(extracted);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await userService.removeRole(parsed.data);

    return NextResponse.json(
      { message: "Rol eliminado exitosamente", data: user }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ message: error.message }, { status });
    }

    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          { message: "Usuario no encontrado" },
          { status: 404 }
        );
      }
      if (error.message === "ROLE_NOT_ASSIGNED") {
        return NextResponse.json(
          { message: "El usuario no tiene este rol asignado" },
          { status: 404 }
        );
      }
    }

    console.error("[DELETE USER ROLE ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
