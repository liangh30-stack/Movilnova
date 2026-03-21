import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppUser, hasAdminAccess } from '../services/authService';
import {
  Package,
  ShoppingCart,
  Users,
  LogOut,
  ArrowLeft,
  Settings,
  Menu,
  X,
  ChevronRight,
  UserCog,
  BarChart3,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import ProductManager from './ProductManager';
import OrdersManager from './OrdersManager';
import UsersManager from './UsersManager';
import ShopSettingsManager from './ShopSettingsManager';
import { COMPANY } from '../config/company';

const UserRolesManager = lazy(() => import('./UserRolesManager'));
const SalesAnalyticsManager = lazy(() => import('./SalesAnalyticsManager'));
const AuditLogViewer = lazy(() => import('./AuditLogViewer'));

interface AdminPanelProps {
  user: AppUser;
  onLogout: () => void;
  onBack: () => void;
}

type TabId = 'products' | 'orders' | 'users' | 'settings' | 'userRoles' | 'salesAnalytics' | 'auditLog';

const NAV_ITEMS: { id: TabId; labelKey: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'products', labelKey: 'adminNavProducts', icon: Package },
  { id: 'orders', labelKey: 'adminNavOrders', icon: ShoppingCart },
  { id: 'users', labelKey: 'adminNavCustomers', icon: Users },
  { id: 'settings', labelKey: 'adminNavSettings', icon: Settings },
];

const SUPERADMIN_NAV_ITEMS: typeof NAV_ITEMS = [
  { id: 'userRoles', labelKey: 'adminNavUserRoles', icon: UserCog },
  { id: 'salesAnalytics', labelKey: 'adminNavSalesAnalytics', icon: BarChart3 },
  { id: 'auditLog', labelKey: 'adminNavAuditLog', icon: ClipboardList },
];

const LazyLoader = () => (
  <div className="flex items-center justify-center py-32">
    <Loader2 size={32} className="animate-spin text-brand-primary" />
  </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout, onBack }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const editProductId = searchParams.get('edit');

  // Clear edit param after it's been consumed
  useEffect(() => {
    if (editProductId) {
      setActiveTab('products');
    }
  }, [editProductId]);

  if (!user || !hasAdminAccess(user.role)) return null;

  const isSuperadmin = user.role === 'superadmin';
  const visibleNavItems = isSuperadmin ? [...NAV_ITEMS, ...SUPERADMIN_NAV_ITEMS] : NAV_ITEMS;
  const initials = (user.email || 'A').charAt(0).toUpperCase();

  const renderContent = () => {
    switch (activeTab) {
      case 'products': return <ProductManager user={user} onLogout={onLogout} onBack={onBack} editProductId={editProductId} />;
      case 'orders': return <OrdersManager user={user} />;
      case 'users': return <UsersManager user={user} />;
      case 'settings': return <ShopSettingsManager user={user} />;
      case 'userRoles': return <Suspense fallback={<LazyLoader />}><UserRolesManager user={user} /></Suspense>;
      case 'salesAnalytics': return <Suspense fallback={<LazyLoader />}><SalesAnalyticsManager user={user} /></Suspense>;
      case 'auditLog': return <Suspense fallback={<LazyLoader />}><AuditLogViewer user={user} /></Suspense>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#111113] flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-[15px] tracking-tight">{COMPANY.brandName}</h1>
              <p className="text-[11px] text-white/40 font-medium">{t('adminPanelLabel')}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            const isSuperSection = idx >= NAV_ITEMS.length;
            return (
              <React.Fragment key={item.id}>
                {isSuperSection && idx === NAV_ITEMS.length && (
                  <div className="pt-3 pb-1.5 px-3">
                    <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">{t('adminSuperadminSection', 'Superadmin')}</p>
                  </div>
                )}
                <button
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-brand-primary' : ''} />
                  <span>{t(item.labelKey)}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-white/20" />}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft size={18} />
            <span>{t('adminBackToShop')}</span>
          </button>

          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.04]">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.email}</p>
              <p className="text-white/30 text-[10px]">{isSuperadmin ? t('adminRoleSuperadmin') : t('adminRoleAdmin')}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-white/30 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors flex-shrink-0"
              title={t('adminLogout')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-brand-surface border-b border-brand-border px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-brand-muted hover:bg-brand-light rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-primary flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">T</span>
            </div>
            <span className="font-semibold text-sm text-brand-dark">
              {t(visibleNavItems.find(n => n.id === activeTab)?.labelKey || '')}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
