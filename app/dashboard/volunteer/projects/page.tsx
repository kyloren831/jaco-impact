import { getVolunteerProjectsAction } from "@/features/volunteer/actions";
import Image from 'next/image';
import Link from "next/link";

export default async function VolunteerProjectsPage() {
  const result = await getVolunteerProjectsAction();

  if (!result.success) {
    return <div className="p-8 text-red-500">Error: {result.error}</div>;
  }

  const projects = result.data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proyectos Activos</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Descubre los proyectos en los que puedes colaborar.
      </p>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500">No hay proyectos disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              {project.photoUrl ? (
                <Image src={project.photoUrl} alt={project.name} width={400} height={300} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  Sin Imagen
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-bold text-brand-verde mb-2 uppercase">{project.pillar.name}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{project.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                  {project.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-medium text-gray-600 dark:text-gray-300">
                    {project.status}
                  </span>
                  <Link
                    href={`/dashboard/volunteer/events`} // De momento lo mandamos a ver todos los eventos
                    className="text-sm font-bold text-brand-verde hover:text-brand-turquesa transition-colors"
                  >
                    Ver Eventos
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
