"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ImpactStatSeed } from '@/lib/seed-data/types';

interface CounterProps {
  end: number;
  duration?: number;
  visible: boolean;
}

function Counter({ end, duration = 2000, visible }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easing * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    // start slightly off a timeout for stability
    const animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration, visible]);

  return <>{count.toLocaleString()}</>;
}

export default function ImpactStatsSection({ stats }: { stats: ImpactStatSeed[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="impact" ref={sectionRef} className="py-24 bg-neutral-50 dark:bg-gray-900 border-y border-neutral-100 dark:border-gray-800">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-black dark:text-white mb-4">Nuestro Impacto</h2>
          <p className="text-black/60 dark:text-gray-400 text-lg max-w-2xl mx-auto">Resultados tangibles del trabajo en equipo que construimos día a día junto a nuestros voluntarios.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, i) => {
            const delay = i * 200;
            return (
              <div 
                key={stat.id} 
                className={`flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]`}
                style={{
                  transitionDelay: isVisible ? `${delay}ms` : '0ms',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transitionProperty: 'all',
                }}
              >
                <div 
                  className={`w-16 h-16 rounded-full mb-6 flex items-center justify-center shadow-lg animate-[pulseSubtle_2s_infinite]`}
                  style={{
                    backgroundColor: stat.colorVar.startsWith('brand-') ? `var(--color-${stat.colorVar})` : stat.colorVar,
                    boxShadow: `0 10px 20px ${stat.colorVar.startsWith('brand-') ? `var(--color-${stat.colorVar})` : stat.colorVar}40`
                  }}
                >
                  <div className="w-8 h-8 text-white" dangerouslySetInnerHTML={{ __html: stat.iconSvg }} />
                </div>
                {/* Number */}
                <div className="text-4xl md:text-5xl font-black text-black dark:text-white mb-2 tracking-tight">
                  {stat.prefix}
                  <Counter end={stat.value} visible={isVisible} />
                  <span className={`text-xl font-bold ml-1`} style={{ color: stat.colorVar.startsWith('brand-') ? `var(--color-${stat.colorVar})` : stat.colorVar }}>{stat.suffix}</span>
                </div>
                <div className="text-sm md:text-base text-black/60 dark:text-gray-400 font-medium uppercase tracking-wider text-center">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
