import { cookies } from "next/headers";

// ── Constantes ─────────────────────────────────────────────────────
const ACCESS_COOKIE  = "access_token";
const REFRESH_COOKIE = "refresh_token";

const ACCESS_MAX_AGE  = 15 * 60;           // 15 minutos en segundos
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;  // 7 días en segundos

const isProduction = process.env.NODE_ENV === "production";

// ── Opciones base para cookies ─────────────────────────────────────
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// ── Set both auth cookies ──────────────────────────────────────────
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

// ── Clear both auth cookies ────────────────────────────────────────
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

// ── Getters ────────────────────────────────────────────────────────
export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}
