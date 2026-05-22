import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from './_components/landing/HeroSection';
import AboutSection from './_components/landing/AboutSection';
import ImpactStatsSection from './_components/landing/ImpactStatsSection';
import PilaresSection from './_components/landing/PilaresSection';
import GaleriaSection from './_components/landing/GaleriaSection';
import CtaSection from './_components/landing/CtaSection';

import { impactStatsData, actividadesData } from '@/lib/seed-data/landing';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const dbPillars = await prisma.pillar.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      iconUrl: true,
    }
  });

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <HeroSection />
      <AboutSection />
      <ImpactStatsSection stats={impactStatsData} />
      <PilaresSection pilares={dbPillars} />
      <GaleriaSection actividades={actividadesData} />
      <CtaSection />

      <Footer />
    </main>
  );
}
