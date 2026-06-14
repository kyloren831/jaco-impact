import { getVolunteerEventsAction } from "@/features/volunteer/actions";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import RegisterEventButton from "@/components/volunteer/RegisterEventButton";
import Link from "next/link";

export default async function VolunteerEventsPage() {
  const session = await requireAuth();
  
  // Obtener el ID del voluntario para cruzar datos
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: session.userId },
  });

  const result = await getVolunteerEventsAction();

  if (!result.success) {
    return <div className="p-8 text-red-500">Error: {result.error}</div>;
  }

  const events = result.data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Eventos Abiertos</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Inscríbete a los eventos disponibles y colabora con Jacó Impact.
      </p>

      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500">No hay eventos abiertos en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => {
            const isRegistered = volunteer && event.participations.some((p: any) => p.volunteerId === volunteer.id);

            return (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
                <div className="text-xs font-bold text-brand-turquesa mb-2 uppercase">{event.project.name}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{event.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                  {event.description}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <div><strong>Fecha:</strong> {new Date(event.startDate).toLocaleDateString()}</div>
                  <div><strong>Lugar:</strong> {event.location}</div>
                </div>

                <div className="mt-auto">
                  {isRegistered ? (
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center font-semibold text-sm">
                        Ya estás inscrito
                      </div>
                      <Link 
                        href={`/dashboard/volunteer/tasks?eventId=${event.id}`}
                        className="text-center text-sm font-bold text-brand-verde hover:underline"
                      >
                        Ver Tareas del Evento
                      </Link>
                    </div>
                  ) : (
                    <RegisterEventButton eventId={event.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
