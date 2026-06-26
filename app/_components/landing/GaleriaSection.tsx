"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Calendar, MapPin, Users } from "lucide-react";

export default function GaleriaSection({ proyectos, pilares }: { proyectos: any[], pilares: any[] }) {
  const [filterPillar, setFilterPillar] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const filteredProjects = filterPillar 
    ? proyectos.filter(p => p.pillarId === filterPillar)
    : proyectos;

  // Sizes for old grid pattern: Large (col-span-2), Small (col-span-1)
  const isLargeCard = (index: number) => {
    // pattern: Large, Small, Small, Large (0, 3 are large)
    const patternIndex = index % 4;
    return patternIndex === 0 || patternIndex === 3;
  };

  return (
    <section id="galeria" className="py-24 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Header Context */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 mb-4 rounded-full bg-brand-verde/10 border border-brand-verde/20 text-brand-verde font-bold text-sm tracking-wider">
              COMUNIDAD EN ACCIÓN
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Nuestro Trabajo en Acción</h2>
            <p className="text-white/60 text-lg">Descubre parte de los proyectos activos en cada uno de nuestros pilares.</p>
          </div>
          <div>
            <a href="https://www.instagram.com/jacoimpact" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white font-bold hover:text-brand-verde transition-colors">
              Ver más en Instagram
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Gallery Filters */}
        <div className="flex flex-wrap justify-start gap-4 mb-12 border-b border-neutral-800 pb-4">
          <button 
            onClick={() => setFilterPillar(null)}
            className={`px-6 py-2 text-sm font-bold tracking-widest uppercase transition-all ${
              filterPillar === null 
                ? 'text-brand-verde border-b-2 border-brand-verde' 
                : 'text-neutral-500 hover:text-brand-verde'
            }`}
          >
            TODOS
          </button>
          {pilares.map((pillar) => (
            <button 
              key={pillar.id}
              onClick={() => setFilterPillar(pillar.id)}
              className={`px-6 py-2 text-sm font-bold tracking-widest uppercase transition-all ${
                filterPillar === pillar.id 
                  ? 'text-brand-verde border-b-2 border-brand-verde' 
                  : 'text-neutral-500 hover:text-brand-verde'
              }`}
            >
              {pillar.name}
            </button>
          ))}
        </div>

        {/* Old Grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {filteredProjects.map((project, i) => {
            const isLarge = isLargeCard(i);
            
            // Map the colors correctly from pillar color
            let fromClass = "from-neutral-800";
            let toClass = "to-neutral-900";
            
            const colorVar = project.pillar.color;
            if (colorVar === 'brand-verde') { fromClass = "from-brand-verde"; toClass = "to-[#2d8a3a]"; }
            if (colorVar === 'brand-azul') { fromClass = "from-brand-azul"; toClass = "to-[#1d8ac4]"; }
            if (colorVar === 'brand-rosa') { fromClass = "from-brand-rosa"; toClass = "to-[#c7006f]"; }
            if (colorVar === 'brand-turquesa') { fromClass = "from-brand-turquesa"; toClass = "to-[#0f8a82]"; }
            if (colorVar === 'brand-amarillo') { fromClass = "from-brand-amarillo"; toClass = "to-[#b0ba1a]"; }
            if (colorVar === 'brand-rojo') { fromClass = "from-brand-rojo"; toClass = "to-[#c6151d]"; }

            return (
              <div 
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`relative rounded-3xl overflow-hidden group cursor-pointer ${isLarge ? 'col-span-2 md:col-span-2 aspect-[16/9]' : 'col-span-1 md:col-span-1 aspect-square'}`}
              >
                {project.photoUrl ? (
                  <Image 
                    src={project.photoUrl}
                    alt={project.name}
                    fill
                    className="object-cover z-0 grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 text-transparent"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMGg4djhIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] z-0 bg-neutral-900"></div>
                )}

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${fromClass} ${toClass} opacity-70 mix-blend-multiply group-hover:opacity-40 transition-opacity duration-300 z-10`}></div>
                
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  {project.pillar.iconUrl?.startsWith('<svg') ? (
                    <div className="w-16 h-16 text-white/40 group-hover:text-white/20 transition-all group-hover:scale-150 duration-700" dangerouslySetInnerHTML={{ __html: project.pillar.iconUrl }} />
                  ) : project.pillar.iconUrl ? (
                    <img src={project.pillar.iconUrl} alt={project.pillar.name} className="w-16 h-16 opacity-40 group-hover:opacity-20 transition-all group-hover:scale-150 duration-700 object-contain" />
                  ) : null}
                </div>
                
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-30 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20">
                  <span className="text-white/70 font-bold text-xs tracking-widest uppercase mb-1 block">
                    {project.pillar.name}
                  </span>
                  <h3 className="text-white font-bold text-xl md:text-2xl mb-1">{project.name}</h3>
                  <div className="w-8 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity delay-100"></div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="py-20 text-center text-neutral-500">
            Aún no hay proyectos activos en esta categoría.
          </div>
        )}
      </div>

      {/* Project Details & Events Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-neutral-800">
            <div className="relative h-48 md:h-64 flex-shrink-0 bg-neutral-800">
              {selectedProject.photoUrl ? (
                <Image 
                  src={selectedProject.photoUrl}
                  alt={selectedProject.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                   {selectedProject.pillar.iconUrl?.startsWith('<svg') ? (
                     <div className="w-24 h-24 text-white" dangerouslySetInnerHTML={{ __html: selectedProject.pillar.iconUrl }} />
                   ) : selectedProject.pillar.iconUrl ? (
                     <img src={selectedProject.pillar.iconUrl} alt={selectedProject.pillar.name} className="w-24 h-24 object-contain brightness-0 invert" />
                   ) : null}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-brand-verde text-white p-2 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-brand-verde font-bold text-xs tracking-widest uppercase mb-1 block">
                  {selectedProject.pillar.name}
                </span>
                <h3 className="text-white font-black text-3xl">{selectedProject.name}</h3>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              <p className="text-neutral-300 mb-8 whitespace-pre-wrap leading-relaxed">
                {selectedProject.description}
              </p>

              <h4 className="text-xl font-bold text-white mb-4 border-b border-neutral-800 pb-2">
                Próximos Eventos
              </h4>
              
              {selectedProject.events && selectedProject.events.length > 0 ? (
                <div className="space-y-4">
                  {selectedProject.events.map((event: any) => (
                    <div key={event.id} className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-neutral-600 transition-colors">
                      <div className="flex-1">
                        <h5 className="font-bold text-white text-lg mb-1">{event.name}</h5>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                          <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                            <Calendar className="w-4 h-4 text-brand-verde" />
                            {new Date(event.eventDate).toLocaleDateString('es-ES', { 
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                              <MapPin className="w-4 h-4 text-brand-azul" />
                              {event.location}
                            </div>
                          )}
                          {event.volunteersNeeded > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                              <Users className="w-4 h-4 text-brand-rosa" />
                              {event.volunteersNeeded} voluntarios
                            </div>
                          )}
                        </div>
                      </div>
                      <Link 
                        href="/login" 
                        className="bg-brand-verde/10 hover:bg-brand-verde text-brand-verde hover:text-white font-bold px-5 py-2.5 rounded-lg whitespace-nowrap transition-colors"
                      >
                        ¡Participar!
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-800/30 rounded-xl p-8 text-center border border-neutral-800">
                  <p className="text-neutral-500">No hay eventos próximos programados para este proyecto.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
