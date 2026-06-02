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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
      <div className="flex-1 flex flex-col relative">
        {user && <UserDropdown user={user} />}
        {children}
      </div>
    </div>
  );
}
