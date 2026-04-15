import crypto from "crypto";

/**
 * Hashea un token (refresh) usando SHA-256.
 * Se guarda el hash en DB, nunca el token real.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
