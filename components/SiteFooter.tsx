import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../routes';
import { COMPANY } from '../config/company';

interface SiteFooterProps {
  customer: boolean;
  onCustomerAccountClick: () => void;
  onOpenCustomerAuth: () => void;
}

const SiteFooter: React.FC<SiteFooterProps> = ({ customer, onCustomerAccountClick, onOpenCustomerAuth }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <footer className="bg-brand-emphasis text-white py-16 px-4 border-t border-white/10" aria-label={t('ariaSiteFooter')}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
        <div className="space-y-4">
          <h3 className="text-3xl font-bold tracking-tight">{COMPANY.brandName}</h3>
          <p className="text-brand-text-tertiary text-sm font-light">{t('footerDescription') || 'Professional Mobile Repair & Premium Accessories. Redefining your tech experience since 2018.'}</p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-brand-text-tertiary">{t('footerSupport') || 'Support'}</h4>
          <ul className="text-sm text-brand-text-tertiary space-y-3">
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => window.location.href = `mailto:${COMPANY.email}?subject=Help Request`}>{t('footerHelpCenter') || 'Help Center'}</button>
            </li>
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.REPAIR_LOOKUP)}>{t('footerTrackOrder') || 'Track Order'}</button>
            </li>
            <li>
              <button
                className="hover:text-white transition-colors text-left"
                onClick={() => customer ? onCustomerAccountClick() : onOpenCustomerAuth()}
              >
                {t('customerMyAccount') || 'My Account'}
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-brand-text-tertiary">Nuestras Tiendas</h4>
          <ul className="text-sm text-brand-text-tertiary space-y-3">
            <li><button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LOCAL_PORRINO)}>📍 Galaxia Phone Porriño</button></li>
            <li><button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LOCAL_BAIONA)}>📍 Galaxia Phone Baiona</button></li>
            <li><button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LOCAL_LALIN)}>📍 Galaxia Phone Lalín</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-brand-text-tertiary">{t('footerLegal') || 'Legal'}</h4>
          <ul className="text-sm text-brand-text-tertiary space-y-3">
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LEGAL_PRIVACY)}>{t('footerPrivacyPolicy') || 'Privacy Policy'}</button>
            </li>
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LEGAL_TERMS)}>{t('footerTerms') || 'Terms & Conditions'}</button>
            </li>
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LEGAL_NOTICE)}>{t('footerLegalNotice') || 'Legal Notice'}</button>
            </li>
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LEGAL_COOKIES)}>{t('footerCookiePolicy') || 'Cookie Policy'}</button>
            </li>
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => navigate(ROUTES.LEGAL_RETURNS)}>{t('footerReturns') || 'Devoluciones'}</button>
            </li>
            <li>
              <button className="hover:text-white transition-colors text-left" onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}>{t('cookieManage') || 'Manage Cookies'}</button>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-xs text-brand-muted font-medium">
        &copy; {new Date().getFullYear()} {t('footerCopyright') || 'MovilNova Ecosystem. All rights reserved.'}
      </div>
    </footer>
  );
};

export default SiteFooter;
