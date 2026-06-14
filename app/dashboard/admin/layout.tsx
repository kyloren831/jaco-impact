import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";

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

  return <>{children}</>;
}
