import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Product, Language } from '../types';
import { ShoppingBag, Flame, ChevronRight, ChevronLeft, Smartphone, Shield, Zap, Battery, Plug, Headphones, Grid, Layers, X, Search, Heart, Eye, Clock, TrendingUp, Gift, Percent, Tag, Star, ArrowRight } from 'lucide-react';
import { BRAND_MODELS } from '../constants';
import { getCatalog } from '../services/catalogService';
import { getActiveOffers, SpecialOffer } from '../services/offerService';
import { productPath } from '../routes';
import OptimizedImage from './OptimizedImage';

interface StorefrontProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  lang: Language;
  onTrackOrderClick: (searchTerm?: string) => void;

  favorites: Set<string | number>;
  onToggleFavorite: (productId: string | number) => void;
  featuredProductId?: string;
  bannerEnabled?: boolean;
  bannerText?: string;
  bannerSubtext?: string;
  showOffersOnly?: boolean;
  onClearOffersFilter?: () => void;
}

const Storefront: React.FC<StorefrontProps> = ({ products, onAddToCart, lang, onTrackOrderClick, favorites, onToggleFavorite, featuredProductId, bannerEnabled, bannerText, bannerSubtext, showOffersOnly, onClearOffersFilter }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('default');
  const [productImageIndexes, setProductImageIndexes] = useState<Record<string | number, number>>({});
  const [catalogBrands, setCatalogBrands] = useState<Record<string, string[]>>(BRAND_MODELS);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);

  const [activeOffers, setActiveOffers] = useState<SpecialOffer[]>([]);
  const [offersFilter, setOffersFilter] = useState(false);

  // Sync parent prop → local state
  useEffect(() => {
    if (showOffersOnly) setOffersFilter(true);
  }, [showOffersOnly]);

  const clearOffersFilter = () => {
    setOffersFilter(false);
    if (onClearOffersFilter) onClearOffersFilter();
  };

  useEffect(() => {
    getCatalog().then(c => {
      setCatalogBrands(c.brands);
      setCatalogCategories(c.categories);
    }).catch(() => { /* catalog fallback uses BRAND_MODELS defaults */ });
    getActiveOffers().then(setActiveOffers).catch(() => {});
  }, []);

  const featuredProduct = useMemo(() => {
    if (!featuredProductId) return null;
    return products.find(p => String(p.id) === featuredProductId) || null;
  }, [products, featuredProductId]);

  const getProductImageIndex = (productId: string | number) => productImageIndexes[productId] || 0;

  const setProductImageIndex = (productId: string | number, index: number) => {
    setProductImageIndexes(prev => ({ ...prev, [productId]: index }));
  };

  const nextProductImage = (productId: string | number, maxIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getProductImageIndex(productId);
    if (current < maxIndex) setProductImageIndex(productId, current + 1);
  };

  const prevProductImage = (productId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getProductImageIndex(productId);
    if (current > 0) setProductImageIndex(productId, current - 1);
  };

  // Touch swipe for product image carousels
  const touchStartRef = useRef<{ x: number; id: string | number } | null>(null);
  const handleProductTouchStart = (productId: string | number, e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, id: productId };
  };
  const handleProductTouchEnd = (productId: string | number, maxIndex: number, e: React.TouchEvent) => {
    if (!touchStartRef.current || touchStartRef.current.id !== productId) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 50) {
      const current = getProductImageIndex(productId);
      if (dx < 0 && current < maxIndex) setProductImageIndex(productId, current + 1);
      else if (dx > 0 && current > 0) setProductImageIndex(productId, current - 1);
    }
    touchStartRef.current = null;
  };

  const availableModels = selectedBrand ? catalogBrands[selectedBrand] || [] : [];

  const matchesAnyOffer = useMemo(() => {
    if (!offersFilter) return null;
    return (p: Product) => {
      // Products with a discounted price (originalPrice > price)
      if (p.originalPrice && p.originalPrice > 0 && p.originalPrice > p.price) return true;
      // Products matching active special offers
      return activeOffers.some(offer => {
        if (offer.type === 'buy_x_pay_y') {
          if (!offer.scope || offer.scope === 'all') return true;
          if (offer.scope === 'category') return p.category === offer.scopeValue;
          if (offer.scope === 'brand') return !!offer.scopeValue && (p.brands?.includes(offer.scopeValue) ?? false);
        }
        if (offer.type === 'gift_with_purchase') {
          return String(p.id) === offer.triggerProductId || String(p.id) === offer.giftProductId;
        }
        if (offer.type === 'buy_x_get_extra') {
          if (String(p.id) === offer.extraProductId) return true;
          if (!offer.scope || offer.scope === 'all') return true;
          if (offer.scope === 'category') return p.category === offer.scopeValue;
          if (offer.scope === 'brand') return !!offer.scopeValue && (p.brands?.includes(offer.scopeValue) ?? false);
        }
        return false;
      });
    };
  }, [offersFilter, activeOffers]);

  const displayProducts = useMemo(() => {
    const filtered = products.filter(p => {
      if (p.stock != null && p.stock <= 0) return false;
      if (matchesAnyOffer && !matchesAnyOffer(p)) return false;
      if (productSearch.trim()) {
        const searchLower = productSearch.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower) ||
          (p.brands && p.brands.some(b => b.toLowerCase().includes(searchLower)));
        if (!matchesSearch) return false;
      }
      if (selectedBrand && !p.isBundle && (!p.brands || !p.brands.includes(selectedBrand))) return false;
      if (selectedModel) {
        if (p.isBundle) return true;
        if (p.compatibleModels && !p.compatibleModels.includes(selectedModel)) return false;
      }
      if (selectedCategory && p.category !== selectedCategory && !p.isBundle) return false;
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'price-low': return [...filtered].sort((a, b) => a.price - b.price);
      case 'price-high': return [...filtered].sort((a, b) => b.price - a.price);
      case 'name-az': return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      default: return filtered;
    }
  }, [products, selectedBrand, selectedModel, selectedCategory, productSearch, sortBy, matchesAnyOffer]);

  const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
    'Carcasa': Smartphone, 'Protector de pantalla': Shield, 'Cargador': Zap, 'Cable': Plug,
    'Power Bank': Battery, 'Colgante': Layers, 'Audio': Headphones,
    // Backward compat for old English keys
    'Case': Smartphone, 'Screen Protector': Shield, 'Charger': Zap, 'Strap': Layers,
  };

  const dynamicCats = catalogCategories.length > 0
    ? catalogCategories.filter(c => c !== 'Bundle')
    : ['Carcasa', 'Protector de pantalla', 'Cargador', 'Cable', 'Power Bank', 'Colgante', 'Audio'];

  const CATEGORIES = [
    { id: '', label: 'All', icon: Grid },
    ...dynamicCats.map(cat => ({ id: cat, label: cat, icon: CATEGORY_ICONS[cat] || Tag })),
  ];

  const getCategoryLabel = (id: string) => {
    const map: Record<string, string> = {
      '': t('catAll'),
      'Carcasa': t('catCases'),
      'Protector de pantalla': t('catProtectors'),
      'Cargador': t('catChargers'),
      'Cable': t('catCables'),
      'Power Bank': t('catPowerBanks'),
      'Colgante': t('catStraps'),
      'Audio': t('catAudio'),
      // Backward compat for old English keys
      'Case': t('catCases'),
      'Screen Protector': t('catProtectors'),
      'Charger': t('catChargers'),
      'Strap': t('catStraps'),
    };
    return map[id] || id;
  };

  return (
    <div className="bg-brand-light min-h-screen pb-20 font-sans">
      {/* Promotional Banner */}
      {bannerEnabled && bannerText && (
        <div className="bg-brand-primary py-3 px-4" aria-label={bannerText}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-white text-sm">
            <div className="w-5 h-5 bg-brand-surface/20 rounded-full flex items-center justify-center">
              <Gift size={12} />
            </div>
            <span className="font-medium">{bannerText}</span>
            {bannerSubtext && (
              <>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="hidden sm:flex items-center gap-1.5 text-white/80">
                  <Clock size={14} />
                  {bannerSubtext}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Featured Product Hero */}
      {featuredProduct && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
          <div
            className="relative overflow-hidden rounded-2xl bg-brand-emphasis cursor-pointer group"
            onClick={() => navigate(productPath(featuredProduct.id))}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(productPath(featuredProduct.id)); } }}
            role="button"
            tabIndex={0}
            aria-label={featuredProduct.name}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 sm:p-8 md:p-10">
              {/* Text */}
              <div className="flex-1 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  <Star size={12} fill="currentColor" />
                  {t('featuredProductBadge', 'Producto destacado')}
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                  {featuredProduct.name}
                </h2>
                <p className="text-white/60 text-sm sm:text-base line-clamp-2 mb-5 max-w-lg">
                  {featuredProduct.description}
                </p>
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {'\u20AC'}{featuredProduct.price.toFixed(2)}
                    </span>
                    {featuredProduct.originalPrice && featuredProduct.originalPrice > featuredProduct.price && (
                      <span className="text-base text-white/40 line-through ml-2">
                        {'\u20AC'}{featuredProduct.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-brand-surface text-brand-dark px-5 py-2.5 rounded-lg font-semibold text-sm group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    {t('viewProduct', 'Ver producto')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
              {/* Image */}
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 flex-shrink-0 relative">
                <OptimizedImage
                  src={featuredProduct.images?.[0] || featuredProduct.image}
                  alt={featuredProduct.name}
                  width={288}
                  height={288}
                  sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 288px"
                  loading="eager"
                  className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            {/* Decorative */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-500/5 rounded-full blur-2xl" />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Categories Row */}
        <nav className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-8" aria-label={t('categoryNavigation', 'Product categories')}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isActive ? '' : cat.id)}
                aria-pressed={isActive}
                aria-label={getCategoryLabel(cat.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-emphasis text-white shadow-md'
                    : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:shadow-md border border-brand-border'
                }`}
              >
                <cat.icon size={16} />
                {getCategoryLabel(cat.id)}
              </button>
            );
          })}
        </nav>

        {/* Feature Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 mb-8 sm:mb-10">
          {/* Track Order Card */}
          <button
            onClick={() => onTrackOrderClick()}
            aria-label={t('trackTitle', 'Track your order')}
            className="group relative overflow-hidden rounded-lg bg-brand-surface p-6 text-left hover:shadow-md transition-shadow border border-brand-border"
          >
            <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Smartphone size={120} className="text-brand-primary" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-brand-primary-light rounded-lg flex items-center justify-center mb-4">
                <Search size={22} className="text-brand-primary" />
              </div>
              <h3 className="text-lg font-semibold text-brand-dark mb-1">{t('trackTitle')}</h3>
              <p className="text-brand-muted text-sm">{t('trackCardDesc')}</p>
              <div className="mt-4 flex items-center gap-1 text-brand-primary text-sm font-medium">
                {t('trackOrder', 'Track order')} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Special Offer Card */}
          <div
            onClick={() => { setOffersFilter(true); document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="group relative overflow-hidden rounded-lg bg-brand-accent p-6 text-white hover:shadow-md transition-shadow cursor-pointer"
            aria-label={t('offerTitle', 'Special offer')}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOffersFilter(true); document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' }); } }}
          >
            <div className="absolute -right-8 -top-8 opacity-10">
              <Percent size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-brand-surface/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={22} />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t('offerTitle')}</h3>
              <p className="text-white/70 text-sm">{t('offerDesc')}</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-brand-surface/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {t('limitedTime', 'Limited time')}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-brand-surface rounded-lg p-5 shadow-sm border border-brand-border mb-10" aria-label={t('filterProducts', 'Filter products')}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                placeholder={t('searchProducts')}
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                aria-label={t('searchProducts', 'Search products')}
                className="w-full pl-11 pr-4 py-3 bg-brand-input border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-brand-dark placeholder:text-brand-muted"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  aria-label={t('clearSearch', 'Clear search')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Brand Select */}
            <select
              className="px-4 py-3 bg-brand-input border border-brand-border rounded-lg text-sm text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none w-full md:min-w-[160px] md:w-auto cursor-pointer"
              value={selectedBrand}
              onChange={e => { setSelectedBrand(e.target.value); setSelectedModel(''); }}
              aria-label={t('allBrands', 'Select brand')}
            >
              <option value="">{t('allBrands')}</option>
              {Object.keys(catalogBrands).map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Model Select */}
            <select
              className="px-4 py-3 bg-brand-input border border-brand-border rounded-lg text-sm text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none w-full md:min-w-[160px] md:w-auto disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              disabled={!selectedBrand}
              aria-label={t('selectModel', 'Select model')}
            >
              <option value="">{selectedBrand ? t('selectModel') : t('selectBrandFirst')}</option>
              {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {offersFilter && (
              <div className="flex items-center gap-2 px-4 py-3 bg-brand-accent/10 border border-brand-accent/30 rounded-lg">
                <Tag size={14} className="text-brand-accent" />
                <span className="text-sm font-semibold text-brand-accent">{t('offersFilter', 'Ofertas')}</span>
                <button onClick={clearOffersFilter} className="ml-1 text-brand-accent hover:text-brand-dark transition-colors" aria-label={t('clearOffersFilter', 'Clear offers filter')}>
                  <X size={14} />
                </button>
              </div>
            )}

            {(selectedBrand || selectedCategory || productSearch || offersFilter) && (
              <button
                onClick={() => { setSelectedBrand(''); setSelectedModel(''); setSelectedCategory(''); setProductSearch(''); clearOffersFilter(); }}
                aria-label={t('clearFilters', 'Clear all filters')}
                className="px-4 py-3 text-brand-primary font-semibold text-sm hover:bg-brand-primary-light rounded-lg transition-colors"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div id="product-grid" aria-label={t('productGrid', 'Product listing')}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">
                {offersFilter ? t('offersTitle', 'Ofertas Especiales') : productSearch ? `"${productSearch}"` : selectedCategory ? getCategoryLabel(selectedCategory) : t('trending')}
              </h2>
              <p className="text-brand-muted text-sm mt-1">{displayProducts.length} {t('productsFound')}</p>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label={t('sortBy', 'Sort by')}
              className="px-4 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-sm text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none cursor-pointer"
            >
              <option value="default">{t('sortDefault', 'Relevance')}</option>
              <option value="price-low">{t('sortPriceLow', 'Price: low to high')}</option>
              <option value="price-high">{t('sortPriceHigh', 'Price: high to low')}</option>
              <option value="name-az">{t('sortNameAZ', 'Name: A-Z')}</option>
            </select>
          </div>

          {displayProducts.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
                <Search size={28} className="text-brand-muted" />
              </div>
              <h3 className="text-brand-dark font-semibold mb-1">{t('noProductsFound', 'No products found')}</h3>
              <p className="text-sm text-brand-muted max-w-xs">{t('noProductsFoundDesc', 'Try different filters or search terms')}</p>
              {(selectedBrand || selectedCategory || productSearch || offersFilter) && (
                <button
                  onClick={() => { setSelectedBrand(''); setSelectedModel(''); setSelectedCategory(''); setProductSearch(''); setSortBy('default'); clearOffersFilter(); }}
                  className="mt-4 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {displayProducts.map((product) => (
              <article
                key={product.id}
                className="group bg-brand-surface rounded-lg hover:shadow-md transition-shadow overflow-hidden border border-brand-border cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none"
                aria-label={product.name}
                tabIndex={0}
                onClick={() => navigate(productPath(product.id))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(productPath(product.id)); } }}
              >
                {/* Image with Carousel */}
                <div
                  className="relative aspect-square overflow-hidden bg-brand-light"
                  onTouchStart={(e) => handleProductTouchStart(product.id, e)}
                  onTouchEnd={(e) => {
                    const imgs = product.images?.length ? product.images : [product.image];
                    handleProductTouchEnd(product.id, imgs.length - 1, e);
                  }}
                  tabIndex={0}
                  role="region"
                  aria-roledescription="carousel"
                  aria-label={`${product.name} image gallery`}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      e.stopPropagation();
                      const imgs = product.images?.length ? product.images : [product.image];
                      const current = getProductImageIndex(product.id);
                      if (e.key === 'ArrowLeft' && current > 0) {
                        setProductImageIndex(product.id, current - 1);
                      } else if (e.key === 'ArrowRight' && current < imgs.length - 1) {
                        setProductImageIndex(product.id, current + 1);
                      }
                    }
                  }}
                >
                  {(() => {
                    const imgs = product.images?.length ? product.images : [product.image];
                    const currentIndex = getProductImageIndex(product.id);
                    const hasMultiple = imgs.length > 1;
                    return (
                      <>
                        <OptimizedImage
                          src={imgs[currentIndex] || product.image}
                          alt={`${product.name} - ${currentIndex + 1}`}
                          width={400}
                          height={400}
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Carousel Navigation Arrows */}
                        {hasMultiple && (
                          <>
                            <button
                              onClick={(e) => prevProductImage(product.id, e)}
                              disabled={currentIndex === 0}
                              aria-label={t('prevImage', 'Previous image')}
                              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-brand-surface/80 backdrop-blur-sm hover:bg-brand-surface rounded-full flex items-center justify-center shadow-md transition-all sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={(e) => nextProductImage(product.id, imgs.length - 1, e)}
                              disabled={currentIndex === imgs.length - 1}
                              aria-label={t('nextImage', 'Next image')}
                              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-brand-surface/80 backdrop-blur-sm hover:bg-brand-surface rounded-full flex items-center justify-center shadow-md transition-all sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </>
                        )}

                        {/* Pagination dots */}
                        {hasMultiple && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {imgs.map((_, i) => (
                              <span
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  i === currentIndex ? 'bg-brand-surface scale-125' : 'bg-brand-surface/40'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Badges */}
                  {product.isBundle && (
                    <div className="absolute top-3 left-3 bg-brand-accent text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <Flame size={12} fill="currentColor" /> {t('hotBundle')}
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
                    aria-label={favorites.has(product.id) ? t('removeFromFavorites', 'Remove from favorites') : t('addToFavorites', 'Add to favorites')}
                    aria-pressed={favorites.has(product.id)}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      favorites.has(product.id)
                        ? 'bg-brand-primary text-white shadow-md'
                        : 'bg-brand-surface/90 text-brand-muted hover:text-brand-primary hover:bg-brand-surface'
                    }`}
                  >
                    <Heart size={16} fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
                  </button>

                  {/* View Product Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-end justify-center pb-6">
                    <div className="bg-brand-surface text-brand-dark px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-md">
                      <Eye size={16} /> {t('viewProduct', 'Ver producto')}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5">

                  <span className="text-[11px] font-semibold text-brand-primary uppercase tracking-wider">
                    {product.brands?.join(' · ') || 'Universal'}
                  </span>

                  <h3 className="text-xs sm:text-sm font-semibold text-brand-dark mt-1 mb-2 sm:mb-3 line-clamp-2 min-h-[32px] sm:min-h-[40px] group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-base sm:text-lg font-bold text-brand-dark">{'\u20AC'}{product.price.toFixed(2)}</span>
                      {product.originalPrice && product.originalPrice > 0 && product.originalPrice > product.price && (
                        <span className="text-[10px] sm:text-xs text-brand-muted line-through ml-1 sm:ml-2">{'\u20AC'}{product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.colors && product.colors.length > 0) {
                          navigate(productPath(product.id));
                        } else {
                          onAddToCart(selectedModel && product.compatibleModels?.includes(selectedModel) ? { ...product, selectedModel } : product);
                        }
                      }}
                      aria-label={product.colors && product.colors.length > 0 ? t('viewProduct', 'Ver producto') : t('addToCart', 'Add to cart')}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-primary hover:bg-brand-primary-dark active:scale-95 text-white rounded-lg flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:shadow-md"
                    >
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {product.colors.slice(0, 5).map((color, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.colorImages?.[color] != null) {
                              setProductImageIndexes(prev => ({ ...prev, [product.id]: product.colorImages![color] }));
                            }
                          }}
                          className={`w-3 h-3 rounded-full border flex-shrink-0 transition-transform ${
                            product.colorImages?.[color] != null ? 'cursor-pointer hover:scale-125 border-brand-muted' : 'cursor-default border-brand-border'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      {product.colors.length > 5 && (
                        <span className="text-[10px] text-brand-muted ml-0.5">+{product.colors.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default React.memo(Storefront);
