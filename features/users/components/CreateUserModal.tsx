"use client";

import { useState } from "react";
import { createUser } from "../actions";
import Modal from "@/components/ui/Modal";

const AVAILABLE_ROLES = ["ADMIN", "COORDINATOR", "MODERATOR", "VOLUNTEER", "PYME_MANAGER"];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VOLUNTEER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await createUser({ name, email, password, role });
    
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || "Ocurrió un error");
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Nuevo Usuario"
      description="Agrega manualmente un miembro al sistema."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Nombre Completo
          </label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A7ABD] focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Correo Electrónico
          </label>
          <input
            required
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A7ABD] focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@ejemplo.com"
          />
        </div>

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Contraseña
          </label>
          <input
            required
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A7ABD] focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Rol Principal
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A7ABD] focus:border-transparent transition-all font-body font-semibold text-gray-900 bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {AVAILABLE_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-body font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-full font-body font-bold text-white bg-[#1A7ABD] hover:bg-[#155F93] transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
