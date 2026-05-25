import { getCurrentUserAction } from "@/features/users/actions";
import UserDropdown from "@/components/admin/UserDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userResult = await getCurrentUserAction();
  const user = userResult.success ? userResult.data : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 flex flex-col relative">
        {user && <UserDropdown user={user} />}
        {children}
      </div>
    </div>
  );
}
