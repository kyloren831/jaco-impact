import { getVolunteerDashboardDataAction } from "@/features/users/actions";
import SubmitEvidenceModal from "@/components/dashboard/SubmitEvidenceModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function VolunteerDashboard() {
  const result = await getVolunteerDashboardDataAction();

  if (!result.success || !result.data) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600">
        No pudimos cargar tus datos de voluntario: {result.error}
      </div>
    );
  }

  const { tasks, participations } = result.data;

  const openTasks = tasks.filter(t => !["APPROVED", "SUBMITTED", "DECLINED", "CANCELLED"].includes(t.status));
  const upcomingEvents = participations.filter(p => new Date(p.event.eventDate) >= new Date());

  return (
    <div className="space-y-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tareas Asignadas */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-verde/10 rounded-xl flex items-center justify-center text-brand-verde">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Tareas Pendientes</h2>
        </div>
        
        {openTasks.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 text-center text-gray-500">
            No tienes tareas pendientes. ¡Buen trabajo!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openTasks.map(assignment => (
              <div key={assignment.taskId} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-verde group-hover:w-2 transition-all duration-300"></div>
                <div className="flex justify-between items-start mb-4 pl-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-verde/10 text-brand-verde">
                    {assignment.task.priority}
                  </span>
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">
                    {assignment.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 pl-2 mb-2">{assignment.task.title}</h3>
                {assignment.task.description && (
                  <p className="text-sm text-gray-500 pl-2 mb-4 line-clamp-2">{assignment.task.description}</p>
                )}
                <div className="pl-2 flex flex-col gap-2">
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Vence: {assignment.task.dueDate ? format(new Date(assignment.task.dueDate), "PPP", { locale: es }) : "Sin fecha"}
                  </p>
                  
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <SubmitEvidenceModal taskId={assignment.taskId} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mis Eventos */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-azul/10 rounded-xl flex items-center justify-center text-brand-azul">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Próximos Eventos</h2>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 text-center text-gray-500">
            No estás registrado en ningún evento próximo. ¡Únete a uno pronto!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(p => (
              <div key={p.eventId} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-24 bg-gradient-to-r from-brand-azul to-brand-turquesa"></div>
                <div className="p-6 relative -mt-8">
                  <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center font-bold text-brand-azul mb-4 text-sm border border-gray-100">
                    {format(new Date(p.event.eventDate), "d MMM", { locale: es })}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{p.event.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {p.event.location || "Ubicación por definir"}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-azul/10 text-brand-azul">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
