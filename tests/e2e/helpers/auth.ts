import { SignJWT } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be defined in environment with at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: {
  userId: number;
  email: string;
  role: string;
  roles: string[];
  pillarId?: number;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    roles: payload.roles,
    pillarId: payload.pillarId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecretKey());
}

export async function getAuthCookie(payload: {
  userId: number;
  email: string;
  role: string;
  roles: string[];
  pillarId?: number;
}): Promise<string> {
  const token = await signAccessToken(payload);
  return `access_token=${token}`;
}
