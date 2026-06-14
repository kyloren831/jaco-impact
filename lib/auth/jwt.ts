import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ── Types ──────────────────────────────────────────────────────────
export interface AccessTokenPayload extends JWTPayload {
  sub: string;       // userId como string (JWT spec)
  userId: number;    // userId como numero
  email: string;
  role: string;      // rol principal
  roles: string[];   // todos los roles
  pillarId?: number; // id del pilar si es coordinador
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  type: "refresh";
}

// ── Secret key ─────────────────────────────────────────────────────
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET debe estar definido en .env.local con mínimo 32 caracteres"
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Sign Access Token (15 min) ─────────────────────────────────────
export async function signAccessToken(payload: {
  sub: number;
  email: string;
  role: string;
  roles: string[];
  pillarId?: number;
}): Promise<string> {
  return new SignJWT({
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    roles: payload.roles,
    pillarId: payload.pillarId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecretKey());
}

// ── Sign Refresh Token (7 days) ────────────────────────────────────
export async function signRefreshToken(payload: {
  sub: number;
}): Promise<string> {
  return new SignJWT({ type: "refresh" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

// ── Verify any token ───────────────────────────────────────────────
export async function verifyToken<T extends JWTPayload = JWTPayload>(
  token: string
): Promise<T> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });
  return payload as T;
}
