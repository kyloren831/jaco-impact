import { getUsers } from "@/features/users/actions";
import UsersClientView from "@/features/users/components/UsersClientView";

export const metadata = {
  title: "Gestión de Usuarios - Jacó Impact",
};

export default async function UsersPage() {
  // getUsers ya tiene requireRole("ADMIN") adentro
  const users = await getUsers();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap');
        .font-headline { font-family: 'Nunito', sans-serif; }
        .font-body { font-family: 'Montserrat', sans-serif; }
      `}} />
      <UsersClientView initialUsers={users} />
    </>
  );
}
