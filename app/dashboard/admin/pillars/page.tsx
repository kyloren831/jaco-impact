import { getPillars } from "@/features/pillars/actions";
import { getUsers } from "@/features/users/actions";
import PillarsClientView from "@/features/pillars/components/PillarsClientView";

export const metadata = {
  title: "Gestión de Pilares - Jacó Impact",
};

export default async function PillarsPage() {
  // Ambas acciones ya validan que el usuario tenga rol ADMIN
  const pillars = await getPillars();
  const allUsers = await getUsers();

  // Filtramos solo los usuarios que tienen el rol COORDINATOR o ADMIN para el dropdown
  const coordinators = allUsers
    .filter((u) => u.isActive && u.userRoles.some((r) => r.role === "COORDINATOR" || r.role === "ADMIN"))
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap');
        .font-headline { font-family: 'Nunito', sans-serif; }
        .font-body { font-family: 'Montserrat', sans-serif; }
      `}} />
      <PillarsClientView initialPillars={pillars} coordinators={coordinators} />
    </>
  );
}
