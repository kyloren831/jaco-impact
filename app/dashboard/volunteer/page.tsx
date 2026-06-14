import { getVolunteerDashboardDataAction } from "@/features/users/actions";
import Link from "next/link";

export default async function VolunteerDashboardPage() {
  const data = await getVolunteerDashboardDataAction();

  if (!data.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar el panel de voluntario: {data.error}
      </div>
    );
  }

  const { tasks, participations } = data.data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido, Voluntario</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Este es tu panel de control. Aquí puedes ver un resumen de tus participaciones y tareas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Mis Eventos (Inscripciones)</h2>
          {participations.length === 0 ? (
            <p className="text-gray-500">No estás inscrito en ningún evento todavía.</p>
          ) : (
            <ul className="space-y-3">
              {participations.map((p: any) => (
                <li key={p.id} className="border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="font-semibold">{p.event.title}</span> - Estado: {p.status}
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/volunteer/events" className="mt-4 inline-block text-brand-verde hover:underline">
            Ver eventos disponibles &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Mis Tareas Asignadas</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tienes tareas asignadas.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t: any) => (
                <li key={t.id} className="border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="font-semibold">{t.task.title}</span> (Evento: {t.task.event.title}) - Estado: {t.status}
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/volunteer/tasks" className="mt-4 inline-block text-brand-verde hover:underline">
            Ver mis tareas &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
