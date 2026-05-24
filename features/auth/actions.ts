"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/hash";
import { setAuthCookies } from "@/lib/auth/cookies";
import { createSession } from "@/lib/auth/session";
import { LoginUserSchema } from "@/lib/validators";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  let primaryRole = "VOLUNTEER";

  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = LoginUserSchema.safeParse({ email, password });

    if (!result.success) {
      return { success: false, error: "Datos inválidos" };
    }

    // ── Buscar usuario con roles ────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: result.data.email },
      include: { userRoles: true },
    });

    if (!user) {
      return { success: false, error: "Credenciales inválidas" };
    }

    // ── Verificar que el usuario está activo ────────────────────
    if (!user.isActive) {
      return { success: false, error: "Cuenta desactivada" };
    }

    // ── Validar password ────────────────────────────────────────
    const passwordValid = await bcrypt.compare(result.data.password, user.password);

    if (!passwordValid) {
      return { success: false, error: "Credenciales inválidas" };
    }

    // ── Extraer roles ───────────────────────────────────────────
    const roles = user.userRoles.map((ur) => ur.role);
    primaryRole = roles[0] ?? "VOLUNTEER";

    // ── Generar tokens ──────────────────────────────────────────
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: primaryRole,
      roles,
    });

    const refreshToken = await signRefreshToken({
      sub: user.id,
    });

    // ── Guardar sesión en DB (hash del refresh) ─────────────────
    const refreshHash = hashToken(refreshToken);

    // Extraer metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? undefined;
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      undefined;

    await createSession(user.id, refreshHash, { userAgent, ip });

    // ── Setear cookies HttpOnly ─────────────────────────────────
    await setAuthCookies(accessToken, refreshToken);

  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return { success: false, error: "Error interno del servidor" };
  }

  // Next.js requires redirect() to be called OUTSIDE of try/catch blocks
  // because it throws a specific error to halt execution and perform the redirect.
  if (primaryRole === "ADMIN") {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard");
  }
}
