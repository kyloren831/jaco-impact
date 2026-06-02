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
export async function requireRole(allowedRoles: string | string[]): Promise<AccessTokenPayload> {
  const payload = await requireAuth();

  const userRoles = payload.roles ?? [payload.role];
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const hasRole = userRoles.some(role => rolesArray.includes(role));

  if (!hasRole) {
    throw new AuthError(
      "FORBIDDEN",
      `Se requiere uno de los siguientes roles: ${rolesArray.join(", ")}`
    );
  }

  return payload;
}

// ── Require ownership ──────────────────────────────────────────────
/**
 * Valida que el usuario autenticado sea el dueño del recurso.
 */
export async function requireOwnership(resourceOwnerId: number | string): Promise<AccessTokenPayload> {
  const payload = await requireAuth();
  
  if (String(payload.id) !== String(resourceOwnerId)) {
    throw new AuthError("FORBIDDEN", "No tienes permisos para modificar este recurso");
  }
  
  return payload;
}

// ── Higher-Order Action Wrappers ───────────────────────────────────

export function withAuth<T, Args extends any[]>(
  action: (payload: AccessTokenPayload, ...args: Args) => Promise<T>
) {
  return async (...args: Args): Promise<T> => {
    const payload = await requireAuth();
    return action(payload, ...args);
  };
}

export function withRole<T, Args extends any[]>(
  roles: string | string[],
  action: (payload: AccessTokenPayload, ...args: Args) => Promise<T>
) {
  return async (...args: Args): Promise<T> => {
    const payload = await requireRole(roles);
    return action(payload, ...args);
  };
}
