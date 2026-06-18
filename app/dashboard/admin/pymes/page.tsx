import { getAdminPymesAction } from "@/features/pymes/actions";
import Link from "next/link";
import { Store, CheckCircle2, Clock, Eye } from "lucide-react";
import ModuleHeader from "@/components/ui/ModuleHeader";

export default async function AdminPymesPage() {
  const pymes = await getAdminPymesAction();

  return (
    <div className="space-y-6">
      <ModuleHeader 
        title="Pymes y Emprendimientos" 
        description="Revisa, aprueba o rechaza los catálogos y emprendimientos registrados."
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-medium">Emprendimiento</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Manager</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pymes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay emprendimientos registrados.
                  </td>
                </tr>
              ) : pymes.map((pyme) => (
                <tr key={pyme.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{pyme.name}</div>
                    <div className="text-xs text-brand-verde">/{pyme.catalogSlug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {pyme.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-200">{pyme.manager?.name}</div>
                    <div className="text-xs">{pyme.manager?.email || pyme.manager?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    {pyme.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                        <Clock className="w-3.5 h-3.5" /> En Revisión
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/admin/pymes/${pyme.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-verde hover:text-brand-verde/80 bg-brand-verde/10 hover:bg-brand-verde/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
