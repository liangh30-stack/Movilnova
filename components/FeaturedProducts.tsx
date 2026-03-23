import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { ROUTES, productPath } from '../routes';
import OptimizedImage from './OptimizedImage';

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  favorites: Set<string | number>;
  onToggleFavorite: (productId: string | number) => void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, onAddToCart }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Pick 6 featured products: bundles first, then best discount, then newest
  const featured = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      // Bundles first
      if (a.isBundle && !b.isBundle) return -1;
      if (!a.isBundle && b.isBundle) return 1;
      // Then by discount %
      const discA = a.originalPrice && a.originalPrice > a.price ? (1 - a.price / a.originalPrice) : 0;
      const discB = b.originalPrice && b.originalPrice > b.price ? (1 - b.price / b.originalPrice) : 0;
      if (discB !== discA) return discB - discA;
      return 0;
    });
    return sorted.slice(0, 6);
  }, [products]);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-primary font-semibold text-xs uppercase tracking-[0.2em] mb-2">
              Selección
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Productos destacados
            </h2>
          </div>
          <button
            onClick={() => navigate(ROUTES.CATALOG)}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors"
          >
            Ver catálogo completo
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Product grid — 3 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {featured.map((product) => {
            const discount = product.originalPrice && product.originalPrice > product.price
              ? Math.round((1 - product.price / product.originalPrice) * 100)
              : 0;

            return (
              <article
                key={product.id}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(productPath(product.id))}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {product.images?.[0] || product.image ? (
                    <OptimizedImage
                      src={product.images?.[0] || product.image || ''}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={40} className="text-gray-200" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {product.isBundle && (
                      <span className="px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md uppercase tracking-wide">
                        Pack
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-brand-primary transition-colors flex-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">€{product.price.toFixed(2)}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through ml-2">€{product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.colors && product.colors.length > 0) {
                          navigate(productPath(product.id));
                        } else {
                          onAddToCart(product);
                        }
                      }}
                      className="w-9 h-9 bg-gray-900 hover:bg-brand-primary text-white rounded-xl flex items-center justify-center transition-colors"
                      aria-label={t('addToCart', 'Añadir')}
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <button
            onClick={() => navigate(ROUTES.CATALOG)}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Ver catálogo completo
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
