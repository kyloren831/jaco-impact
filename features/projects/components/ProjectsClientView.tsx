"use client";

import { useState } from "react";
import ModuleHeader from "@/components/ui/ModuleHeader";
import { CreateProjectModal } from "./CreateProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import { deleteProject } from "../actions";

interface ProjectsClientViewProps {
  projects: any[];
  pillars: any[];
}

export function ProjectsClientView({ projects, pillars }: ProjectsClientViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pillarFilter, setPillarFilter] = useState("ALL");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesPillar = pillarFilter === "ALL" || p.pillarId === Number(pillarFilter);
    return matchesSearch && matchesStatus && matchesPillar;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-blue-200";
      case "COMPLETED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200"; // DRAFT
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "Publicado";
      case "IN_PROGRESS": return "En Progreso";
      case "COMPLETED": return "Completado";
      case "CANCELLED": return "Cancelado";
      default: return "Borrador";
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este proyecto?")) {
      const res = await deleteProject(id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <ModuleHeader
        title="Proyectos"
        description="Gestión de proyectos asociados a los pilares de la organización."
        searchPlaceholder="Buscar proyecto..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionLabel="Nuevo Proyecto"
        onActionClick={() => setIsCreating(true)}
      />

      <div className="flex gap-4 mb-6">
        <select 
          className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black font-body text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Todos los Estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="IN_PROGRESS">En Progreso</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>

        <select 
          className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black font-body text-sm bg-white"
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value)}
        >
          <option value="ALL">Todos los Pilares</option>
          {pillars.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 group flex flex-col relative overflow-hidden"
          >
            {/* Decoration line */}
            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: project.pillar.color }}></div>

            <div className="flex justify-between items-start mb-4 pl-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner bg-opacity-20"
                  style={{ backgroundColor: project.pillar.color + "20", color: project.pillar.color }}
                  title={`Pilar: ${project.pillar.name}`}
                >
                  {(project.pillar.iconUrl?.startsWith('http') || project.pillar.iconUrl?.startsWith('/') || project.pillar.iconUrl?.startsWith('data:image')) ? (
                    <img src={project.pillar.iconUrl} alt={project.pillar.name} className="w-full h-full object-contain p-2 drop-shadow-sm" />
                  ) : (
                    project.pillar.iconUrl || <span style={{ color: project.pillar.color }}>{project.pillar.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingProject(project)}
                  className="p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                  title="Editar Proyecto"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-full transition-colors"
                  title="Eliminar Proyecto"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="pl-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-headline text-2xl font-bold text-gray-900">{project.name}</h3>
                {project.visibility === "PRIVATE" && (
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" title="Proyecto Privado">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="font-body text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                {project.description}
              </p>

              <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                <div>
                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Pilar</p>
                  <p className="font-body text-xs font-medium text-gray-900" style={{ color: project.pillar.color }}>
                    {project.pillar.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Fechas</p>
                  <p className="font-body text-xs font-medium text-gray-600">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD"} - 
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border border-dashed border-gray-300">
            <p className="font-body font-medium text-gray-500 text-lg">No se encontraron proyectos.</p>
          </div>
        )}
      </div>

      {isCreating && (
        <CreateProjectModal
          pillars={pillars}
          onClose={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          pillars={pillars}
          onClose={() => setEditingProject(null)}
          onSuccess={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}
