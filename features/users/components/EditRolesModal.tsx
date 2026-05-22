"use client";

import { useState } from "react";
import { updateUserRoles } from "../actions";

const AVAILABLE_ROLES = ["ADMIN", "COORDINATOR", "MODERATOR", "VOLUNTEER", "PYME_MANAGER"];

import Modal from "@/components/ui/Modal";

interface Props {
  user: { id: number; name: string; userRoles: { role: string }[] };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRolesModal({ user, onClose, onSuccess }: Props) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user.userRoles.map((r) => r.role)
  );
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateUserRoles(user.id, selectedRoles);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      alert(res.error);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Editar Roles"
      description={
        <>Configurando accesos para <span className="font-bold text-black">{user.name}</span></>
      }
      maxWidth="max-w-md"
    >
      <div className="p-8 space-y-4">
          {AVAILABLE_ROLES.map((role) => (
            <label
              key={role}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedRoles.includes(role)
                  ? "border-[#1A7ABD] bg-[#1A7ABD]/5"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    selectedRoles.includes(role) ? "bg-[#1A7ABD]" : "bg-gray-200"
                  }`}
                >
                  {selectedRoles.includes(role) && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-body font-semibold text-gray-800">{role}</span>
            </label>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-body font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-full font-body font-bold text-white bg-black hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
      </div>
    </Modal>
  );
}
