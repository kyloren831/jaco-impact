import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

// Server Component
export default async function AdminDashboardPage() {
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/dashboard");
  }

  const [
    usersByRole,
    projectCounts,
    pymesActiveCount,
    pendingEvidences,
    events,
  ] = await Promise.all([
    prisma.userRole.groupBy({
      by: ["role"],
      _count: { userId: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.pyme.count({
      where: { isActive: true },
    }),
    prisma.taskEvidence.findMany({
      where: { status: "PENDING" },
      include: {
        task: true,
        volunteer: { include: { user: true } },
      },
      take: 5,
    }),
    prisma.event.findMany({
      where: { status: { in: ["PLANNED", "OPEN"] } },
      include: {
        _count: { select: { participations: true } },
      },
    }),
  ]);

  const adminCount = usersByRole.find((r) => r.role === "ADMIN")?._count.userId || 0;
  const volunteerCount = usersByRole.find((r) => r.role === "VOLUNTEER")?._count.userId || 0;

  const publishedProjects = projectCounts.find((p) => p.status === "PUBLISHED")?._count.id || 0;
  const inProgressProjects = projectCounts.find((p) => p.status === "IN_PROGRESS")?._count.id || 0;
  const deficitEvents = events.filter((e) => e._count.participations < e.volunteersNeeded);
  const totalProjects = projectCounts.reduce((acc, curr) => acc + curr._count.id, 0) || 1;

  // Exact Brand Hex Colors
  const COLORS = {
    AMBIENTE: "#45B85A",
    EDUCACION: "#1A7ABD",
    ARTE: "#E539AB",
    BIENESTAR: "#ED242E",
    DEPORTES: "#33AFDD",
    EMPRENDE: "#E4A92E",
    ANIMAL: "#26AEA5",
    SOCIAL: "#EE933B",
    BLACK: "#000000",
    WHITE: "#FFFFFF"
  };

  const statusColors: Record<string, string> = {
    DRAFT: "#9CA3AF", // Gray
    PUBLISHED: COLORS.AMBIENTE, // Green
    IN_PROGRESS: COLORS.EMPRENDE, // Yellow
    COMPLETED: COLORS.EDUCACION, // Blue
    CANCELLED: COLORS.BIENESTAR, // Red
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap');
        
        .font-headline { font-family: 'Nunito', sans-serif; }
        .font-body { font-family: 'Montserrat', sans-serif; }
        
        .card-shadow { box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08); }
      `}} />

      <div className="min-h-full bg-gray-50 dark:bg-gray-900 -mx-4 md:-mx-8 -mt-6 p-4 md:p-12 animate-in fade-in duration-1000 transition-colors duration-300">
        
        {/* Header Section */}
        <header className="mb-12 relative">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{backgroundColor: COLORS.AMBIENTE}}></div>
          <div className="absolute -top-10 left-20 w-48 h-48 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{backgroundColor: COLORS.DEPORTES}}></div>
          
          <h1 className="relative font-headline text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Panel <span style={{color: COLORS.AMBIENTE}}>Central</span>
          </h1>
          <p className="relative font-body text-gray-500 dark:text-gray-400 mt-4 max-w-xl text-lg font-medium">
            Monitoreo en tiempo real del impacto, operaciones y estado de la comunidad Jacó Impact.
          </p>
        </header>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KPICard 
            title="Voluntarios Activos" 
            value={volunteerCount} 
            subtitle="Pilar: Social"
            trend="+12%" 
            colorHex={COLORS.SOCIAL}
          />
          <KPICard 
            title="Proyectos Activos" 
            value={publishedProjects + inProgressProjects} 
            subtitle="Pilar: Emprende"
            trend="Estable" 
            colorHex={COLORS.EMPRENDE}
          />
          <KPICard 
            title="Pymes Registradas" 
            value={pymesActiveCount} 
            subtitle="Pilar: Arte y Cultura"
            trend="+3 nuevas" 
            colorHex={COLORS.ARTE}
          />
          <KPICard 
            title="Administradores" 
            value={adminCount} 
            subtitle="Pilar: Educación"
            trend="Operando" 
            colorHex={COLORS.EDUCACION}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Gráfico de Proyectos */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white/95 dark:bg-gray-800/95 border border-black/5 dark:border-white/5 rounded-3xl p-8 lg:p-10 card-shadow relative overflow-hidden group transition-all duration-500 hover:shadow-2xl">
            <h2 className="font-headline text-2xl font-bold text-gray-900 dark:text-white mb-8 relative">Distribución de Proyectos</h2>
            
            <div className="space-y-6 relative">
              {projectCounts.map((p, i) => {
                const percentage = Math.round((p._count.id / totalProjects) * 100);
                const barColor = statusColors[p.status] || "#9CA3AF";
                return (
                  <div key={p.status} className="group/item">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-body text-sm font-bold tracking-wider uppercase text-gray-800 dark:text-gray-200">{p.status.replace('_', ' ')}</span>
                      <span className="font-headline text-2xl text-gray-400">{p._count.id}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%`, backgroundColor: barColor, animationDelay: `${i * 150}ms` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {projectCounts.length === 0 && (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 font-body font-medium text-lg">El ecosistema está vacío. Comienza un nuevo proyecto.</div>
              )}
            </div>
          </div>

          {/* Alertas de Acción Urgente */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            
            <div className="rounded-3xl p-8 card-shadow text-white relative overflow-hidden" style={{backgroundColor: COLORS.BLACK}}>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor: COLORS.BIENESTAR}}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{backgroundColor: COLORS.BIENESTAR}}></span>
                </span>
                <h2 className="font-body uppercase tracking-widest text-xs font-bold" style={{color: COLORS.BIENESTAR}}>Acción Urgente</h2>
              </div>

              {/* Evidencias */}
              <div className="mb-8 relative z-10">
                <h3 className="font-headline text-xl mb-4 text-white/90 border-b border-white/20 pb-2">Evidencias Pendientes</h3>
                <div className="space-y-4">
                  {pendingEvidences.map((ev) => (
                    <div key={ev.id} className="group relative">
                      <p className="font-body text-sm font-semibold text-white/90 truncate">{ev.task.title}</p>
                      <p className="font-body text-xs text-white/50 mt-1">Voluntario: {ev.volunteer.user.name}</p>
                      <Link href={`/dashboard/admin/tasks/${ev.taskId}`} className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 flex items-center justify-end pr-2 transition-opacity">
                        <span className="text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg" style={{backgroundColor: COLORS.WHITE}}>Revisar &rarr;</span>
                      </Link>
                    </div>
                  ))}
                  {pendingEvidences.length === 0 && <p className="font-body text-sm text-white/40">Sin pendientes.</p>}
                </div>
              </div>

              {/* Eventos */}
              <div className="relative z-10">
                <h3 className="font-headline text-xl mb-4 text-white/90 border-b border-white/20 pb-2">Déficit en Eventos</h3>
                <div className="space-y-4">
                  {deficitEvents.map((ev) => (
                    <div key={ev.id} className="flex justify-between items-center">
                      <p className="font-body text-sm text-white/90 truncate pr-4">{ev.name}</p>
                      <span className="shrink-0 text-white text-xs font-bold px-2 py-1 rounded" style={{backgroundColor: COLORS.BIENESTAR}}>
                        -{ev.volunteersNeeded - ev._count.participations}
                      </span>
                    </div>
                  ))}
                  {deficitEvents.length === 0 && <p className="font-body text-sm text-white/40">Cupos cubiertos.</p>}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KPICard({ title, value, subtitle, trend, colorHex }: { title: string; value: number; subtitle: string; trend: string; colorHex: string }) {
  return (
    <div className="bg-white/95 dark:bg-gray-800/95 border border-black/5 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 card-shadow">
      <div 
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{backgroundColor: colorHex}}
      ></div>
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-body text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{title}</h3>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{backgroundColor: colorHex}}>{trend}</span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="font-headline text-5xl font-black text-gray-900 dark:text-white">{value}</p>
      </div>
      <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{backgroundColor: colorHex}}></span>
        {subtitle}
      </p>
    </div>
  );
}
