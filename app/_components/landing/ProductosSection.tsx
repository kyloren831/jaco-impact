"use client";

import { useState, useMemo } from 'react';
import { MessageCircle, Tag, Store, Search } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  description: string;
  price: any;
  imageUrl: string;
}

interface Pyme {
  id: number;
  name: string;
  phone: string;
  products: Product[];
}

interface ProductosSectionProps {
  pymes: Pyme[];
}

export default function ProductosSection({ pymes }: ProductosSectionProps) {
  const [selectedPymeId, setSelectedPymeId] = useState<number | 'all'>('all');

  // Flatten products and attach pyme info
  const allProducts = useMemo(() => {
    const productsList: (Product & { pymeName: string; pymePhone: string; pymeId: number })[] = [];
    pymes.forEach(pyme => {
      pyme.products.forEach(product => {
        productsList.push({
          ...product,
          pymeName: pyme.name,
          pymePhone: pyme.phone.replace(/[^0-9]/g, ""), // Sanitize phone
          pymeId: pyme.id
        });
      });
    });
    return productsList.sort((a, b) => b.id - a.id); // Show newest first
  }, [pymes]);

  const filteredProducts = useMemo(() => {
    if (selectedPymeId === 'all') return allProducts;
    return allProducts.filter(p => p.pymeId === selectedPymeId);
  }, [allProducts, selectedPymeId]);

  if (!pymes || pymes.length === 0 || allProducts.length === 0) return null;

  return (
    <section id="emprendedores" className="py-24 bg-black relative border-t border-white/10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-brand-verde/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Apoya a los <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-verde to-brand-turquesa">Emprendedores Locales</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Descubre los increíbles productos y servicios de nuestra red de emprendedores y compra directamente con ellos por WhatsApp.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center text-gray-300">
            <Store className="w-5 h-5 mr-2 text-brand-verde" />
            <span className="font-medium">Filtrar por Emprendimiento:</span>
          </div>
          
          <div className="flex-1 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedPymeId('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedPymeId === 'all'
                    ? "bg-brand-verde text-white shadow-lg shadow-brand-verde/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Todos
              </button>
              {pymes.filter(p => p.products.length > 0).map(pyme => (
                <button
                  key={pyme.id}
                  onClick={() => setSelectedPymeId(pyme.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedPymeId === pyme.id
                      ? "bg-brand-verde text-white shadow-lg shadow-brand-verde/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pyme.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const whatsappMsg = `Hola! Me interesa comprar el producto "${product.name}" por ₡${Number(product.price).toLocaleString()} que vi en el catálogo de Jacó Impact.`;
            
            return (
              <div key={`${product.pymeId}-${product.id}`} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/10 overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-brand-verde/5 hover:border-brand-verde/30 transition-all">
                <div className="aspect-square bg-gray-800 overflow-hidden relative">
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10 flex items-center">
                    <Store className="w-3 h-3 mr-1.5 text-brand-verde" />
                    {product.pymeName}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {product.name}
                    </h3>
                  </div>
                  <div className="text-brand-verde font-extrabold text-lg mb-3">
                    ₡{Number(product.price).toLocaleString()}
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <a 
                    href={`https://wa.me/${product.pymePhone}?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center bg-white/5 hover:bg-[#25D366] text-white px-4 py-3 rounded-xl font-bold transition-all border border-white/10 hover:border-[#25D366] group/btn"
                  >
                    <MessageCircle className="w-5 h-5 mr-2 text-brand-verde group-hover/btn:text-white transition-colors" />
                    Comprar
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron productos</h3>
            <p className="text-gray-400">Intenta seleccionar otra categoría o emprendimiento.</p>
          </div>
        )}
      </div>
    </section>
  );
}
