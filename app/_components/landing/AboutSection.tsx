'use client';

import React from 'react';
import Image from 'next/image';

export default function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-24 relative" style={{ background: 'transparent' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* ── Image Column with Purple Semicircle ── */}
          <div className="relative flex items-end justify-center min-h-[400px] sm:min-h-[500px] md:min-h-[600px] order-1">
            {/* Purple semicircle behind the image — flat bottom, curved top */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[370px] sm:w-[480px] md:w-[560px] h-[185px] sm:h-[240px] md:h-[280px]"
              style={{
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                background: 'linear-gradient(135deg, #7C3AED, #9333EA, #A855F7)',
                zIndex: 0,
              }}
            />

            {/* Image wrapper — scales on hover */}
            <div className="relative z-10 group w-[280px] sm:w-[380px] md:w-[460px]">
              <div
                className="relative overflow-hidden transition-transform duration-500 ease-out group-hover:scale-110"
                style={{ transformOrigin: 'bottom center' }}
              >
                <Image
                  src="/Yorgina-Ureña.png"
                  alt="Yorgina Ureña — Fundadora de Jaco Impact"
                  width={280}
                  height={1080}
                  className="w-full h-auto object-contain"
                  priority
                />

              </div>
            </div>
          </div>

          {/* ── Text Column ── */}
          <div className="about-text animate-[fadeInUp_1s_flex] order-2">
            <div className="inline-block px-4 py-2 bg-brand-verde/15 text-brand-verde rounded-full font-bold text-sm tracking-wider uppercase mb-6">
              Nuestra Historia
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-[2.8rem] font-extrabold text-white leading-[1.1] mb-6 drop-shadow-md">
              De, para y por<br />
              la{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-verde to-brand-turquesa">
                Comunidad
              </span>
            </h2>
            <p className="text-white/90 text-base sm:text-lg leading-[1.8] mb-5 drop-shadow-sm">
              Jaco Impact nació en Noviembre del 2017 por iniciativa de{' '}
              <strong className="text-white">Yorgina Ureña</strong>, una joven emprendedora,
              vecina del Cantón de Garabito, quién con un profundo amor por su comunidad decidió
              unificar propósitos en acción.
            </p>
            <p className="text-white/90 text-base sm:text-lg leading-[1.8] mb-8 drop-shadow-sm">
              Hoy, somos un movimiento vivo que conecta a quienes quieren ayudar con quienes
              necesitan apoyo, trabajando juntos basado en nuestros 8 pilares para construir un
              cantón más próspero, sostenible y solidario.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 py-5 border-y border-white/20">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-brand-azul">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base sm:text-lg mb-1">Misión</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Articular acciones que generen impacto positivo en nuestra comunidad.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-brand-rosa">
                    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base sm:text-lg mb-1">Visión</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Ser modelo de movimiento social replicable en otras comunidades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
