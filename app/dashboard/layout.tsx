import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar variant="dashboard" />
      <div className="flex-1 flex flex-col pt-[72px]">
        {children}
      </div>
    </div>
  );
}
