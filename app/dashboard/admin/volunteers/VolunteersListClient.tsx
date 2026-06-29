"use client";

import { useState, useTransition } from "react";
import Image from 'next/image';
import { toggleVolunteerStatusAction } from "@/features/admin/volunteers/actions";
import Link from "next/link";
import { User, Mail, Phone, ShieldCheck, ShieldAlert, ArrowRight, Loader2, Search } from "lucide-react";

export default function VolunteersListClient({ initialVolunteers }: { initialVolunteers: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filteredVolunteers = volunteers.filter((v: any) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    setLoadingId(id);
    startTransition(async () => {
      const res = await toggleVolunteerStatusAction(id, !currentStatus);
      if (res.success) {
        setVolunteers(prev => prev.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v));
      } else {
        alert(res.error || "Error al cambiar el estado");
      }
      setLoadingId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
          placeholder="Buscar por nombre o correo..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVolunteers.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            {/* Status indicator line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow-sm">
                  {user.imageUrl ? (
                    <Image src={user.imageUrl} alt={user.name} width={400} height={300} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-2 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{user.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {user.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleStatus(user.id, user.isActive)}
                disabled={loadingId === user.id}
                className={`p-2 rounded-xl transition-colors ${
                  user.isActive 
                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50' 
                    : 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                }`}
                title={user.isActive ? "Desactivar" : "Activar"}
              >
                {loadingId === user.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : user.isActive ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.volunteers?.phone || "No registrado"}</span>
              </div>
            </div>

            {/* Skills / Interests */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="flex flex-wrap gap-2">
                {user.volunteers?.skills && user.volunteers.skills.length > 0 ? (
                  user.volunteers.skills.slice(0, 3).map((s: any) => (
                    <span key={s.id} className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      {s.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin intereses registrados</span>
                )}
                {user.volunteers?.skills && user.volunteers.skills.length > 3 && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
                    +{user.volunteers.skills.length - 3}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/dashboard/admin/volunteers/${user.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium text-sm group-hover:bg-blue-50 group-hover:text-blue-700 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400 border border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30"
              >
                Ver Perfil
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}

        {filteredVolunteers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No se encontraron voluntarios.
          </div>
        )}
      </div>
    </div>
  );
}
