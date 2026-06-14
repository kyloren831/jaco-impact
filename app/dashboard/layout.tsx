import { requireAuth } from "@/lib/auth/guards";
import UserDropdown from "@/components/admin/UserDropdown";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireAuth();
  } catch (error) {
    redirect("/login");
  }

  const userRoles = session.roles ?? [session.role];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans transition-colors duration-300">
      <DashboardSidebar roles={userRoles} />
      
      <div className="flex-1 flex flex-col relative overflow-x-hidden p-4 pt-14 md:p-8 md:pt-[100px]">
        {/* We can put UserDropdown in the header here or leave it inside children if preferred. 
            For now, let's keep it here but align it properly if needed. 
            Actually, the UserDropdown was floating before. Let's place it at top right. */}
        <div className="absolute top-4 right-4 z-50">
          <UserDropdown user={session as any} />
        </div>
        
        <main className="mx-auto max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
