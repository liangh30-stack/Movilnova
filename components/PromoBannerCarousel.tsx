import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface PromoBannerCarouselProps {
  shopBannerEnabled?: boolean;
  shopBannerText?: string;
  shopBannerSubtext?: string;
}

const PromoBannerCarousel: React.FC<PromoBannerCarouselProps> = ({
  shopBannerEnabled,
  shopBannerText,
  shopBannerSubtext,
}) => {
  const { t } = useTranslation();
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(true);

  const slides = useMemo(() => {
    const list: { icon: string; text: string; sub: string; gradient: string }[] = [
      {
        icon: '🎉',
        text: t('promoNewUserTitle', '¡Bienvenido! 5€ de descuento en tu primera compra'),
        sub: t('promoNewUserSub', 'Usa el código BIENVENIDO5 al finalizar el pedido'),
        gradient: 'from-emerald-500 to-teal-600',
      },
    ];
    if (shopBannerEnabled && shopBannerText) {
      list.push({
        icon: '🔥',
        text: shopBannerText,
        sub: shopBannerSubtext || '',
        gradient: 'from-brand-primary to-brand-accent',
      });
    }
    return list;
  }, [shopBannerEnabled, shopBannerText, shopBannerSubtext, t]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSlide(prev => (prev + 1) % slides.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const current = slides[slide];

  return (
    <div className={`relative w-full bg-gradient-to-r ${current.gradient} transition-colors duration-700`}>
      <div
        className={`max-w-7xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-center gap-3 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="text-2xl sm:text-3xl leading-none select-none">{current.icon}</span>
        <div className="text-center text-white">
          <p className="font-bold text-sm sm:text-base md:text-lg leading-tight">{current.text}</p>
          {current.sub && (
            <p className="text-white/80 text-xs sm:text-sm mt-0.5">{current.sub}</p>
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setVisible(false);
                setTimeout(() => { setSlide(i); setVisible(true); }, 200);
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBannerCarousel;
