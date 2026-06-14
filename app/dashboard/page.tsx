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
    <div className="space-y-8">
      <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 p-8 text-center sm:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-gradient-to-br from-brand-turquesa/20 to-brand-azul/20 rounded-full blur-3xl"></div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-5xl tracking-tight relative z-10">
          ¡Hola, <span className={accent}>{(user as any).name || label}!</span>
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl relative z-10">
          Bienvenido a tu panel de control. Aquí podrás gestionar tu actividad
          dentro de Jaco Impact. Utiliza el menú lateral para navegar por las distintas secciones.
        </p>
      </div>

      {isVolunteer && <VolunteerDashboard />}

      {!isVolunteer && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Panel de Gestión</h3>
            <p className="text-gray-500 mb-4">
              Como {label}, tienes acceso a herramientas de gestión en el menú lateral.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
