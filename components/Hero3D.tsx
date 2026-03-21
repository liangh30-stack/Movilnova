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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-1/3 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-brand-primary/5 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Content */}
          <div className="space-y-8">
            {/* Main Title with gradient */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-brand-dark leading-[1.05] tracking-tight">
                {t('heroTitle2Line1')}
              </h1>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-clip-text text-transparent animate-gradient">
                {t('heroTitle2Line2')}
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-xl text-brand-muted max-w-xl leading-relaxed font-medium">
              {t('heroSubtitle2')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={scrollToProducts}
                className="group relative bg-gradient-to-r from-brand-primary to-brand-accent hover:shadow-2xl hover:shadow-brand-primary/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="relative z-10">{t('heroShopNow')}</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-accent to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => { if (onViewOffers) onViewOffers(); else scrollToProducts(); }}
                className="group bg-brand-surface hover:bg-brand-surface text-brand-dark px-8 py-4 rounded-xl font-bold text-lg transition-all border-2 border-brand-border hover:border-brand-primary flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                {t('heroViewOffers')}
                <TrendingUp size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Rotating feature indicators */}
            <div className="flex gap-4 pt-8">
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

          {/* Right: Rotating product showcase */}
          <div className="hidden lg:block relative h-[500px]">
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
                  loading="lazy"
                  decoding="async"
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
