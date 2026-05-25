"use client";

import { useState, useEffect } from "react";
import { createEvent } from "../actions";
import { getProjects } from "@/features/projects/actions";
import FormModal from "@/components/ui/FormModal";

interface CreateEventModalProps {
  projectId?: number;
  status: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEventModal({ projectId, status, onClose, onSuccess }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) {
      getProjects().then(setProjects).catch(console.error);
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const selectedProjectId = projectId || Number(formData.get("projectId"));

    if (!selectedProjectId) {
      setError("Debes seleccionar un proyecto.");
      setLoading(false);
      return;
    }

    const res = await createEvent(formData, selectedProjectId, status);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || "Error al crear el evento.");
      setLoading(false);
    }
  };

  return (
    <FormModal
      onClose={onClose}
      title="Nuevo Evento"
      description="Completa los detalles para crear un nuevo evento en este proyecto."
      onSubmit={handleSubmit}
      loading={loading}
      error={error || undefined}
      submitLabel="Crear Evento"
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-5">
        {!projectId && (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Proyecto *</label>
            <select
              name="projectId"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Selecciona un proyecto...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Evento *</label>
          <input
            name="name"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Ej. Jornada de Limpieza"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all resize-none font-body text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Detalles sobre el evento (opcional)..."
          ></textarea>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Fecha Principal *</label>
          <input
            type="datetime-local"
            name="eventDate"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Ubicación</label>
          <input
            name="location"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Lugar del evento"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Voluntarios Necesarios</label>
          <input
            type="number"
            name="volunteersNeeded"
            min="0"
            defaultValue="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="0 para sin límite"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Visibilidad</label>
          <select
            name="visibility"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100"
          >
            <option value="PUBLIC">Público</option>
            <option value="PRIVATE">Privado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Fecha Inicio (Opcional)</label>
          <input
            type="datetime-local"
            name="startDate"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Fecha Fin (Opcional)</label>
          <input
            type="datetime-local"
            name="endDate"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-verde/50 focus:border-brand-verde transition-all font-body text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </FormModal>
  );
}
