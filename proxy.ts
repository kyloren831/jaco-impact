import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy de protección de rutas (Next.js 16).
 *
 * Solo verifica la PRESENCIA de la cookie access_token.
 * NO verifica la firma — eso se hace en los guards del server-side.
 * Esto evita lógica pesada en el proxy y lo mantiene rápido.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas protegidas
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/volunteer");

  if (!isProtected) {
    return NextResponse.next();
  }

  // Verificar presencia de access_token cookie
  const accessToken = request.cookies.get("access_token");

  if (!accessToken?.value) {
    // Redirigir a login con returnUrl para volver después
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Solo ejecutar en rutas que nos interesan
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/volunteer/:path*"],
};
