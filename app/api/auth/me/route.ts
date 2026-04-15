import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/guards";

export async function GET() {
  try {
    const payload = await requireAuth();

    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        roles: payload.roles,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
