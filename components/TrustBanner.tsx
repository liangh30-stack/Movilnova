import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Truck, Clock, Star } from 'lucide-react';

/**
 * Barra de confianza fija debajo del navbar.
 * Muestra los 4 pilares de confianza que reducen la fricción de compra.
 * Visible en todas las páginas — refuerza la decisión de compra/reserva.
 */
const TrustBanner: React.FC = () => {
  const { t } = useTranslation();

  const items = [
    { icon: Truck, text: t('trustFreeShipping', 'Envío gratis +50€') },
    { icon: Shield, text: t('trustWarranty', 'Garantía 6 meses') },
    { icon: Clock, text: t('trustRepair', 'Reparación en el día') },
    { icon: Star, text: t('trustRating', '4.7★ valoración') },
  ];

  return (
    <div className="bg-brand-primary text-white text-xs sm:text-sm font-medium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between sm:justify-center gap-6 sm:gap-10 py-2 min-w-max sm:min-w-0">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 whitespace-nowrap">
              <item.icon size={14} className="opacity-80 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBanner;
