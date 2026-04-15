import React from 'react';
import { ActivitySeed } from '@/lib/seed-data/types';

export default function GaleriaSection({ actividades }: { actividades: ActivitySeed[] }) {
  return (
    <section id="galeria" className="py-24 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-4xl font-black text-white mb-4">La Comunidad en Acción</h2>
            <p className="text-white/60 text-lg">Descubre parte del trabajo que realizamos en cada uno de nuestros pilares.</p>
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {actividades.map((actividad, i) => {
            const isLarge = i === 0 || i === 3;
            // Map the colors correctly
            let fromClass = "from-neutral-800";
            let toClass = "to-neutral-900";
            
            if (actividad.colorFrom === 'brand-verde') { fromClass = "from-brand-verde"; toClass = "to-[#2d8a3a]"; }
            if (actividad.colorFrom === 'brand-azul') { fromClass = "from-brand-azul"; toClass = "to-[#1d8ac4]"; }
            if (actividad.colorFrom === 'brand-rosa') { fromClass = "from-brand-rosa"; toClass = "to-[#c7006f]"; }
            if (actividad.colorFrom === 'brand-turquesa') { fromClass = "from-brand-turquesa"; toClass = "to-[#0f8a82]"; }
            if (actividad.colorFrom === 'brand-amarillo') { fromClass = "from-brand-amarillo"; toClass = "to-[#b0ba1a]"; }
            if (actividad.colorFrom === 'brand-rojo') { fromClass = "from-brand-rojo"; toClass = "to-[#c6151d]"; }

            return (
              <div 
                key={actividad.id}
                className={`relative rounded-3xl overflow-hidden group cursor-pointer ${isLarge ? 'col-span-2 md:col-span-2 aspect-[16/9]' : 'col-span-1 md:col-span-1 aspect-square'}`}
              >
                {/* Fallback pattern instead of an image to avoid missing files. It uses the gradient. */}
                <div className={`absolute inset-0 bg-gradient-to-br ${fromClass} ${toClass} opacity-80 mix-blend-multiply group-hover:opacity-60 transition-opacity duration-300 z-10`}></div>
                
                {/* Pattern or texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMGg4djhIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] z-0"></div>
                
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-colors group-hover:scale-125 duration-500" dangerouslySetInnerHTML={{ __html: actividad.iconSvg }} />
                </div>
                
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-30 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20">
                  <h3 className="text-white font-bold text-xl md:text-2xl mb-1">{actividad.name}</h3>
                  <div className="w-8 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity delay-100"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
