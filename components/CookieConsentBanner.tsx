import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, Settings, ShieldCheck, BarChart3, Globe } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '../hooks/useCookieConsent';

interface CookieConsentBannerProps {
  onViewCookiePolicy: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onViewCookiePolicy }) => {
  const { t } = useTranslation();
  const {
    bannerVisible,
    preferences,
    acceptAll,
    rejectNonEssential,
    saveConsent,
  } = useCookieConsent();

  const [showSettings, setShowSettings] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences);

  const handleToggleAnalytics = () => {
    setLocalPrefs(prev => ({ ...prev, analytics: !prev.analytics }));
  };

  const handleSavePreferences = () => {
    saveConsent(localPrefs);
  };

  const handleOpenSettings = () => {
    setLocalPrefs(preferences);
    setShowSettings(!showSettings);
  };

  if (!bannerVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('cookieTitle', 'Uso de Cookies')}
    >
      <div className="max-w-4xl mx-auto bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Cookie size={20} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-brand-dark mb-1">
                {t('cookieTitle', 'Uso de Cookies')}
              </h3>
              <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
                {t('cookieDescription', 'Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar contenido. Puedes aceptar todas, rechazar las no esenciales o configurar tus preferencias.')}
              </p>
              <button
                onClick={onViewCookiePolicy}
                className="text-xs text-brand-primary hover:underline mt-1 font-medium"
              >
                {t('cookieViewPolicy', 'Ver Política de Cookies')}
              </button>
            </div>
          </div>

          {/* Settings panel (expandable) */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t border-brand-border space-y-3">
              {/* Essential cookies - always on */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-light">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ShieldCheck size={16} className="text-brand-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-brand-dark">
                      {t('cookieEssentialLabel', 'Cookies esenciales')}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {t('cookieEssentialDesc', 'Sesión, autenticación, PWA. Siempre activas.')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  {t('cookieAlwaysActive', 'Siempre activas')}
                </span>
              </div>

              {/* Analytics cookies - toggleable */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-light">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <BarChart3 size={16} className="text-brand-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-brand-dark">
                      {t('cookieAnalyticsLabel', 'Cookies de análisis')}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {t('cookieAnalyticsDesc', 'Sentry (monitoreo de rendimiento). Muestreo al 10%.')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleAnalytics}
                  role="switch"
                  aria-checked={localPrefs.analytics}
                  aria-label={t('cookieAnalyticsLabel', 'Cookies de análisis')}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                    localPrefs.analytics ? 'bg-brand-primary' : 'bg-brand-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-brand-surface rounded-full shadow transition-transform duration-200 ${
                      localPrefs.analytics ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Functional cookies - always on */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-light">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Globe size={16} className="text-brand-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-brand-dark">
                      {t('cookieFunctionalLabel', 'Cookies funcionales')}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {t('cookieFunctionalDesc', 'Preferencia de idioma (i18next). Siempre activas.')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  {t('cookieAlwaysActive', 'Siempre activas')}
                </span>
              </div>

              {/* Save preferences button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSavePreferences}
                  className="px-5 py-2.5 text-xs md:text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shadow-sm"
                >
                  {t('cookieSavePreferences', 'Guardar preferencias')}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons - RGPD: Accept and Reject must have EQUAL prominence */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs md:text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shadow-sm"
            >
              {t('cookieAcceptAll', 'Aceptar todas')}
            </button>
            <button
              onClick={rejectNonEssential}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs md:text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shadow-sm"
            >
              {t('cookieRejectNonEssential', 'Rechazar no esenciales')}
            </button>
            <button
              onClick={handleOpenSettings}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs md:text-sm font-medium rounded-lg border border-brand-border text-brand-dark hover:bg-brand-light transition-colors flex items-center justify-center gap-1.5"
            >
              <Settings size={14} />
              {t('cookieSettings', 'Configurar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
