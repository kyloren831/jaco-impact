import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, AuthError } from "@/lib/auth";
import type { AccessTokenPayload } from "@/lib/auth";

import VolunteerDashboard from "@/components/dashboard/VolunteerDashboard";

// ── Role-specific greeting & accent color ──────────────────────────
function getRoleConfig(roles: string[]) {
  if (roles.includes("ADMIN")) {
    return { label: "Administrador", accent: "text-brand-rosa" };
  }
  if (roles.includes("COORDINATOR")) {
    return { label: "Coordinador", accent: "text-brand-azul" };
  }
  if (roles.includes("MODERATOR")) {
    return { label: "Moderador", accent: "text-brand-turquesa" };
  }
  if (roles.includes("PYME_MANAGER")) {
    return { label: "Gestor PYME", accent: "text-brand-verde" };
  }
  // Default / VOLUNTEER
  return { label: "Voluntario", accent: "text-brand-turquesa" };
}

export default async function DashboardPage() {
  let user: AccessTokenPayload;

  try {
    user = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/login");
    }
    throw err;
  }

  const userRoles = user.roles ?? [user.role];
  const { label, accent } = getRoleConfig(userRoles);
  const isVolunteer = userRoles.includes("VOLUNTEER") || userRoles.includes("USER");

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-br from-brand-verde to-brand-verde-oscuro rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-brand-verde/30">
                Logo
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-azul-oscuro to-brand-azul">
                Jaco Impact Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {label}
              </span>
              <Link
                href="/api/auth/logout"
                className="text-sm font-medium text-gray-500 hover:text-brand-rosa transition-colors"
              >
                Cerrar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 p-8 text-center sm:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-gradient-to-br from-brand-turquesa/20 to-brand-azul/20 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-5xl tracking-tight relative z-10">
            ¡Hola, <span className={accent}>{(user as any).name || label}!</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl relative z-10">
            Bienvenido a tu panel de control. Aquí podrás gestionar tu actividad
            dentro de Jaco Impact. 
          </p>
        </div>

        {isVolunteer ? (
          <VolunteerDashboard />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Fallback para Administradores / Coordinadores por ahora */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 text-center text-gray-500 col-span-full">
              Panel de administración en construcción. Eres {label}.
            </div>
          </div>
        )}

      </main>
    </>
  );
}
