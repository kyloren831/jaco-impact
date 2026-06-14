// ── Auth module barrel export ──────────────────────────────────────
export { signAccessToken, signRefreshToken, verifyToken } from "./jwt";
export type { AccessTokenPayload, RefreshTokenPayload } from "./jwt";

export { hashToken } from "./hash";

export {
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
} from "./cookies";

export {
  createSession,
  findValidSession,
  revokeSession,
  revokeSessionByRefreshHash,
  revokeAllUserSessions,
} from "./session";

export { 
  requireAuth, 
  requireRole, 
  requireOwnership, 
  requirePillarAccess,
  withAuth, 
  withRole, 
  withPillarAccess,
  AuthError 
} from "./guards";

export { apiFetch } from "./apiFetch";
