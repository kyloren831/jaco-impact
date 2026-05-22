"use client";

import { useState } from "react";
import EditRolesModal from "./EditRolesModal";
import CreateUserModal from "./CreateUserModal";
import { updateUserStatus } from "../actions";

// Tipos inferidos basados en el prisma select de actions.ts
type User = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  userRoles: { role: string }[];
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#1A7ABD",      // Educación Blue
  VOLUNTEER: "#EE933B",  // Social Orange
  COORDINATOR: "#45B85A",// Ambiente Green
  PYME_MANAGER: "#E4A92E",// Emprende Yellow
  MODERATOR: "#E539AB",   // Arte Pink
};

import ModuleHeader from "@/components/ui/ModuleHeader";

export default function UsersClientView({ initialUsers }: { initialUsers: User[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (user: User) => {
    if (confirm(`¿Estás seguro de que deseas ${user.isActive ? "desactivar" : "activar"} a ${user.name}?`)) {
      await updateUserStatus(user.id, !user.isActive);
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <ModuleHeader
        title="Gestión de Usuarios"
        description="Controla accesos, roles y estado de las cuentas."
        searchPlaceholder="Buscar por nombre o correo..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionLabel="Agregar Usuario"
        onActionClick={() => setIsCreating(true)}
      />

      {/* Glassmorphism Table Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-5">Usuario</th>
                <th className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-5">Roles</th>
                <th className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-5">Estado</th>
                <th className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-headline font-bold text-black border border-gray-200">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-body font-bold text-gray-900">{user.name}</p>
                        <p className="font-body text-xs font-medium text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {user.userRoles.length > 0 ? (
                        user.userRoles.map((ur) => (
                          <span
                            key={ur.role}
                            className="font-body text-[10px] font-bold px-2.5 py-1 rounded-md text-white shadow-sm"
                            style={{ backgroundColor: ROLE_COLORS[ur.role] || "#000" }}
                          >
                            {ur.role}
                          </span>
                        ))
                      ) : (
                        <span className="font-body text-[10px] font-bold px-2.5 py-1 rounded-md bg-gray-200 text-gray-600">SIN ROL</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <button
                      onClick={() => toggleStatus(user)}
                      className={`font-body text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                        user.isActive 
                          ? "bg-green-50 text-[#45B85A] hover:bg-green-100" 
                          : "bg-red-50 text-[#ED242E] hover:bg-red-100"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-[#45B85A]" : "bg-[#ED242E]"}`}></span>
                      {user.isActive ? "Activo" : "Suspendido"}
                    </button>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="font-body text-sm font-bold text-gray-600 hover:text-black bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all shadow-sm border border-gray-100"
                    >
                      Editar Roles
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="font-body font-medium text-gray-400">No se encontraron usuarios.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <EditRolesModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => setEditingUser(null)}
        />
      )}

      {isCreating && (
        <CreateUserModal
          onClose={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}
