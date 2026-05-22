import { getProjects } from "@/features/projects/actions";
import { getPillars } from "@/features/pillars/actions";
import { ProjectsClientView } from "@/features/projects/components/ProjectsClientView";

export const metadata = {
  title: "Proyectos | Jacó Impact",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  const pillars = await getPillars();

  return (
    <ProjectsClientView 
      projects={projects} 
      pillars={pillars.map(p => ({ id: p.id, name: p.name, color: p.color }))} 
    />
  );
}
