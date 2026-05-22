"use client";

import { useState } from "react";
import CreatePillarModal from "./CreatePillarModal";
import EditPillarModal from "./EditPillarModal";

type Pillar = {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  color: string;
  isActive: boolean;
  coordinatorId: number;
  coordinator: { name: string; email: string } | null;
};

interface Props {
  initialPillars: Pillar[];
  coordinators: { id: number; name: string }[];
}

import ModuleHeader from "@/components/ui/ModuleHeader";

export default function PillarsClientView({ initialPillars, coordinators }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);

  const filteredPillars = initialPillars.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-700">
      <ModuleHeader
        title="Pilares de Impacto"
        description="Categorías principales donde opera la comunidad."
        searchPlaceholder="Buscar pilar..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionLabel="Nuevo Pilar"
        onActionClick={() => setIsCreating(true)}
      />

      {/* Grid of Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPillars.map((pillar) => (
          <div 
            key={pillar.id} 
            className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 group flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 duration-300 overflow-hidden" 
                style={{ 
                  backgroundColor: pillar.color + "20", 
                  color: pillar.color,
                  borderColor: pillar.color,
                  borderWidth: (pillar.iconUrl?.startsWith('http') || pillar.iconUrl?.startsWith('/') || pillar.iconUrl?.startsWith('data:image')) ? 2 : 0
                }}
              >
                {(pillar.iconUrl?.startsWith('http') || pillar.iconUrl?.startsWith('/') || pillar.iconUrl?.startsWith('data:image')) ? (
                  <img src={pillar.iconUrl} alt={pillar.name} className="w-full h-full object-contain p-3 drop-shadow-sm" />
                ) : (
                  pillar.iconUrl || <span style={{ color: pillar.color }}>{pillar.name.charAt(0)}</span>
                )}
              </div>
              <button
                onClick={() => setEditingPillar(pillar)}
                className="p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                title="Editar Pilar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            
            <h3 className="font-headline text-2xl font-bold text-gray-900 mb-2">{pillar.name}</h3>
            <p className="font-body text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
              {pillar.description}
            </p>

            <div className="pt-4 border-t border-gray-100 mt-auto">
              <p className="font-body text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Coordinador</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-headline font-bold text-gray-600 text-xs">
                  {pillar.coordinator ? pillar.coordinator.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="overflow-hidden">
                  <p className="font-body font-bold text-sm text-gray-900 truncate">
                    {pillar.coordinator ? pillar.coordinator.name : "Sin Coordinador"}
                  </p>
                  <p className="font-body text-xs text-gray-500 truncate">
                    {pillar.coordinator ? pillar.coordinator.email : "Asigna un líder"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPillars.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border border-dashed border-gray-300">
            <p className="font-body font-medium text-gray-500 text-lg">No se encontraron pilares.</p>
          </div>
        )}
      </div>

      {isCreating && (
        <CreatePillarModal
          coordinators={coordinators}
          onClose={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      )}

      {editingPillar && (
        <EditPillarModal
          pillar={editingPillar}
          coordinators={coordinators}
          onClose={() => setEditingPillar(null)}
          onSuccess={() => setEditingPillar(null)}
        />
      )}
    </div>
  );
}
