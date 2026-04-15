import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
  type RefreshTokenPayload,
} from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/hash";
import { setAuthCookies, getRefreshTokenFromCookies } from "@/lib/auth/cookies";
import {
  findValidSession,
  revokeSession,
  revokeAllUserSessions,
  createSession,
} from "@/lib/auth/session";

export async function POST() {
  try {
    // ── 1. Leer refresh_token de cookie ────────────────────────────
    const refreshToken = await getRefreshTokenFromCookies();

    if (!refreshToken) {
      return NextResponse.json(
        { message: "No se proporcionó refresh token" },
        { status: 401 }
      );
    }

    // ── 2. Verificar JWT y validar type === "refresh" ──────────────
    let payload: RefreshTokenPayload;
    try {
      payload = await verifyToken<RefreshTokenPayload>(refreshToken);
    } catch {
      return NextResponse.json(
        { message: "Refresh token inválido o expirado" },
        { status: 401 }
      );
    }

    if (payload.type !== "refresh") {
      return NextResponse.json(
        { message: "Token no es de tipo refresh" },
        { status: 401 }
      );
    }

    const userId = Number(payload.sub);

    // ── 3. Buscar sesión válida en DB usando hash ──────────────────
    const currentHash = hashToken(refreshToken);
    const session = await findValidSession(userId, currentHash);

    if (!session) {
      // ⚠️ REUSE ATTACK: token válido pero sesión no encontrada
      // Podría ser que el refresh token fue robado y ya rotado.
      // Revocar TODAS las sesiones del usuario por seguridad.
      await revokeAllUserSessions(userId);

      return NextResponse.json(
        { message: "Sesión no válida. Todas las sesiones han sido revocadas." },
        { status: 401 }
      );
    }

    // ── 4. Revocar sesión actual ───────────────────────────────────
    await revokeSession(session.id);

    // ── 5. Generar nuevos tokens ───────────────────────────────────
    // Buscar usuario para obtener roles actualizados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Usuario no encontrado o desactivado" },
        { status: 401 }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role);
    const primaryRole = roles[0] ?? "VOLUNTEER";

    const newAccessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: primaryRole,
      roles,
    });

    const newRefreshToken = await signRefreshToken({
      sub: user.id,
    });

    // ── 6. Crear nueva sesión en DB ────────────────────────────────
    const newRefreshHash = hashToken(newRefreshToken);

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? undefined;
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      undefined;

    await createSession(user.id, newRefreshHash, { userAgent, ip });

    // ── 7. Setear nuevas cookies ───────────────────────────────────
    await setAuthCookies(newAccessToken, newRefreshToken);

    // ── 8. Responder ───────────────────────────────────────────────
    return NextResponse.json({ message: "Refreshed" });
  } catch (error) {
    console.error("[REFRESH ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
