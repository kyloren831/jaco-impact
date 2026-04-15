import React from 'react';
import { PillarSeed } from '@/lib/seed-data/types';

export default function PilaresSection({ pilares }: { pilares: PillarSeed[] }) {
  return (
    <section id="pilares" className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16 animate-[fadeInUp_1s_ease-out_forwards]">
          <div className="inline-block px-4 py-2 bg-brand-turquesa/15 text-brand-turquesa rounded-full font-bold text-sm tracking-wider uppercase mb-6">
            Nuestros Pilares
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
            Nuestras áreas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-verde to-brand-turquesa">Acción</span>
          </h2>
          <p className="text-black/60 text-lg max-w-2xl mx-auto">Intervenimos en distintas áreas para lograr un bienestar integral para todas las personas del cantón.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pilares.map((pilar, i) => (
            <div 
              key={pilar.id} 
              className="bg-white border rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border-neutral-100"
              style={{
                animationDelay: `${i * 100}ms`
              }}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-opacity-10 transition-transform duration-500 group-hover:scale-150 z-0"
                style={{ backgroundColor: pilar.colorVar.startsWith('brand-') ? `var(--color-${pilar.colorVar})` : pilar.colorVar }}
              ></div>
              
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 text-white"
                style={{ backgroundColor: pilar.colorVar.startsWith('brand-') ? `var(--color-${pilar.colorVar})` : pilar.colorVar }}
              >
                <div className="w-8 h-8 fill-current" dangerouslySetInnerHTML={{ __html: pilar.iconSvg }} />
              </div>
              
              <h3 className="text-2xl font-bold text-black mb-4 relative z-10">{pilar.name}</h3>
              <p className="text-black/70 leading-relaxed relative z-10">{pilar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
