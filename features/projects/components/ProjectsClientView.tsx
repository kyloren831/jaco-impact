"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ModuleHeader from "@/components/ui/ModuleHeader";
import { CreateProjectModal } from "./CreateProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import { deleteProject } from "../actions";

interface ProjectsClientViewProps {
  projects: any[];
  pillars: any[];
}

export function ProjectsClientView({ projects, pillars }: ProjectsClientViewProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pillarFilter, setPillarFilter] = useState("ALL");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesPillar = pillarFilter === "ALL" || p.pillarId === Number(pillarFilter);
    return matchesSearch && matchesStatus && matchesPillar;
  });

  const visiblePillars = pillars.filter(p => pillarFilter === "ALL" || p.id === Number(pillarFilter));

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
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] flex flex-col h-full">
      <ModuleHeader
        title="Proyectos"
        description="Gestión de proyectos asociados a los pilares de la organización."
        searchPlaceholder="Buscar proyecto..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionLabel="Nuevo Proyecto"
        onActionClick={() => setIsCreating(true)}
      />

      <div className="flex gap-4">
        <select 
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-body text-sm bg-white dark:bg-gray-800 dark:text-white shadow-sm"
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
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-body text-sm bg-white dark:bg-gray-800 dark:text-white shadow-sm"
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value)}
        >
          <option value="ALL">Todos los Pilares</option>
          {pillars.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Trello-style Board Container */}
      <div className="flex gap-6 overflow-x-auto pb-8 items-start min-h-[60vh] snap-x scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {visiblePillars.map(pillar => {
          const pillarProjects = filteredProjects.filter(p => p.pillarId === pillar.id);
          
          return (
            <div 
              key={pillar.id} 
              className="w-80 shrink-0 backdrop-blur-sm rounded-2xl flex flex-col max-h-full snap-start border shadow-sm overflow-hidden"
              style={{ 
                backgroundColor: `${pillar.color}15`,
                borderColor: `${pillar.color}30`
              }}
            >
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 dark:bg-black/60 shadow-sm" 
                    style={{ color: pillar.color }}
                  >
                    {(pillar.iconUrl?.startsWith('http') || pillar.iconUrl?.startsWith('/') || pillar.iconUrl?.startsWith('data:image')) ? (
                      <img src={pillar.iconUrl} alt={pillar.name} className="w-5 h-5 object-contain drop-shadow-sm" />
                    ) : (
                      <span className="font-bold text-sm">{pillar.iconUrl || pillar.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="font-headline font-bold text-gray-900 dark:text-gray-100" style={{ color: pillar.color }}>
                    {pillar.name}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-white/60 dark:bg-black/60 rounded-full text-gray-700 dark:text-gray-300 shadow-sm border border-white/50 dark:border-black/50">
                  {pillarProjects.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-3 p-3 pt-2 overflow-y-auto custom-scrollbar">
                {pillarProjects.map(project => (
                  <div 
                    key={project.id} 
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all cursor-pointer group relative"
                    onClick={() => router.push(`/dashboard/admin/events?projectId=${project.id}`)}
                  >
                    {/* Left color bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: pillar.color }}></div>
                    
                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                        
                        {/* Dropdown Menu (Tarea 2) */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === project.id ? null : project.id);
                            }}
                            className="p-1 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Opciones"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          
                          {activeDropdown === project.id && (
                            <div 
                              className="absolute right-0 top-6 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-10 py-1 flex flex-col"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                onClick={() => { setEditingProject(project); setActiveDropdown(null); }}
                                className="px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Editar
                              </button>
                              <button 
                                onClick={() => { handleDelete(project.id); setActiveDropdown(null); }}
                                className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-headline text-base font-bold text-gray-900 dark:text-white leading-tight">
                          {project.name}
                        </h4>
                        {project.visibility === "PRIVATE" && (
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <title>Proyecto Privado</title>
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <p className="font-body text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {project.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-2">
                        <div className="flex items-center gap-1.5" title="Fechas del proyecto">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString('es-CR', { month: 'short', day: 'numeric' }) : "TBD"}
                          </span>
                        </div>
                        
                        {/* Project photo thumbnail */}
                        <div className="flex -space-x-1.5">
                          {project.photoUrl ? (
                            <img 
                              src={project.photoUrl} 
                              alt={project.name}
                              className="w-7 h-7 rounded-md object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 border border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-500 dark:text-gray-400" style={{ backgroundColor: `${pillar.color}40` }}>
                              {project.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {pillarProjects.length === 0 && (
                  <div className="py-6 px-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                    <p className="font-body text-xs font-medium text-gray-400">Sin proyectos</p>
                  </div>
                )}
                
                {/* Simulated 'Add Card' button */}
                <button 
                  onClick={() => setIsCreating(true)}
                  className="mt-1 py-2 px-3 flex items-center gap-2 text-sm font-body font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors w-full text-left"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Añadir proyecto
                </button>
              </div>
            </div>
          );
        })}
        
        {visiblePillars.length === 0 && (
          <div className="w-full py-20 text-center bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="font-body font-medium text-gray-500 dark:text-gray-400 text-lg">No se encontraron pilares.</p>
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
