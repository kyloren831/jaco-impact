import { getProjectById } from "@/features/projects/actions";
import { EventsClientView } from "@/features/events/components/EventsClientView";

export const metadata = {
  title: "Eventos y Tareas | Jacó Impact",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const params = await searchParams;
  const projectId = params.projectId ? Number(params.projectId) : null;

  let project = null;
  if (projectId) {
    project = await getProjectById(projectId);
  }

  return <EventsClientView project={project} />;
}
