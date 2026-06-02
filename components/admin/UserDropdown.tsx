"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface UserDropdownProps {
  user: {
    name: string;
    email: string;
    imageUrl: string | null;
    userRoles: { role: string }[];
  };
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "US";
  const roleName = user?.userRoles?.[0]?.role || "Usuario";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      console.error("Error al cerrar sesión");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="fixed top-4 right-6 z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-brand-verde text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden border-2 border-white focus:outline-none focus:ring-2 focus:ring-brand-verde focus:ring-offset-2"
        aria-label="Menú de usuario"
      >
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt={user.name} width={44} height={44} className="object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">{roleName}</p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-verde/10 hover:text-brand-verde transition-colors"
            >
              Ver Perfil
            </Link>
            <Link
              href="/dashboard/profile/password"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-verde/10 hover:text-brand-verde transition-colors"
            >
              Cambiar Contraseña
            </Link>
            <ThemeToggle />
            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="block w-full text-left px-4 py-2.5 text-sm text-brand-rojo hover:bg-brand-rojo/10 transition-colors font-semibold disabled:opacity-50"
            >
              {loggingOut ? "Saliendo..." : "Cerrar Sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
