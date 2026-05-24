"use client";

import { useState } from "react";
import { updateUserRoles } from "../actions";

const AVAILABLE_ROLES = ["ADMIN", "COORDINATOR", "MODERATOR", "VOLUNTEER", "PYME_MANAGER"];

import FormModal from "@/components/ui/FormModal";

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
  const [error, setError] = useState("");

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await updateUserRoles(user.id, selectedRoles);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || "Ocurrió un error al actualizar los roles.");
    }
  };

  return (
    <FormModal
      onClose={onClose}
      title="Editar Roles"
      description={
        <>Configurando accesos para <span className="font-bold text-black">{user.name}</span></>
      }
      maxWidth="max-w-md"
      onSubmit={handleSave}
      loading={loading}
      error={error}
      submitLabel="Guardar Cambios"
    >
      <div className="space-y-4">
        {AVAILABLE_ROLES.map((role) => (
          <label
            key={role}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedRoles.includes(role)
                ? "border-black bg-black/5"
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
                  selectedRoles.includes(role) ? "bg-black" : "bg-gray-200"
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
    </FormModal>
  );
}
