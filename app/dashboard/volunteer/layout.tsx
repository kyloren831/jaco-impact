import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Volunteer Dashboard - Jacó Impact",
  description: "Panel de voluntariado",
};

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await requireAuth();
    const userRoles = session.roles ?? [session.role];
    if (!userRoles.includes("VOLUNTEER") && !userRoles.includes("ADMIN") && !userRoles.includes("COORDINATOR")) {
      redirect("/dashboard");
    }

    if (userRoles.includes("VOLUNTEER")) {
      const { prisma } = await import("@/lib/prisma");
      const volunteer = await prisma.volunteer.findUnique({
        where: { userId: session.userId }
      });

      if (!volunteer) {
        return (
          <div className="max-w-2xl mx-auto p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl shadow-sm mt-10">
            <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-800/50 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Falta completar tu perfil!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              Para poder acceder al panel de voluntario y participar en eventos y tareas, necesitamos que completes tu información personal.
            </p>
            <a 
              href="/dashboard/profile" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-verde text-white font-medium rounded-xl hover:bg-brand-verde/90 transition-all shadow-sm hover:shadow"
            >
              Completar mi perfil ahora
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        );
      }
    }
  } catch (error) {
    redirect("/dashboard"); 
  }

  return <>{children}</>;
}
