"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", href: "/dashboard/admin", icon: DashboardIcon },
  { name: "Usuarios", href: "/dashboard/admin/users", icon: UsersIcon },
  { name: "Pilares", href: "/dashboard/admin/pillars", icon: LayersIcon },
  { name: "Voluntarios", href: "/dashboard/admin/volunteers", icon: HeartIcon },
  { name: "Proyectos", href: "/dashboard/admin/projects", icon: CalendarIcon },
  { name: "Eventos y Tareas", href: "/dashboard/admin/events", icon: CheckCircleIcon },
  { name: "Noticias", href: "/dashboard/admin/news", icon: NewspaperIcon },
  { name: "Pymes y Productos", href: "/dashboard/admin/pymes", icon: StoreIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 border-b bg-white flex justify-between items-center fixed top-20 left-0 right-0 z-40 shadow-sm">
        <span className="font-semibold text-gray-700">Menú Administrativo</span>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-gray-100 rounded-md text-gray-600 focus:outline-none"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-[72px] left-0 z-30 h-[calc(100vh-72px)] w-64 bg-white border-r border-gray-200 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-6">
            Administración
          </h2>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive
                      ? "bg-brand-verde/10 text-brand-verde"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-brand-verde" : "text-gray-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

// --- Minimal Inline SVGs (Fallback for lucide-react) ---
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function NewspaperIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
}
function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
}
function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11l-7 4-7-4m14-3l-7 4-7-4m14 6l-7 4-7-4m7-10l-7 4-7-4 7-4 7 4z" /></svg>;
}
