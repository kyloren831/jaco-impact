import { getVolunteerDetailAction } from "@/features/admin/volunteers/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { User, Mail, Phone, MapPin, Briefcase, Heart, Clock, AlertCircle, ArrowLeft, Calendar, ClipboardList, ShieldCheck, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Detalle de Voluntario | Jacó Impact",
};

export default async function VolunteerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) notFound();

  const res = await getVolunteerDetailAction(userId);
  
  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl">
        Error: {res.error || "Voluntario no encontrado"}
      </div>
    );
  }

  const user = res.data;
  const volunteer = user.volunteers;

  if (!volunteer) {
    return (
      <div className="p-8 text-center text-gray-500">
        Este usuario no tiene un perfil de voluntario.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/admin/volunteers"
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white font-headline">Perfil de Voluntario</h1>
          <p className="text-sm text-gray-500 font-medium">Visualización de datos y registro de actividades</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
        
        <div className="relative px-8 pb-8 pt-16 sm:px-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 flex-shrink-0">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-medium">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {user.isActive ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4" /> {user.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4" /> {volunteer.phone || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Personal Info */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Datos Personales
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nacionalidad</span>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {volunteer.nationality || "No especificada"}
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Profesión</span>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {volunteer.profession || "No especificada"}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Contacto de Emergencia
              </h4>
              <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{volunteer.emergencyContactName || "No registrado"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  {volunteer.emergencyContactPhone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Interests & Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Intereses
            </h3>
            <div className="flex flex-wrap gap-2">
              {volunteer.skills && volunteer.skills.length > 0 ? (
                volunteer.skills.map((skill: any) => (
                  <span key={skill.id} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 rounded-lg text-sm font-medium">
                    {skill.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No ha registrado intereses.</p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Disponibilidad
            </h3>
            
            {volunteer.inmediateAvailability && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Disponibilidad Inmediata
              </div>
            )}

            <div className="space-y-3">
              {volunteer.availability && volunteer.availability.length > 0 ? (
                volunteer.availability.map((av: any) => (
                  <div key={av.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {new Date(av.startDate).toLocaleDateString()} - {new Date(av.endDate).toLocaleDateString()}
                    </div>
                    {av.notes && <p className="text-xs text-gray-500 mt-1.5">{av.notes}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No hay fechas registradas.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Events History */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-500" />
              Historial de Eventos
            </h3>
            
            {volunteer.participations && volunteer.participations.length > 0 ? (
              <div className="space-y-4">
                {volunteer.participations.map((part: any) => (
                  <div key={part.eventId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-gray-200 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{part.event.name}</h4>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(part.event.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                        {part.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                Aún no ha participado en eventos.
              </div>
            )}
          </div>

          {/* Tasks History */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-teal-500" />
              Tareas Asignadas
            </h3>
            
            {volunteer.assignments && volunteer.assignments.length > 0 ? (
              <div className="space-y-4">
                {volunteer.assignments.map((assignment: any) => (
                  <div key={assignment.taskId} className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{assignment.task.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">Asignada el {new Date(assignment.assignedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50">
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                Aún no tiene tareas asignadas.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
