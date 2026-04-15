import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/hash";
import { setAuthCookies } from "@/lib/auth/cookies";
import { createSession } from "@/lib/auth/session";
import { LoginUserSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    // ── 1. Leer body y validar con Zod ─────────────────────────────
    const body = await request.json();
    const result = LoginUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // ── 2. Buscar usuario con roles ────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // ── 3. Verificar que el usuario está activo ────────────────────
    if (!user.isActive) {
      return NextResponse.json(
        { message: "Cuenta desactivada" },
        { status: 403 }
      );
    }

    // ── 4. Validar password ────────────────────────────────────────
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // ── 5. Extraer roles ───────────────────────────────────────────
    const roles = user.userRoles.map((ur) => ur.role);
    const primaryRole = roles[0] ?? "VOLUNTEER";

    // ── 6. Generar tokens ──────────────────────────────────────────
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: primaryRole,
      roles,
    });

    const refreshToken = await signRefreshToken({
      sub: user.id,
    });

    // ── 7. Guardar sesión en DB (hash del refresh) ─────────────────
    const refreshHash = hashToken(refreshToken);

    // Extraer metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? undefined;
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      undefined;

    await createSession(user.id, refreshHash, { userAgent, ip });

    // ── 8. Setear cookies HttpOnly ─────────────────────────────────
    await setAuthCookies(accessToken, refreshToken);

    // ── 9. Responder ───────────────────────────────────────────────
    return NextResponse.json({ message: "Login OK" });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
