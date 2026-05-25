import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard - Jacó Impact",
  description: "Panel de administración",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await requireAuth();
    const userRoles = session.roles ?? [session.role];
    if (!userRoles.includes("ADMIN") && !userRoles.includes("COORDINATOR")) {
      redirect("/dashboard");
    }
  } catch (error) {
    redirect("/dashboard"); 
  }

  return (
    <div className="flex flex-1">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 pt-14 md:p-8 md:pt-[100px]">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
