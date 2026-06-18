import { getProfileAction, getVolunteerAvailabilitiesAction } from "@/features/profile/actions";
import ProfileForm from "@/components/profile/ProfileForm";
import AvailabilitySection from "@/components/profile/AvailabilitySection";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mi Perfil | Jaco Impact",
  description: "Gestiona tu información personal",
};

export default async function ProfilePage() {
  const res = await getProfileAction();
  
  if (!res.success || !res.data) {
    redirect("/login");
  }

  const availabilitiesRes = await getVolunteerAvailabilitiesAction();
  const availabilities = availabilitiesRes.success && availabilitiesRes.data ? availabilitiesRes.data : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-black text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="font-body text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Gestiona tu información personal y preferencias
        </p>
      </div>
      
      <div className="mt-8">
        <ProfileForm initialData={res.data as any} />
      </div>

      {(res.data as any).roles.includes("VOLUNTEER") && (
        <AvailabilitySection availabilities={availabilities} />
      )}
    </div>
  );
}
