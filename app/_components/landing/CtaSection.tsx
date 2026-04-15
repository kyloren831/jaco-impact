import React from 'react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-brand-verde">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      
      <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-[3rem] font-black text-white mb-6 leading-tight drop-shadow-sm">
          ¿Quieres ser parte del cambio?
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium">
          Ya sea donando tu tiempo, recursos o talento, cada contribución suma. Únete a Jaco Impact y construyamos juntos una mejor comunidad.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="px-8 py-4 bg-white text-brand-verde font-extrabold rounded-full transition-transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] shadow-lg uppercase tracking-wide text-sm">
            Quiero ser Voluntario
          </Link>
          <a href="mailto:info@jacoimpact.org" className="px-8 py-4 bg-transparent text-white font-extrabold rounded-full border border-white/30 transition-all hover:bg-white/10 uppercase tracking-wide text-sm flex items-center justify-center gap-2">
            Contáctanos
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
