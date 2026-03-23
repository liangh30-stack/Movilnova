import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, User, Globe, Menu, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import { Language } from '../types';
import { ROUTES } from '../routes';
import { LegacyLanguage } from '../i18n';
import { AdminUser } from '../services/authService';
import { COMPANY } from '../config/company';
import type { ThemeMode } from '../hooks/useTheme';

interface NavBarProps {
  lang: Language;
  onLanguageChange: (lang: LegacyLanguage) => void;
  isLangMenuOpen: boolean;
  setIsLangMenuOpen: (open: boolean) => void;
  cartItemCount: number;
  onCartClick: () => void;
  onUserClick: () => void;
  onMobileMenuClick: () => void;
  adminUser: AdminUser | null;
  customer: { displayName: string } | null;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  isDark: boolean;
}


export const NavBar: React.FC<NavBarProps> = ({
  lang,
  onLanguageChange,
  isLangMenuOpen,
  setIsLangMenuOpen,
  cartItemCount,
  onCartClick,
  onUserClick,
  onMobileMenuClick,
  adminUser,
  customer,
  themeMode,
  onThemeChange,
  isDark,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: t('navShop'), path: ROUTES.HOME },
    { label: t('navCatalog') || 'Productos', path: ROUTES.CATALOG },
    { label: t('navTrack'), path: ROUTES.REPAIR_LOOKUP },
  ];

  const themeLabel = isDark ? t('themeLight') : t('themeDark');

  return (
    <nav className="fixed w-full z-50 bg-brand-surface border-b border-brand-border transition-colors" aria-label={t('ariaMainNav')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            className="flex items-center gap-3 cursor-pointer group bg-transparent border-none p-0"
            onClick={() => navigate(ROUTES.HOME)}
            aria-label={t('ariaGoHome')}
          >
            <div className="w-9 h-9 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-brand-primary-dark transition-colors">
              <span className="text-white font-bold text-sm">MN</span>
            </div>
            <span className="hidden sm:inline text-xl font-bold text-brand-dark tracking-tight">{COMPANY.brandName}</span>
          </button>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-primary bg-brand-primary-light font-semibold'
                      : 'text-brand-muted hover:text-brand-dark hover:bg-brand-light'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button
              onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
              className="p-2 text-brand-muted hover:text-brand-dark transition-colors rounded-lg hover:bg-brand-light"
              aria-label={themeLabel}
              title={themeLabel}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1 text-brand-muted hover:text-brand-dark transition-colors px-3 py-2 rounded-lg hover:bg-brand-light"
                aria-label={t('ariaSelectLang')}
                aria-expanded={isLangMenuOpen}
                aria-haspopup="menu"
              >
                <Globe size={16} />
                <span className="text-xs font-medium hidden sm:inline">{lang}</span>
                <ChevronDown size={12} className="hidden sm:block" />
              </button>
              {isLangMenuOpen && (
                <div className="absolute top-12 right-0 bg-brand-surface rounded-lg shadow-lg border border-brand-border overflow-hidden min-w-[120px] py-1" role="menu" aria-label={t('ariaLangOptions')}>
                  {(['EN', 'CN', 'ES', 'FR', 'DE'] as LegacyLanguage[]).map(l => (
                    <button
                      key={l}
                      onClick={() => onLanguageChange(l)}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                        lang === l
                          ? 'text-brand-primary bg-brand-primary-light'
                          : 'text-brand-muted hover:text-brand-dark hover:bg-brand-light'
                      }`}
                    >
                      {l === 'EN' && '🇺🇸 English'}
                      {l === 'CN' && '🇨🇳 中文'}
                      {l === 'ES' && '🇪🇸 Español'}
                      {l === 'FR' && '🇫🇷 Français'}
                      {l === 'DE' && '🇩🇪 Deutsch'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-brand-muted hover:text-brand-dark transition-colors rounded-lg hover:bg-brand-light"
              aria-label={t('ariaShoppingCart')}
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-critical text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Admin Panel */}
            {adminUser && (
              <button
                onClick={() => navigate(ROUTES.ADMIN)}
                className={`p-2 rounded-lg transition-colors ${
                  location.pathname === ROUTES.ADMIN
                    ? 'text-brand-primary bg-brand-primary-light'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-brand-light'
                }`}
                title={t('ariaAdminPanel')}
                aria-label={t('ariaAdminPanel')}
              >
                <Settings size={20} />
              </button>
            )}

            {/* User */}
            <button
              className={`p-2 rounded-lg transition-colors ${
                customer
                  ? 'text-brand-primary bg-brand-primary-light'
                  : 'text-brand-muted hover:text-brand-dark hover:bg-brand-light'
              }`}
              onClick={onUserClick}
              aria-label={t('ariaUserAccount')}
            >
              {customer ? (
                <div className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {customer.displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User size={20} />
              )}
            </button>

            {/* Mobile Menu */}
            <button
              className="md:hidden p-2 text-brand-muted hover:text-brand-dark rounded-lg hover:bg-brand-light"
              onClick={onMobileMenuClick}
              aria-label={t('ariaOpenMenu')}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
