"use client";

import { useState } from "react";
import { submitEvidenceAction } from "@/features/evidences/actions";
import { useRouter } from "next/navigation";

export default function SubmitEvidenceModal({ taskId }: { taskId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("taskId", taskId.toString());

    const result = await submitEvidenceAction(formData);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error || "Error al subir evidencia");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand-verde px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-verde-oscuro transition-colors duration-200"
      >
        Subir Evidencia
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 id="modal-title" className="text-lg font-bold text-gray-900">Subir Evidencia de Tarea</h3>
              <button
                aria-label="Cerrar"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo (Imagen/Documento)
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-verde/10 file:text-brand-verde hover:file:bg-brand-verde/20 transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-verde focus:ring-brand-verde sm:text-sm"
                  placeholder="Añade un comentario sobre tu evidencia..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-lg bg-brand-verde px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-verde-oscuro transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Subiendo..." : "Subir Evidencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
