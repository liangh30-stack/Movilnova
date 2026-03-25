import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Shield, Zap, Star, TrendingUp, Package } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product } from '../types';
import { productPath } from '../routes';

interface Hero3DProps {
  onViewOffers?: () => void;
  products?: Product[];
}

const Hero3D: React.FC<Hero3DProps> = ({ onViewOffers, products = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [productIndex, setProductIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0); // 0=shop, 1=repair
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});

  // Fetch average ratings for all products once
  useEffect(() => {
    getDocs(collection(db, 'productReviews')).then(snap => {
      const buckets: Record<string, { sum: number; count: number }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const pid = data.productId as string;
        if (!buckets[pid]) buckets[pid] = { sum: 0, count: 0 };
        buckets[pid].sum += (data.rating as number) || 0;
        buckets[pid].count += 1;
      });
      const map: Record<string, number> = {};
      for (const [pid, b] of Object.entries(buckets)) {
        map[pid] = Math.round((b.sum / b.count) * 10) / 10;
      }
      setRatingsMap(map);
    }).catch(() => {});
  }, []);

  const scrollToProducts = () => {
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-rotate hero slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setHeroSlide(s => (s + 1) % 2), 5000);
    return () => clearInterval(timer);
  }, []);

  // Shuffle products once at mount so the rotation order is random
  const shuffledProducts = useMemo(() => {
    const available = products.filter(p => p.image && (p.stock == null || p.stock > 0));
    if (available.length === 0) return [];
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [products]);

  const currentProduct = shuffledProducts.length > 0 ? shuffledProducts[productIndex % shuffledProducts.length] : null;
  const currentRating = currentProduct ? (ratingsMap[String(currentProduct.id)] ?? 0) : 0;

  const features = [
    { icon: Shield, title: t('heroWarranty'), desc: t('heroProtection') || '24-month guarantee' },
    { icon: Zap, title: t('heroFreeShipping'), desc: t('heroDelivery') || 'Express delivery' },
    { icon: Star, title: t('heroRating'), desc: t('heroWorldwide') || '4.9/5 rating' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Rotate product every 5s with fade transition
  const rotateProduct = useCallback(() => {
    if (shuffledProducts.length <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setProductIndex(prev => (prev + 1) % shuffledProducts.length);
      setIsFading(false);
    }, 300);
  }, [shuffledProducts.length]);

  useEffect(() => {
    if (shuffledProducts.length <= 1) return;
    const interval = setInterval(rotateProduct, 5000);
    return () => clearInterval(interval);
  }, [rotateProduct, shuffledProducts.length]);

  const discount = currentProduct?.originalPrice && currentProduct.originalPrice > currentProduct.price
    ? Math.round((1 - currentProduct.price / currentProduct.originalPrice) * 100)
    : 0;

  return (
    <div className="relative min-h-[75vh] lg:min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-brand-primary/5 via-brand-light to-brand-accent/5">
      {/* Repair slide background image */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === 1 ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
        <img src="/repair-hero-final.jpg" alt="Reparación profesional" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
      </div>
      {/* Shop slide background image */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === 0 ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
        <img src="/shop-hero.jpg" alt="Accesorios para móviles" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Content — alternates between shop & repair slides */}
          <div className="space-y-8">
            {/* Slide dots */}
            <div className="flex gap-2">
              {[0,1].map(i => (
                <button key={i} onClick={() => setHeroSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${heroSlide === i ? 'bg-brand-primary w-8' : 'bg-brand-border w-4'}`} />
              ))}
            </div>

            {/* SLIDE 0: Shop */}
            <div className={`transition-all duration-500 ${heroSlide === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute pointer-events-none'}`}>
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-brand-dark leading-[1.05] tracking-tight">
                  {t('heroTitle2Line1')}
                </h1>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-clip-text text-transparent animate-gradient">
                  {t('heroTitle2Line2')}
                </h2>
              </div>
              <p className="text-xl text-brand-muted max-w-xl leading-relaxed font-medium mt-4">
                {t('heroSubtitle2')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={scrollToProducts}
                  className="group relative bg-gradient-to-r from-brand-primary to-brand-accent hover:shadow-2xl hover:shadow-brand-primary/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden">
                  <span className="relative z-10">{t('heroShopNow')}</span>
                  <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-accent to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => { if (onViewOffers) onViewOffers(); else scrollToProducts(); }}
                  className="group bg-brand-surface text-brand-dark px-8 py-4 rounded-xl font-bold text-lg transition-all border-2 border-brand-border hover:border-brand-primary flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                  {t('heroViewOffers')}
                  <TrendingUp size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* SLIDE 1: Repair */}
            <div className={`transition-all duration-500 ${heroSlide === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 absolute pointer-events-none'}`}>
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight drop-shadow-lg">
                  ¿Pantalla rota?
                </h1>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-[#25D366] drop-shadow-lg">
                  Lo reparamos hoy
                </h2>
              </div>
              <p className="text-xl text-white/90 max-w-xl leading-relaxed font-medium mt-4 drop-shadow">
                Servicio técnico profesional · Diagnóstico gratis · Garantía 6 meses · Más de 20 talleres en Galicia
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a href="https://wa.me/34603936978?text=Hola%2C%20necesito%20reparaci%C3%B3n" target="_blank" rel="noopener noreferrer"
                  className="group relative bg-[#25D366] hover:bg-[#20b858] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Contactar por WhatsApp
                </a>
                <button onClick={() => navigate('/reparaciones')}
                  className="group bg-brand-surface text-brand-dark px-8 py-4 rounded-xl font-bold text-lg transition-all border-2 border-brand-border hover:border-brand-primary flex items-center justify-center gap-2">
                  Ver precios
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* WhatsApp repair CTA (slide 0 only) */}
            {heroSlide === 0 && <div className="pt-2">
              <a href="https://wa.me/34603936978?text=Hola%2C%20tengo%20el%20m%C3%B3vil%20roto%20y%20necesito%20reparaci%C3%B3n"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                ¿Móvil roto? Escríbenos ahora
              </a>
            </div>}

            {/* Rotating feature indicators — shop slide only */}
            <div className={`flex gap-4 pt-8 transition-all duration-500 ${heroSlide === 1 ? 'opacity-0 pointer-events-none h-0 overflow-hidden pt-0' : ''}`}>
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-500 ${
                    activeFeature === idx
                      ? 'bg-brand-surface border-2 border-brand-primary shadow-lg scale-105'
                      : 'bg-brand-surface/50 border border-brand-border opacity-60'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    activeFeature === idx ? 'bg-brand-primary text-white' : 'bg-brand-primary-light text-brand-primary'
                  }`}>
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <p className="text-brand-dark font-bold text-sm">{feature.title}</p>
                    <p className="text-brand-muted text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Rotating product showcase — shop slide only */}
          <div className={`hidden lg:block relative h-[500px] transition-all duration-500 ${heroSlide === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Floating product card */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-brand-surface rounded-2xl border border-brand-border shadow-2xl overflow-hidden hover:shadow-brand-primary/20 hover:scale-105 transition-all duration-500 cursor-pointer group ${
                isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              onClick={() => currentProduct ? navigate(productPath(currentProduct.id)) : scrollToProducts()}
            >
              <div className="relative h-56 bg-gradient-to-br from-brand-light to-brand-primary/10 flex items-center justify-center overflow-hidden">
                <img
                  src={currentProduct?.images?.[0] || currentProduct?.image || 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=300&fit=crop'}
                  alt={currentProduct?.name || t('ariaFeaturedProduct')}
                  width={320}
                  height={224}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  {currentProduct?.isBundle && (
                    <span className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-lg">
                      BUNDLE
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-brand-accent to-orange-500 text-white text-xs font-bold rounded-lg shadow-lg">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-brand-dark mb-3 group-hover:text-brand-primary transition-colors line-clamp-1">
                  {currentProduct?.name || t('heroFeaturedProduct')}
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-black text-brand-dark">
                    €{currentProduct ? currentProduct.price.toFixed(2) : '19.99'}
                  </span>
                  {currentProduct?.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                    <span className="text-base text-brand-muted line-through">
                      €{currentProduct.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < Math.round(currentRating) ? 'currentColor' : 'none'} className={i < Math.round(currentRating) ? 'text-brand-accent' : 'text-brand-border'} />
                    ))}
                  </div>
                  {currentProduct?.brands && currentProduct.brands.length > 0 && (
                    <span className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
                      {currentProduct.brands.join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            <div className="absolute top-12 right-4 bg-brand-surface/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-brand-border animate-float">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-brand-muted font-semibold">{t('heroOrdersToday') || 'Orders Today'}</p>
                  <p className="text-2xl font-black text-brand-dark">{t('heroOrdersCount') || '2,847'}</p>
                </div>
              </div>
            </div>

            <div className={`absolute bottom-4 left-4 bg-brand-surface/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-brand-border animate-float delay-500 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-accent to-orange-500 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs text-brand-muted font-semibold">{t('heroCustomerRating') || 'Customer Rating'}</p>
                  <p className="text-2xl font-black text-brand-dark">{currentRating > 0 ? `${currentRating.toFixed(1)}/5.0` : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float.delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
};

export default Hero3D;
