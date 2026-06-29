"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { getMyPymeAction, upsertMyPymeAction, addProductAction, deleteProductAction } from "@/features/pymes/actions";
import { toast } from "sonner";
import { Store, Plus, Trash2, Edit2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import FormModal from "@/components/ui/FormModal";

export default function PymeDashboardPage() {
  const [pyme, setPyme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPyme, setIsEditingPyme] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const fetchPyme = async () => {
    setLoading(true);
    try {
      const data = await getMyPymeAction();
      setPyme(data);
      if (!data) setIsEditingPyme(true);
    } catch (e) {
      console.error(e);
      toast.error("Error cargando perfil de pyme.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPyme();
  }, []);

  const handleUpsertPyme = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      phone: formData.get("phone") as string,
      description: formData.get("description") as string,
      catalogSlug: formData.get("catalogSlug") as string,
    };

    try {
      await upsertMyPymeAction(data);
      toast.success("Perfil de emprendimiento guardado correctamente.");
      setIsEditingPyme(false);
      fetchPyme();
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await addProductAction(formData);
      toast.success("Producto agregado.");
      setIsAddingProduct(false);
      fetchPyme();
    } catch (e: any) {
      toast.error("Error al agregar producto: " + e.message);
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await deleteProductAction(id);
      toast.success("Producto eliminado.");
      fetchPyme();
    } catch (e: any) {
      toast.error("Error al eliminar: " + e.message);
    }
  };

  if (loading && !pyme && !isAddingProduct && !isEditingPyme) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-verde"></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Store className="h-8 w-8 text-brand-verde" />
            Mi Emprendimiento
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gestiona la información de tu pyme y tu catálogo de productos.
          </p>
        </div>
        {pyme && !isEditingPyme && (
          <button
            onClick={() => setIsEditingPyme(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit2 className="h-4 w-4" /> Editar Perfil
          </button>
        )}
      </div>

      {pyme && pyme.isActive === false && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Catálogo en Revisión
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Tu catálogo está siendo revisado por un administrador. Una vez aprobado, será visible públicamente.
            </p>
          </div>
        </div>
      )}

      {isEditingPyme ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">{pyme ? "Editar Emprendimiento" : "Registrar Emprendimiento"}</h2>
          <form onSubmit={handleUpsertPyme} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Pyme</label>
                <input required defaultValue={pyme?.name} name="name" type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-4 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde transition-shadow" placeholder="Ej. Artesanías Jacó" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                <input required defaultValue={pyme?.category} name="category" type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-4 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde transition-shadow" placeholder="Ej. Alimentos, Ropa..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono (WhatsApp)</label>
                <input required defaultValue={pyme?.phone} name="phone" type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-4 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde transition-shadow" placeholder="Ej. +506 8888 8888" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug del Catálogo (URL)</label>
                <input required defaultValue={pyme?.catalogSlug} name="catalogSlug" type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-4 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde transition-shadow" placeholder="Ej. artesanias-jaco" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea required defaultValue={pyme?.description} name="description" rows={3} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-4 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde transition-shadow" placeholder="Cuéntanos sobre tu negocio..."></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              {pyme && (
                <button type="button" onClick={() => setIsEditingPyme(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-verde hover:bg-brand-verde/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                {loading ? "Guardando..." : "Guardar Perfil"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Información</h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Nombre</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-1">{pyme.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Categoría</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-1">{pyme.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Teléfono</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-1">{pyme.phone}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">URL del Catálogo</dt>
                  <dd className="font-medium text-brand-verde mt-1">/{pyme.catalogSlug}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Descripción</dt>
                  <dd className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{pyme.description}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h2 className="text-lg font-semibold">Productos ({(pyme.products || []).length})</h2>
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-verde hover:text-brand-verde/80 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>

              {!(pyme.products && pyme.products.length > 0) ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <ImageIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Sin productos</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Comienza a agregar productos a tu catálogo.</p>
                  <button onClick={() => setIsAddingProduct(true)} className="inline-flex items-center gap-2 bg-brand-verde text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-verde/90 transition-colors">
                    <Plus className="h-4 w-4" /> Nuevo Producto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pyme.products.map((product: any) => (
                    <div key={product.id} className="group relative bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-md">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-800 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <Image src={product.imageUrl || 'https://placehold.co/400x300?text=No+Image'} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={loading}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-900/90 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 text-gray-600 dark:text-gray-300 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{product.name}</h3>
                          <span className="font-bold text-brand-verde whitespace-nowrap ml-3">₡{parseFloat(product.price).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-grow">{product.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddingProduct && (
        <FormModal 
          onClose={() => setIsAddingProduct(false)} 
          title="Agregar Nuevo Producto"
          submitLabel="Guardar Producto"
          onSubmit={handleAddProduct}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
            <input required name="name" type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Precio (₡)</label>
            <input required name="price" type="number" step="0.01" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagen del Producto</label>
            <input required name="image" type="file" accept="image/*" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea required name="description" rows={3} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 px-3 py-2 text-sm focus:ring-brand-verde focus:border-brand-verde"></textarea>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-verde hover:bg-brand-verde/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </FormModal>
      )}
    </div>
  );
}
