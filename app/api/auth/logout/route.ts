import { NextResponse } from "next/server";
import {
  getRefreshTokenFromCookies,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { hashToken } from "@/lib/auth/hash";
import { revokeSessionByRefreshHash } from "@/lib/auth/session";

export async function POST() {
  try {
    // ── 1. Leer refresh_token de cookie ────────────────────────────
    const refreshToken = await getRefreshTokenFromCookies();

    if (refreshToken) {
      // ── 2. Revocar la sesión asociada en DB ──────────────────────
      const refreshHash = hashToken(refreshToken);
      await revokeSessionByRefreshHash(refreshHash);
    }

    // ── 3. Borrar cookies ──────────────────────────────────────────
    await clearAuthCookies();

    // ── 4. Responder ───────────────────────────────────────────────
    return NextResponse.json({ message: "Logout OK" });
  } catch (error) {
    console.error("[LOGOUT ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
