"use client";

import { useState } from "react";
import { createProject } from "../actions";
import Modal from "@/components/ui/Modal";

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
    <Modal
      onClose={onClose}
      title="Nuevo Proyecto"
      description="Inicia un nuevo proyecto asociado a un pilar."
      headerIcon={
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-brand-verde/10 text-brand-verde">
          🚀
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-body font-medium border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Nombre del Proyecto
          </label>
          <input
            required
            name="name"
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white appearance-none"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400 resize-none"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400 resize-none"
            placeholder="Detalla los objetivos específicos..."
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white appearance-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white appearance-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Fecha de Finalización
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-body font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-body font-bold text-white bg-black hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </>
            ) : (
              "Crear Proyecto"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
