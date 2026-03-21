import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, User, Sun, Moon } from 'lucide-react';
import { ROUTES } from '../routes';
import type { ThemeMode } from '../hooks/useTheme';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  customer: { displayName: string } | null;
  onCustomerAccountClick: () => void;
  onSignInClick: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  isDark: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, customer, onCustomerAccountClick, onSignInClick, themeMode, onThemeChange, isDark }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[60] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-0 top-0 h-full w-72 bg-brand-surface z-[70] shadow-lg border-r border-brand-border flex flex-col animate-in slide-in-from-left duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={t('ariaMobileNav')}
      >
        <div className="p-6 border-b border-brand-border flex justify-between items-center">
          <span className="text-xl font-bold text-brand-dark">{t('mobileMenuTitle') || 'Menu'}</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-light transition-colors" aria-label={t('ariaClose')}>
            <X size={24} className="text-brand-muted" />
          </button>
        </div>
        <div className="flex-1 p-4 space-y-1">
          <button
            onClick={() => handleNavClick(ROUTES.HOME)}
            className="w-full text-left p-4 rounded-lg hover:bg-brand-light font-semibold text-brand-dark transition-colors"
            role="menuitem"
          >
            {t('navShop')}
          </button>
          <button
            onClick={() => handleNavClick(ROUTES.REPAIR_LOOKUP)}
            className="w-full text-left p-4 rounded-lg hover:bg-brand-light font-semibold text-brand-dark transition-colors"
            role="menuitem"
          >
            {t('navTrack')}
          </button>
          <div className="border-t border-brand-border my-2" />
          {customer ? (
            <button
              onClick={() => { onCustomerAccountClick(); onClose(); }}
              className="w-full text-left p-4 rounded-lg hover:bg-brand-light font-semibold text-brand-dark flex items-center gap-2 transition-colors"
              role="menuitem"
            >
              <User size={16} className="text-brand-primary" /> {t('customerMyAccount') || 'My Account'}
            </button>
          ) : (
            <button
              onClick={() => { onSignInClick(); onClose(); }}
              className="w-full text-left p-4 rounded-lg hover:bg-brand-light font-semibold text-brand-primary flex items-center gap-2 transition-colors"
              role="menuitem"
            >
              <User size={16} /> {t('customerLogin') || 'Sign In'}
            </button>
          )}

          {/* Theme Toggle */}
          <div className="border-t border-brand-border my-2" />
          <button
            onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
            className="w-full text-left p-4 rounded-lg hover:bg-brand-light font-semibold text-brand-dark flex items-center gap-2 transition-colors"
            role="menuitem"
          >
            {isDark ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-brand-muted" />}
            {isDark ? t('themeLight') : t('themeDark')}
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
