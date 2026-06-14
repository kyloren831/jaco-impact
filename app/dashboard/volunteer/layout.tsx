import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Volunteer Dashboard - Jacó Impact",
  description: "Panel de voluntariado",
};

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await requireAuth();
    const userRoles = session.roles ?? [session.role];
    if (!userRoles.includes("VOLUNTEER") && !userRoles.includes("ADMIN") && !userRoles.includes("COORDINATOR")) {
      redirect("/dashboard");
    }
  } catch (error) {
    redirect("/dashboard"); 
  }

  return <>{children}</>;
}
