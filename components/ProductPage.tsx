import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Product, Language } from '../types';
import { getProductById } from '../services/productService';
import { trackViewItem } from '../services/analytics';
import { ROUTES, productPath } from '../routes';
import { useDocumentHead } from '../hooks/useDocumentHead';
import ProductReviews from './ProductReviews';
import OptimizedImage from './OptimizedImage';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Shield,
  Zap,
  Flame,
  Heart,
  ArrowLeft,
  Share2,
  Loader2,
  Home,
  Pencil,
} from 'lucide-react';

interface ProductPageProps {
  products: Product[];
  isLoadingProducts?: boolean;
  onAddToCart: (product: Product) => void;
  favorites: Set<string | number>;
  onToggleFavorite: (productId: string | number) => void;
  customerUid?: string | null;
  customerName?: string | null;
  isAdmin?: boolean;
}

const ProductPage: React.FC<ProductPageProps> = ({
  products,
  isLoadingProducts = false,
  onAddToCart,
  favorites,
  onToggleFavorite,
  customerUid,
  customerName,
  isAdmin,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Dynamic SEO for product pages
  const resolvedProduct = products.find(p => String(p.id) === id) || fetchedProduct;
  useDocumentHead({
    title: resolvedProduct?.name,
    description: resolvedProduct?.description,
    ogImage: resolvedProduct?.images?.[0] ?? resolvedProduct?.image,
    canonicalPath: id ? `/producto/${id}` : undefined,
  });

  // Breadcrumb JSON-LD schema for SEO
  useEffect(() => {
    if (!resolvedProduct?.name || !id) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://movilnova.es/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: resolvedProduct.name,
          item: `https://movilnova.es/producto/${id}`,
        },
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumb', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.querySelector('script[data-breadcrumb]')?.remove();
    };
  }, [resolvedProduct?.name, id]);

  // Track product view
  useEffect(() => {
    if (resolvedProduct) {
      trackViewItem(resolvedProduct.id, resolvedProduct.name, resolvedProduct.price, resolvedProduct.category, resolvedProduct.brands);
    }
  }, [resolvedProduct?.id]);

  // Try to find the product in the already-loaded list first
  const product = useMemo(() => {
    const found = products.find(p => String(p.id) === id);
    if (found) return found;
    return fetchedProduct;
  }, [products, id, fetchedProduct]);

  // If not in the list (direct URL access), fetch from Firestore
  useEffect(() => {
    if (!id) return;
    // Still loading products from App.tsx — wait
    if (isLoadingProducts) return;
    const alreadyLoaded = products.find(p => String(p.id) === id);
    if (alreadyLoaded) return;
    // Not in list — try Firestore directly
    setLoading(true);
    getProductById(id)
      .then(p => {
        if (p) {
          setFetchedProduct(p);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, products, isLoadingProducts]);

  // Reset state when product changes
  useEffect(() => {
    setImageIndex(0);
    if (product) {
      setSelectedModel(product.compatibleModels?.[0] || '');
    }
  }, [product?.id]);

  // Touch swipe ref — must be before early returns (Rules of Hooks)
  const touchStartX = useRef(0);

  // Find related products (same category, excluding current) — must be before early returns
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && p.category === product.category && (p.stock == null || p.stock > 0))
      .slice(0, 4);
  }, [products, product]);

  if (loading || isLoadingProducts || (!product && !notFound)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl font-black text-brand-border mb-4">404</div>
          <h1 className="text-2xl font-bold text-brand-dark mb-2">{t('productNotFoundTitle', 'Producto no encontrado')}</h1>
          <p className="text-brand-muted mb-8">{t('productNotFoundMessage', 'Este producto no existe o ha sido eliminado.')}</p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-medium rounded-lg transition-colors"
          >
            <Home size={20} />
            {t('notFoundGoHome')}
          </Link>
        </div>
      </div>
    );
  }

  const imgs = product.images?.length ? product.images : [product.image];
  const hasMultiple = imgs.length > 1;
  const isFavorite = favorites.has(product.id);

  // Touch swipe for image gallery
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setImageIndex(i => Math.min(imgs.length - 1, i + 1));
      else setImageIndex(i => Math.max(0, i - 1));
    }
  };

  const handleAddToCart = () => {
    const productWithOptions = {
      ...product,
      selectedModel: selectedModel || undefined,
      selectedColor: selectedColor || undefined,
    };
    onAddToCart(productWithOptions);
  };

  const handleShare = async () => {
    const url = window.location.origin + productPath(product.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="bg-brand-light min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-brand-muted" aria-label={t('ariaBreadcrumb')}>
          <Link to={ROUTES.HOME} className="hover:text-brand-primary transition-colors">{t('navShop')}</Link>
          <ChevronRight size={14} />
          <span className="text-brand-dark font-medium truncate">{product.name}</span>
        </nav>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-brand-surface rounded-lg border border-brand-border overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-brand-light relative overflow-hidden flex flex-col">
              <div
                className="relative aspect-square"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                tabIndex={0}
                role="region"
                aria-label="Product image gallery"
                aria-roledescription="carousel"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setImageIndex(prev => Math.max(0, prev - 1));
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setImageIndex(prev => Math.min(imgs.length - 1, prev + 1));
                  }
                }}
              >
                <OptimizedImage
                  src={imgs[imageIndex] || product.image}
                  alt={`${product.name} - ${imageIndex + 1}`}
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover"
                />

                {hasMultiple && (
                  <>
                    <button
                      onClick={() => setImageIndex(i => Math.max(0, i - 1))}
                      disabled={imageIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-surface/80 backdrop-blur-sm hover:bg-brand-surface rounded-full flex items-center justify-center shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setImageIndex(i => Math.min(imgs.length - 1, i + 1))}
                      disabled={imageIndex === imgs.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-surface/80 backdrop-blur-sm hover:bg-brand-surface rounded-full flex items-center justify-center shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {product.isBundle && (
                  <div className="absolute top-4 left-4 bg-brand-accent text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <Flame size={16} fill="currentColor" /> {t('hotBundle')}
                  </div>
                )}

                {hasMultiple && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imgs.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        aria-label={`Image ${i + 1} of ${imgs.length}`}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === imageIndex ? 'bg-brand-surface scale-125 shadow-md' : 'bg-brand-surface/50 hover:bg-brand-surface/70'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {hasMultiple && (
                <div className="flex gap-1.5 p-2 bg-brand-light overflow-x-auto">
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imageIndex
                          ? 'border-brand-primary shadow-md scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <OptimizedImage src={img} alt={`Thumbnail ${i + 1}`} sizes="56px" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">{product.brands?.join(' · ') || 'Universal'} · {product.category}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFavorite(product.id)}
                      aria-label={isFavorite ? t('removeFromFavorites', 'Remove from favorites') : t('addToFavorites', 'Add to favorites')}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isFavorite
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-light text-brand-muted hover:text-brand-primary'
                      }`}
                    >
                      <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleShare}
                      aria-label={t('shareProduct', 'Share product')}
                      className="w-9 h-9 rounded-full bg-brand-light text-brand-muted hover:text-brand-primary flex items-center justify-center transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => navigate(`${ROUTES.ADMIN}?edit=${product.id}`)}
                        aria-label={t('editProduct', 'Editar producto')}
                        className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark mt-2 mb-3 leading-tight tracking-tight">{product.name}</h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-brand-border">
                  <span className="text-3xl font-bold text-brand-dark">{'\u20AC'}{product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > 0 && product.originalPrice > product.price && (
                    <span className="text-lg text-brand-muted line-through">{'\u20AC'}{product.originalPrice.toFixed(2)}</span>
                  )}
                  {product.originalPrice && product.originalPrice > 0 && product.originalPrice > product.price && (
                    <span className="text-xs font-semibold text-brand-primary bg-brand-primary-light px-2 py-1 rounded-lg">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                <p className="text-brand-muted mb-5 text-sm leading-relaxed">{product.description}</p>

                {/* Model Selection */}
                {product.compatibleModels && product.compatibleModels.length > 0 && (
                  <div className="mb-5">
                    <label className="text-sm font-semibold text-brand-dark mb-2 block">{t('selectYourModel')}</label>
                    <select
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      aria-label={t('selectYourModel', 'Select your model')}
                      className="w-full p-3.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm bg-brand-input cursor-pointer"
                    >
                      <option value="">{t('chooseModel')}</option>
                      {product.compatibleModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-5">
                    <label className="text-sm font-semibold text-brand-dark mb-2 block">{t('selectColor')}</label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color);
                            if (product.colorImages?.[color] != null) {
                              setImageIndex(product.colorImages[color]);
                            }
                          }}
                          className={`w-9 h-9 rounded-full border-2 transition-all ${
                            selectedColor === color
                              ? 'border-brand-primary scale-110 shadow-md'
                              : 'border-brand-border hover:border-brand-muted'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock indicator */}
                {product.stock != null && product.stock > 0 && product.stock <= 5 && (
                  <p className="text-xs font-semibold text-brand-warning mb-4">
                    {t('lowStock', { count: product.stock, defaultValue: `Solo quedan ${product.stock} unidades` })}
                  </p>
                )}

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2.5 text-sm text-brand-muted bg-brand-light p-3 rounded-lg">
                    <div className="w-8 h-8 bg-brand-primary-light rounded-lg flex items-center justify-center">
                      <Shield size={16} className="text-brand-primary" />
                    </div>
                    {t('featureWarranty')}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-brand-muted bg-brand-light p-3 rounded-lg">
                    <div className="w-8 h-8 bg-brand-primary-light rounded-lg flex items-center justify-center">
                      <Zap size={16} className="text-brand-primary" />
                    </div>
                    {t('featureFastShip')}
                  </div>
                </div>

                {/* Reviews */}
                <div className="border-t border-brand-border pt-5 mt-3">
                  <ProductReviews
                    productId={product.id}
                    customerUid={customerUid}
                    customerName={customerName}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>

              {/* Add to Cart / Out of Stock Button */}
              {product.stock != null && product.stock <= 0 ? (
                <div
                  className="w-full bg-brand-muted/20 text-brand-muted py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 mt-5 cursor-not-allowed border border-brand-border"
                  aria-label={t('outOfStock', 'Agotado')}
                >
                  <ShoppingBag size={20} /> {t('outOfStock', 'Agotado')}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      (product.compatibleModels && product.compatibleModels.length > 0 && !selectedModel) ||
                      (product.colors && product.colors.length > 0 && !selectedColor)
                    }
                    aria-label={t('addToCart', 'Add to cart')}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-primary disabled:hover:shadow-sm mt-5"
                  >
                    <ShoppingBag size={20} /> {t('addToCart')}
                  </button>

                  {product.compatibleModels && product.compatibleModels.length > 0 && !selectedModel && (
                    <p className="text-xs text-brand-warning mt-3 text-center font-medium" role="alert">{t('pleaseSelectModel')}</p>
                  )}
                  {product.colors && product.colors.length > 0 && !selectedColor && (
                    <p className="text-xs text-brand-warning mt-2 text-center font-medium" role="alert">{t('colorRequired')}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-brand-dark mb-6">{t('relatedProducts', 'Productos relacionados')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(rp => {
                const rpImg = rp.images?.length ? rp.images[0] : rp.image;
                return (
                  <Link
                    key={rp.id}
                    to={productPath(rp.id)}
                    className="group bg-brand-surface rounded-lg hover:shadow-md transition-shadow overflow-hidden border border-brand-border"
                  >
                    <div className="aspect-square overflow-hidden bg-brand-light">
                      <OptimizedImage
                        src={rpImg}
                        alt={rp.name}
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <span className="text-[11px] font-semibold text-brand-primary uppercase tracking-wider">{rp.brands?.join(' · ') || 'Universal'}</span>
                      <h3 className="text-xs sm:text-sm font-semibold text-brand-dark mt-1 mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                        {rp.name}
                      </h3>
                      <span className="text-base font-bold text-brand-dark">{'\u20AC'}{rp.price.toFixed(2)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back to shop */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark font-medium text-sm transition-colors"
          >
            <ArrowLeft size={16} /> {t('backToShop', 'Volver a la tienda')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductPage);
