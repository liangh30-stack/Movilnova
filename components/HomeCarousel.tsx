import React from 'react';
import { useTranslation } from 'react-i18next';

interface HomeCarouselProps {
  carouselIndex: number;
  setCarouselIndex: (index: number) => void;
  layerOne: React.ReactNode;
}

const HomeCarousel: React.FC<HomeCarouselProps> = ({ carouselIndex, setCarouselIndex, layerOne }) => {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden" role="region" aria-roledescription="carousel" aria-label={t('ariaFeaturedContent')}>
      <div role="tabpanel" aria-label={t('ariaSlide', { number: 1 })}>
        {layerOne}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        <button
          className={`w-2.5 h-2.5 rounded-full transition-all ${carouselIndex === 0 ? 'bg-brand-primary w-8' : 'bg-brand-text-tertiary/40 hover:bg-brand-text-tertiary/60'}`}
          onClick={() => setCarouselIndex(0)}
          aria-label={t('ariaSlide', { number: 1 })}
        />
      </div>
    </div>
  );
};

export default HomeCarousel;
