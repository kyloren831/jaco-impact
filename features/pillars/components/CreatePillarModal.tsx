"use client";

import { useState } from "react";
import { createPillar } from "../actions";

import FormModal from "@/components/ui/FormModal";

interface Props {
  coordinators: { id: number; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePillarModal({ coordinators, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<File | null>(null);
  const [color, setColor] = useState("#45B85A");
  const [coordinatorId, setCoordinatorId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!coordinatorId) {
      setError("Debes seleccionar un coordinador.");
      return;
    }
    if (!icon) {
      setError("Debes seleccionar una imagen para el ícono.");
      return;
    }
    
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("color", color);
    formData.append("coordinatorId", coordinatorId.toString());
    formData.append("isActive", "true");
    formData.append("icon", icon);

    const res = await createPillar(formData);
    
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
      title="Nuevo Pilar"
      description="Registra una nueva rama de impacto para la comunidad."
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitLabel="Crear Pilar"
    >
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
          placeholder="Ej. Deporte y Salud"
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
          placeholder="Describe el propósito del pilar..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Imagen del Pilar
          </label>
          <div className="relative w-full h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-black transition-colors flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer">
            <input
              required
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setIcon(e.target.files?.[0] || null)}
            />
            <span className="font-body text-sm font-semibold text-gray-500 truncate px-4 pointer-events-none">
              {icon ? icon.name : "Seleccionar imagen"}
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
        <p className="font-body text-[10px] text-gray-400 mt-1">Solo los usuarios con rol de Coordinador deberían ser seleccionados.</p>
      </div>
    </FormModal>
  );
}
