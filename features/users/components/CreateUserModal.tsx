"use client";

import { useState } from "react";
import { createUser } from "../actions";
import FormModal from "@/components/ui/FormModal";

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <FormModal
      onClose={onClose}
      title="Nuevo Usuario"
      description="Agrega manualmente un miembro al sistema."
      maxWidth="max-w-md"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitLabel="Crear Usuario"
    >
      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Nombre Completo
        </label>
        <input
          required
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder-gray-500"
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder-gray-500"
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder-gray-500"
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {AVAILABLE_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </FormModal>
  );
}
