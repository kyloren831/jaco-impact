import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────
interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

// ── Create session ─────────────────────────────────────────────────
export async function createSession(
  userId: number,
  refreshTokenHash: string,
  meta?: SessionMeta
) {
  // Refresh token expira en 7 días
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return prisma.session.create({
    data: {
      userId,
      refreshHash: refreshTokenHash,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
      revoked: false,
      expiresAt,
    },
  });
}

// ── Find valid (non-revoked, non-expired) session ──────────────────
export async function findValidSession(
  userId: number,
  refreshTokenHash: string
) {
  return prisma.session.findFirst({
    where: {
      userId,
      refreshHash: refreshTokenHash,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });
}

// ── Revoke by session ID ───────────────────────────────────────────
export async function revokeSession(sessionId: number) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { revoked: true },
  });
}

// ── Revoke by refresh hash ─────────────────────────────────────────
export async function revokeSessionByRefreshHash(refreshTokenHash: string) {
  // updateMany porque refreshHash no es @unique
  return prisma.session.updateMany({
    where: { refreshHash: refreshTokenHash, revoked: false },
    data: { revoked: true },
  });
}

// ── Revoke ALL sessions for a user (reuse attack / force logout) ───
export async function revokeAllUserSessions(userId: number) {
  return prisma.session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
