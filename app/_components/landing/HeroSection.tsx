'use client';

import Link from 'next/link';
import React, { useEffect, useRef } from 'react';

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        if (!sectionRef.current || !bgRef.current) {
          ticking = false;
          return;
        }

        const scrollY = window.scrollY;
        const sectionHeight = sectionRef.current.offsetHeight;

        // Only apply parallax while the hero is in view
        if (scrollY <= sectionHeight) {
          const parallaxOffset = scrollY * 0.4; // background moves at 40% scroll speed
          bgRef.current.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] min-h-[600px] flex items-center justify-center overflow-hidden w-full m-0 p-0"
    >
      {/* Background Video — parallax layer */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 will-change-transform"
        style={{ top: '-10%', bottom: '-10%' }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute min-w-full min-h-full w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover object-center scale-[1.15]"
        >
          <source src="/videos/hero_jaco_v3.mp4" type="video/mp4" />
          Tu navegador no soporta HTML5 video.
        </video>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70  z-10"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center max-w-[900px] px-6 text-white pt-24 animate-[fadeInUp_1s_ease-out_forwards]">

        <div className="inline-block bg-white/15 backdrop-blur-[10px] px-[20px] py-[8px] rounded-[50px] text-[0.9rem] font-medium mb-6 border border-white/20 animate-[fadeIn_1s_ease-out]">
          <span className="text-brand-verde font-bold">+</span>9 años transformando comunidades
        </div>
        <p className="font-[var(--font-sans)] text-[clamp(1.2rem,3vw,1.5rem)] font-bold text-[var(--color-brand-amarillo)] mb-4 tracking-[2px] [animation:fadeInUp_1s_ease-out_0.2s_both]">| DE, PARA Y POR LA COMUNIDAD |</p>
        <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.1] tracking-[-0.02em] mb-6 drop-shadow-md">
          Jacó Impact: <br />Transformando <span className="bg-gradient-to-br from-[var(--color-brand-verde)] to-[var(--color-brand-turquesa)] bg-clip-text text-transparent">Jacó Juntos.</span>
        </h1>
        <p className="text-xl md:text-2xl font-light mb-10 max-w-[700px] mx-auto opacity-90 leading-relaxed shadow-neutral-900 drop-shadow-sm">
          Plataforma de gestión social.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link href="/login" className="px-8 py-4 flex bg-brand-verde text-white font-bold rounded-full transition-transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(69,184,90,0.3)] shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Unete al Movimiento
          </Link>
          <a href="#pilares" className="px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white transition-all hover:bg-white hover:text-black">
            Nuestros Pilares
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-[float_2s_ease-in-out_infinite]">
        <a href="#about" className="flex flex-col items-center text-white/70 hover:text-white transition-colors" aria-label="Scroll down">
          <span className="text-xs uppercase tracking-[0.2em] mb-2">Descubrir</span>
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </a>
      </div>
    </section>
  );
}
