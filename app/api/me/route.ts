import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/guards";

export async function GET() {
  try {
    const payload = await requireAuth();

    return NextResponse.json({
      user: {
        id: Number(payload.sub),
        email: payload.email,
        role: payload.role,
        roles: payload.roles,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === "NO_TOKEN" ? 401
        : error.code === "INVALID_TOKEN" ? 401
        : 403;

      return NextResponse.json(
        { message: error.message, code: error.code },
        { status }
      );
    }

    console.error("[ME ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
