import { getAdminPymeDetailAction } from "@/features/pymes/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Store, User, Phone, MapPin } from "lucide-react";
import EvaluatePymeButtons from "./EvaluatePymeButtons";

export default async function AdminPymeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pymeId = parseInt(id);
  const pyme = await getAdminPymeDetailAction(pymeId);

  if (!pyme) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/admin/pymes"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalle de Emprendimiento
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="bg-brand-verde/10 p-3 rounded-lg text-brand-verde">
                  <Store className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{pyme.name}</h2>
                  <p className="text-sm text-gray-500">Categoría: {pyme.category}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <EvaluatePymeButtons pymeId={pyme.id} isActive={pyme.isActive} />
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Descripción</h3>
              <p>{pyme.description}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Catálogo de Productos ({pyme.products.length})</h3>
            {pyme.products.length === 0 ? (
              <p className="text-sm text-gray-500">No hay productos registrados.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pyme.products.map(product => (
                  <div key={product.id} className="flex gap-4 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{product.name}</h4>
                      <p className="text-brand-verde font-bold text-sm my-1">₡{parseFloat(product.price as any).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Información del Responsable</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{pyme.manager?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{pyme.manager?.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{pyme.manager?.email || "Sin email"}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Estado del Catálogo</h3>
            {pyme.isActive ? (
              <div className="flex items-start gap-3 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Aprobado y Público</p>
                  <p className="text-xs mt-1 opacity-80">El catálogo es visible en la plataforma pública.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-yellow-700 dark:text-yellow-400">
                <Clock className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">En Revisión</p>
                  <p className="text-xs mt-1 opacity-80">Requiere aprobación para ser publicado.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
