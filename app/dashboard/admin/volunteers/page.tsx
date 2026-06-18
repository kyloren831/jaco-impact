import { getVolunteersListAction } from "@/features/admin/volunteers/actions";
import VolunteersListClient from "./VolunteersListClient";

export const metadata = {
  title: "Gestión de Voluntarios | Jaco Impact",
  description: "Administra los voluntarios de la organización",
};

export default async function AdminVolunteersPage() {
  const res = await getVolunteersListAction();

  if (!res.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar los voluntarios: {res.error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white font-headline">Voluntarios</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium font-body">
          Gestión de voluntarios de Jaco Impact
        </p>
      </div>

      <VolunteersListClient initialVolunteers={res.data || []} />
    </div>
  );
}
