import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, AuthError } from "@/lib/auth";
import type { AccessTokenPayload } from "@/lib/auth";

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-4">
              <div className="h-10 w-10 bg-brand-verde rounded-full flex items-center justify-center text-white font-bold text-xs">
                Logo
              </div>
              <h1 className="text-xl font-bold text-brand-azul-oscuro">
                Jaco Impact Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {label}
              </span>
              <Link
                href="/api/auth/logout"
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cerrar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            ¡Hola, <span className={accent}>{label}!</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            Bienvenido a tu panel de control. Aquí podrás gestionar tu actividad
            dentro de Jaco Impact. El contenido de este panel se adapta a tu rol.
          </p>

          {/* Placeholder cards — se llenarán según el rol en el futuro */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card: Próximos Eventos */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-verde/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Próximos Eventos</h3>
              <p className="mt-2 text-sm text-gray-500">
                Mantente al tanto de las próximas limpiezas de playa y talleres educativos.
              </p>
            </div>

            {/* Card: Mi Impacto */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-azul/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-azul" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Mi Impacto</h3>
              <p className="mt-2 text-sm text-gray-500">
                Revisa las horas de voluntariado que has acumulado y tu contribución anual.
              </p>
            </div>

            {/* Card: Recursos */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-rosa/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-rosa" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Recursos</h3>
              <p className="mt-2 text-sm text-gray-500">
                Accede a guías y material educativo para mejorar tus habilidades.
              </p>
            </div>
          </div>

          {/* Role indicator for debugging — remove later */}
          <p className="mt-8 text-xs text-gray-400">
            Roles actuales: {userRoles.join(", ")}
          </p>
        </div>
      </main>
    </div>
  );
}
