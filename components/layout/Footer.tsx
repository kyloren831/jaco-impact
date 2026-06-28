// c:\Users\Aaron\Documents\projects2026\jaco-impact\components\layout\Footer.tsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 md:gap-12 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                            <circle cx="20" cy="20" r="18" stroke="#39B44A" strokeWidth="3" />
                            <path
                                d="M12 20C12 15.58 15.58 12 20 12V20H28C28 24.42 24.42 28 20 28C15.58 28 12 24.42 12 20Z"
                                fill="#39B44A" />
                            <circle cx="20" cy="20" r="4" fill="#fff" />
                        </svg>
                        <span className="font-extrabold text-2xl tracking-tight">Jacó Impact</span>
                    </div>
                    <p className="opacity-70 leading-relaxed mb-6 max-w-sm">
                        Movimiento social dedicado a fortalecer comunidades y enfrentar desafíos socioeconómicos y ambientales en Jacó, Costa Rica desde 2017.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" aria-label="Facebook" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center transition-all hover:bg-brand-verde hover:-translate-y-1">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                            </svg>
                        </a>
                        <a href="#" aria-label="Instagram" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center transition-all hover:bg-brand-verde hover:-translate-y-1">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                            </svg>
                        </a>
                        <a href="#" aria-label="YouTube" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center transition-all hover:bg-brand-verde hover:-translate-y-1">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-brand-verde mb-5">Enlaces</h4>
                    <ul className="space-y-3">
                        <li><a href="#about" className="opacity-70 hover:opacity-100 hover:text-brand-verde transition-all">Nosotros</a></li>
                        <li><a href="#impact" className="opacity-70 hover:opacity-100 hover:text-brand-verde transition-all">Impacto</a></li>
                        <li><a href="#pilares" className="opacity-70 hover:opacity-100 hover:text-brand-verde transition-all">Pilares</a></li>
                        <li><a href="#galeria" className="opacity-70 hover:opacity-100 hover:text-brand-verde transition-all">Actividades</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-brand-verde mb-5">Contacto</h4>
                    <ul className="space-y-3 opacity-70">
                        <li>Playa Jacó, Costa Rica</li>
                        <li>info@jacoimpact.org</li>
                        <li>+506 1234 5678</li>
                    </ul>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10 text-center opacity-60 text-sm">
                <p>2024 Jacó Impact. Todos los derechos reservados. | De, Para y Por la Comunidad</p>
            </div>
        </div>
    </footer>
  );
}
