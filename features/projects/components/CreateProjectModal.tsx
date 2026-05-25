"use client";

import { useState } from "react";
import { createProject } from "../actions";
import FormModal from "@/components/ui/FormModal";

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
  pillars: { id: number; name: string; color: string }[];
}

export function CreateProjectModal({ onClose, onSuccess, pillars }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await createProject(formData);
    
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || "Ocurrió un error al crear el proyecto.");
    }
  };

  return (
    <FormModal
      onClose={onClose}
      title="Nuevo Proyecto"
      description="Inicia un nuevo proyecto asociado a un pilar."
      headerIcon={
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-brand-verde/10 text-brand-verde">
          🚀
        </div>
      }
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitLabel="Crear Proyecto"
    >
      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Nombre del Proyecto
        </label>
        <input
          required
          name="name"
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder-gray-500"
          placeholder="Ej. Reforestación Playa Hermosa"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Pilar
        </label>
        <select
          required
          name="pillarId"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 appearance-none"
        >
          <option value="">Selecciona un pilar...</option>
          {pillars.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Descripción
        </label>
        <textarea
          required
          name="description"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder-gray-500 resize-none"
          placeholder="Describe el propósito general del proyecto..."
        />
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Objetivos (Opcional)
        </label>
        <textarea
          name="objectives"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder-gray-500 resize-none"
          placeholder="Detalla los objetivos específicos..."
        />
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Foto del Proyecto (Opcional)
        </label>
        <input
          type="file"
          name="photoUrl"
          accept="image/*"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200 dark:hover:file:bg-gray-600 file:cursor-pointer file:transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Estado Inicial
          </label>
          <select
            required
            name="status"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 appearance-none"
            defaultValue="DRAFT"
          >
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="IN_PROGRESS">En Progreso</option>
          </select>
        </div>
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Visibilidad
          </label>
          <select
            required
            name="visibility"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 appearance-none"
            defaultValue="PUBLIC"
          >
            <option value="PUBLIC">Público</option>
            <option value="PRIVATE">Privado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Fecha de Inicio
          </label>
          <input
            type="date"
            name="startDate"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Fecha de Finalización
          </label>
          <input
            type="date"
            name="endDate"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>
      </div>
    </FormModal>
  );
}
