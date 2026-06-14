import { getVolunteerTasksAction } from "@/features/volunteer/actions";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import VolunteerTasksDashboard from "@/components/dashboard/VolunteerTasksDashboard";

export const metadata = {
  title: "Mis Tareas | Jacó Impact",
};

export default async function VolunteerTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const params = await searchParams;
  const eventId = params.eventId ? parseInt(params.eventId) : undefined;

  // Require user to be a volunteer
  const session = await requireRole(["VOLUNTEER"]);

  // Lookup volunteer details to get the DB id
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });

  if (!volunteer) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600">
        Perfil de voluntario no encontrado.
      </div>
    );
  }

  // Fetch all tasks for the events this volunteer is registered to
  const result = await getVolunteerTasksAction(eventId);

  if (!result.success || !result.data) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600">
        Error al cargar las tareas: {result.error}
      </div>
    );
  }

  return (
    <VolunteerTasksDashboard
      tasks={result.data}
      volunteerId={volunteer.id}
      userId={session.userId}
      userName={volunteer.user.name}
      selectedEventId={eventId}
    />
  );
}
