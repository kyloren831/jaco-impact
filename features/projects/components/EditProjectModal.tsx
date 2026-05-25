"use client";

import { useState } from "react";
import { updateProject } from "../actions";
import FormModal from "@/components/ui/FormModal";

interface EditProjectModalProps {
  project: any;
  pillars: { id: number; name: string; color: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectModal({ project, pillars, onClose, onSuccess }: EditProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await updateProject(project.id, formData);
    
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || "Ocurrió un error al actualizar el proyecto.");
    }
  };

  const currentPillar = pillars.find(p => p.id === project.pillarId);

  // Formatear fechas para los inputs date
  const formatForInput = (dateStr: Date | string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  return (
    <FormModal
      onClose={onClose}
      title="Editar Proyecto"
      description={`Modificando información de ${project.name}`}
      headerIcon={
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
          style={{ 
            backgroundColor: currentPillar ? `${currentPillar.color}20` : '#f3f4f6', 
            color: currentPillar ? currentPillar.color : '#9ca3af' 
          }}
        >
          ✏️
        </div>
      }
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitLabel="Guardar Cambios"
    >
      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Nombre del Proyecto
        </label>
        <input
          required
          name="name"
          type="text"
          defaultValue={project.name}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Descripción
        </label>
        <textarea
          required
          name="description"
          rows={3}
          defaultValue={project.description}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 resize-none"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Objetivos
        </label>
        <textarea
          name="objectives"
          rows={3}
          defaultValue={project.objectives || ""}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 resize-none"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Foto del Proyecto
        </label>
        {project.photoUrl && (
          <div className="mb-2 flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <img
              src={project.photoUrl}
              alt="Foto actual"
              className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
            />
            <span className="font-body text-xs text-gray-500 dark:text-gray-400">Foto actual — selecciona una nueva para reemplazarla</span>
          </div>
        )}
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
            Estado
          </label>
          <select
            required
            name="status"
            defaultValue={project.status}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 appearance-none"
          >
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="COMPLETED">Completado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Visibilidad
          </label>
          <select
            required
            name="visibility"
            defaultValue={project.visibility}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 appearance-none"
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
            defaultValue={formatForInput(project.startDate)}
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
            defaultValue={formatForInput(project.endDate)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-verde focus:border-transparent transition-all font-body font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
        </div>
      </div>
    </FormModal>
  );
}
