import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, X, MessageCircle, Phone } from 'lucide-react';
import { COMPANY } from '../config/company';

/**
 * Botón flotante de WhatsApp + Reparación.
 * Aparece después de 3 segundos de scroll para no ser intrusivo,
 * pero captura a los usuarios que están considerando una compra o reparación.
 */
const FloatingCTA: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar después de un pequeño scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // También mostrar después de 5 segundos si no hay scroll
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible) return null;

  const whatsappUrl = `https://wa.me/${COMPANY.phone.replace(/\s+/g, '').replace('+', '')}?text=${encodeURIComponent('Hola, necesito información sobre reparación')}`;
  const phoneUrl = `tel:${COMPANY.phone}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Expanded menu */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2">
          {/* Llamar */}
          <a
            href={phoneUrl}
            className="flex items-center gap-3 bg-brand-surface text-brand-dark px-5 py-3 rounded-xl shadow-lg border border-brand-border hover:shadow-xl transition-all hover:scale-105 text-sm font-semibold"
          >
            <Phone size={18} className="text-brand-primary" />
            Llamar ahora
          </a>

          {/* Reparación */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-brand-surface text-brand-dark px-5 py-3 rounded-xl shadow-lg border border-brand-border hover:shadow-xl transition-all hover:scale-105 text-sm font-semibold"
          >
            <Wrench size={18} className="text-brand-accent" />
            Reservar reparación
          </a>
        </div>
      )}

      {/* Main WhatsApp button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group relative bg-[#25D366] hover:bg-[#20b858] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 ${
          isExpanded ? 'rotate-0' : ''
        }`}
        aria-label="Contactar"
      >
        {isExpanded ? (
          <X size={24} />
        ) : (
          <>
            <MessageCircle size={24} />
            {/* Ping dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-critical rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-critical rounded-full" />
          </>
        )}
      </button>
    </div>
  );
};

export default FloatingCTA;
