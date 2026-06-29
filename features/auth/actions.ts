"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/hash";
import { setAuthCookies } from "@/lib/auth/cookies";
import { createSession } from "@/lib/auth/session";
import { LoginUserSchema } from "@/lib/validators";
import crypto from "crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";

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
      include: { userRoles: true, pillar: true },
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
      pillarId: user.pillar?.id,
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
  redirect("/dashboard");
}

const RegisterSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  phone: z.string().regex(/^\+?[0-9\s\-\(\)]{8,}$/, "El teléfono no tiene un formato válido"),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  profession: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  inmediateAvailability: z.string().optional(),
});

export async function registerAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      nationality: formData.get("nationality") as string,
      profession: formData.get("profession") as string,
      emergencyContactName: formData.get("emergencyContactName") as string,
      emergencyContactPhone: formData.get("emergencyContactPhone") as string,
      inmediateAvailability: formData.get("inmediateAvailability") as string,
    };

    const result = RegisterSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.errors[0]?.message || "Datos inválidos" };
    }

    const { name, email, password, phone, nationality, profession, emergencyContactName, emergencyContactPhone, inmediateAvailability } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "El correo ya está registrado" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          role: "VOLUNTEER",
        },
      });

      await tx.volunteer.create({
        data: {
          userId: user.id,
          phone,
          nationality,
          profession: profession || "No especificado",
          emergencyContactName: emergencyContactName || "No especificado",
          emergencyContactPhone: emergencyContactPhone || "No especificado",
          inmediateAvailability: inmediateAvailability === "true",
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  try {
    const payload = await requireAuth();
    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!oldPassword || !newPassword) {
      return { success: false, error: "Faltan campos requeridos" };
    }

    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const passwordValid = await bcrypt.compare(oldPassword, user.password);
    if (!passwordValid) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("[CHANGE PASSWORD ERROR]", error);
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    if (!email) {
      return { success: false, error: "Faltan campos requeridos" };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      console.log(`[MOCK EMAIL] Enlace de recuperación de contraseña para ${email}: /reset-password?token=${token}`);
    }

    return { success: true, message: "Si el correo existe, te hemos enviado un enlace" };
  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]", error);
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!token || !newPassword) {
      return { success: false, error: "Faltan campos requeridos" };
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: "Token inválido o expirado" };
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return { success: false, error: "Token expirado" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("[RESET PASSWORD ERROR]", error);
    return { success: false, error: "Error interno del servidor" };
  }
}
