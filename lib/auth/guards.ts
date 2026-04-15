import { getAccessTokenFromCookies } from "./cookies";
import { verifyToken, type AccessTokenPayload } from "./jwt";

// ── Error codes ────────────────────────────────────────────────────
export class AuthError extends Error {
  constructor(
    public code: "NO_TOKEN" | "INVALID_TOKEN" | "FORBIDDEN",
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ── Require authentication ─────────────────────────────────────────
/**
 * Valida el access_token desde la cookie y retorna el payload.
 * Lanza AuthError si no hay token o es inválido.
 */
export async function requireAuth(): Promise<AccessTokenPayload> {
  const token = await getAccessTokenFromCookies();

  if (!token) {
    throw new AuthError("NO_TOKEN", "No se proporcionó token de acceso");
  }

  try {
    const payload = await verifyToken<AccessTokenPayload>(token);
    return payload;
  } catch {
    throw new AuthError("INVALID_TOKEN", "Token de acceso inválido o expirado");
  }
}

// ── Require specific role ──────────────────────────────────────────
/**
 * Valida que el usuario tenga el rol requerido.
 * Llama a requireAuth() internamente.
 */
export async function requireRole(role: string): Promise<AccessTokenPayload> {
  const payload = await requireAuth();

  // Verifica en el array de roles (más flexible que solo el rol principal)
  const userRoles = payload.roles ?? [payload.role];

  if (!userRoles.includes(role)) {
    throw new AuthError(
      "FORBIDDEN",
      `Se requiere el rol '${role}' para acceder a este recurso`
    );
  }

  return payload;
}
