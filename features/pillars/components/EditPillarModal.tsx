"use client";

import { useState } from "react";
import { updatePillar } from "../actions";

import Modal from "@/components/ui/Modal";

interface Props {
  pillar: any;
  coordinators: { id: number; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPillarModal({ pillar, coordinators, onClose, onSuccess }: Props) {
  const [name, setName] = useState(pillar.name);
  const [description, setDescription] = useState(pillar.description);
  const [icon, setIcon] = useState<File | null>(null);
  const [color, setColor] = useState(pillar.color);
  const [coordinatorId, setCoordinatorId] = useState<number>(pillar.coordinatorId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorId) {
      setError("Debes seleccionar un coordinador.");
      return;
    }
    
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("color", color);
    formData.append("coordinatorId", coordinatorId.toString());
    if (icon) {
      formData.append("icon", icon);
    }

    const res = await updatePillar(pillar.id, formData);
    
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || "Ocurrió un error al actualizar");
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Editar Pilar"
      description={`Modificando ${pillar.name}`}
      headerIcon={
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-gray-100 overflow-hidden" style={{ borderColor: color, borderWidth: (pillar.iconUrl?.startsWith('http') || pillar.iconUrl?.startsWith('/') || pillar.iconUrl?.startsWith('data:image')) ? 2 : 0 }}>
          {(pillar.iconUrl?.startsWith('http') || pillar.iconUrl?.startsWith('/') || pillar.iconUrl?.startsWith('data:image')) ? (
            <img src={pillar.iconUrl} alt={pillar.name} className="w-full h-full object-contain p-2 drop-shadow-sm" />
          ) : (
            pillar.iconUrl || <span style={{ color }}>{pillar.name.charAt(0)}</span>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Nombre del Pilar
          </label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium text-gray-900 bg-white placeholder:text-gray-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Descripción Corta
          </label>
          <textarea
            required
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium resize-none text-gray-900 bg-white placeholder:text-gray-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Nueva Imagen (Opcional)
            </label>
            <div className="relative w-full h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-black transition-colors flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setIcon(e.target.files?.[0] || null)}
              />
              <span className="font-body text-sm font-semibold text-gray-500 truncate px-4 pointer-events-none">
                {icon ? icon.name : "Cambiar imagen..."}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Color Representativo
            </label>
            <div className="flex items-center gap-3">
              <input
                required
                type="color"
                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <input
                required
                type="text"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-medium uppercase text-gray-900 bg-white placeholder:text-gray-400"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Coordinador
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-body font-semibold text-gray-900 bg-white"
            value={coordinatorId}
            onChange={(e) => setCoordinatorId(Number(e.target.value))}
            required
          >
            <option value="" disabled>Selecciona un coordinador</option>
            {coordinators.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
            className="px-6 py-2.5 rounded-full font-body font-bold text-white hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: color }}
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
