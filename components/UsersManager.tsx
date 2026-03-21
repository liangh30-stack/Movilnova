import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUser } from '../services/authService';
import { Customer, Order, OrderStatus } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../services/firebase';
import { getCustomerOrders } from '../services/orderService';
import {
  Users,
  Search,
  Mail,
  Calendar,
  UserCheck,
  Eye,
  Trash2,
  Loader2,
  X,
  Phone,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Package,
  Truck,
  Clock,
  CreditCard,
  XCircle,
  Euro,
  TrendingUp,
  Hash,
  User,
} from 'lucide-react';

interface UsersManagerProps {
  user: AppUser;
}

type ModalTab = 'info' | 'orders';

const UsersManager: React.FC<UsersManagerProps> = () => {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Order history state
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('info');

  const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; bg: string; dot: string }> = useMemo(() => ({
    Pending:    { label: t('ordersStatusPending'),    icon: <Clock size={12} />,      color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',     dot: 'bg-amber-500' },
    Processing: { label: t('ordersStatusProcessing'), icon: <Loader2 size={12} />,    color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',       dot: 'bg-blue-500' },
    Paid:       { label: t('ordersStatusPaid'),       icon: <CreditCard size={12} />, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    Shipped:    { label: t('ordersStatusShipped'),    icon: <Truck size={12} />,      color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200',   dot: 'bg-violet-500' },
    Delivered:  { label: t('ordersStatusDelivered'),  icon: <Package size={12} />,    color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',     dot: 'bg-green-500' },
    Cancelled:  { label: t('ordersStatusCancelled'),  icon: <XCircle size={12} />,    color: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',         dot: 'bg-red-500' },
  }), [t]);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, 'customers'));
      setCustomers(snapshot.docs.map(d => ({ ...d.data(), uid: d.id })) as Customer[]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error loading customers:', err);
      setError(t('usersLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  // Load orders when a customer is selected
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerOrders([]);
      return;
    }
    setActiveModalTab('info');
    setLoadingOrders(true);
    getCustomerOrders(selectedCustomer.uid, selectedCustomer.email)
      .then(orders => setCustomerOrders(orders))
      .catch(err => { if (import.meta.env.DEV) console.error('Error loading customer orders:', err); setCustomerOrders([]); })
      .finally(() => setLoadingOrders(false));
  }, [selectedCustomer]);

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm(t('usersDeleteConfirm'))) return;
    setIsDeleting(true);
    try {
      const functions = getFunctions(app);
      const deleteAccount = httpsCallable(functions, 'deleteCustomerAccount');
      await deleteAccount({ uid: customerId });
      setCustomers(prev => prev.filter(c => c.uid !== customerId));
      setSelectedCustomer(null);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error deleting customer:', err);
      alert(t('usersDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openOrdersTab = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Tab will be switched after orders load in the next render via useEffect
    // We set it here so UX is instant
    setActiveModalTab('orders');
  };

  const filteredCustomers = customers.filter(c =>
    c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const newLast7Days = customers.filter(
    c => c.createdAt && new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  // Order stats for selected customer
  const orderStats = useMemo(() => {
    if (!customerOrders.length) return null;
    const totalSpent = customerOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.total, 0);
    const delivered = customerOrders.filter(o => o.status === 'Delivered').length;
    const lastOrder = customerOrders.reduce((latest, o) =>
      new Date(o.createdAt) > new Date(latest.createdAt) ? o : latest
    );
    const avgOrderValue = totalSpent / (customerOrders.filter(o => o.status !== 'Cancelled').length || 1);
    return { totalSpent, delivered, lastOrder, avgOrderValue };
  }, [customerOrders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-brand-text-tertiary">{t('usersLoading')}</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: t('usersTotalClients'), value: customers.length, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('usersNew7Days'), value: newLast7Days, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('usersResults'), value: filteredCustomers.length, icon: Search, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">{t('usersTitle')}</h2>
          <p className="text-sm text-brand-text-tertiary mt-0.5">{t('usersSubtitle')}</p>
        </div>
        <button
          onClick={loadCustomers}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-brand-muted bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-light transition-colors"
        >
          <RefreshCw size={14} />
          {t('usersRefresh')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark tracking-tight">{kpi.value}</p>
            <p className="text-xs font-medium text-brand-text-tertiary uppercase tracking-wide mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-400 dark:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={t('usersSearchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="mx-auto text-brand-text-tertiary mb-3" />
            <p className="text-sm font-medium text-brand-muted">{t('usersNoClients')}</p>
            <p className="text-xs text-brand-text-tertiary mt-1">
              {searchTerm ? t('usersNoFilterResults') : t('usersEmptyState')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border-subtle">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider">{t('usersColumnClient')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider hidden md:table-cell">{t('usersColumnEmail')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider hidden md:table-cell">{t('usersColumnRegistration')}</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider w-32">{t('usersColumnActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-subtle">
                {filteredCustomers.map(customer => {
                  const initial = (customer.displayName || customer.email || '?').charAt(0).toUpperCase();
                  return (
                    <tr key={customer.uid} className="hover:bg-brand-light/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-dark truncate">{customer.displayName || t('usersNoName')}</p>
                            <p className="text-[11px] text-brand-text-tertiary font-mono truncate md:hidden">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-brand-muted">
                          <Mail size={13} className="text-brand-text-tertiary flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-brand-muted">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openOrdersTab(customer)}
                            className="p-1.5 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
                            title={t('usersViewOrders')}
                          >
                            <ShoppingCart size={16} />
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-1.5 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
                            title={t('usersViewDetails')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.uid)}
                            disabled={isDeleting}
                            className="p-1.5 text-brand-text-tertiary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                            title={t('usersDelete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredCustomers.length > 0 && (
        <p className="text-xs text-brand-text-tertiary text-right">
          {t('usersResultsCount', { filtered: filteredCustomers.length, total: customers.length })}
        </p>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setSelectedCustomer(null)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-brand-surface z-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border-subtle flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                  {(selectedCustomer.displayName || selectedCustomer.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-dark">{selectedCustomer.displayName || t('usersNoName')}</h2>
                  <p className="text-xs text-brand-text-tertiary">{selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-brand-text-tertiary hover:text-brand-muted hover:bg-brand-light rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-brand-border-subtle flex-shrink-0 px-6">
              <button
                onClick={() => setActiveModalTab('info')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 mr-6 transition-colors ${
                  activeModalTab === 'info'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-muted hover:text-brand-dark'
                }`}
              >
                <User size={14} />
                {t('usersTabInfo')}
              </button>
              <button
                onClick={() => setActiveModalTab('orders')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeModalTab === 'orders'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-muted hover:text-brand-dark'
                }`}
              >
                <ShoppingCart size={14} />
                {t('usersTabOrders')}
                {!loadingOrders && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    customerOrders.length > 0 ? 'bg-brand-primary text-white' : 'bg-brand-light text-brand-muted'
                  }`}>
                    {customerOrders.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── INFO TAB ── */}
              {activeModalTab === 'info' && (
                <div className="p-6 space-y-5">
                  <div className="bg-brand-light rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('usersInformation')}</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-2.5">
                        <Mail size={15} className="text-brand-text-tertiary" />
                        <span className="text-brand-dark">{selectedCustomer.email}</span>
                      </div>
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-brand-text-tertiary" />
                          <span className="text-brand-dark">{selectedCustomer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <Calendar size={15} className="text-brand-text-tertiary" />
                        <span className="text-brand-muted">
                          {t('usersRegistrationDate')}: {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleString(i18n.language) : 'N/A'}
                        </span>
                      </div>
                      {selectedCustomer.updatedAt && (
                        <div className="flex items-center gap-2.5">
                          <Calendar size={15} className="text-brand-text-tertiary" />
                          <span className="text-brand-muted">
                            {t('usersUpdatedDate')}: {new Date(selectedCustomer.updatedAt).toLocaleString(i18n.language)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-brand-light rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-2">{t('usersUserId')}</h3>
                    <p className="text-xs font-mono text-brand-muted break-all">{selectedCustomer.uid}</p>
                  </div>

                  {/* Quick order stats if already loaded */}
                  {!loadingOrders && orderStats && (
                    <div className="bg-brand-light rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('usersOrdersSummary')}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-brand-surface rounded-lg p-3 border border-brand-border-subtle">
                          <p className="text-lg font-bold text-brand-dark">{customerOrders.length}</p>
                          <p className="text-[11px] text-brand-text-tertiary mt-0.5">{t('usersOrdersCount')}</p>
                        </div>
                        <div className="bg-brand-surface rounded-lg p-3 border border-brand-border-subtle">
                          <p className="text-lg font-bold text-brand-dark">€{orderStats.totalSpent.toFixed(2)}</p>
                          <p className="text-[11px] text-brand-text-tertiary mt-0.5">{t('usersOrdersTotalSpent')}</p>
                        </div>
                        <div className="bg-brand-surface rounded-lg p-3 border border-brand-border-subtle">
                          <p className="text-lg font-bold text-brand-dark">{orderStats.delivered}</p>
                          <p className="text-[11px] text-brand-text-tertiary mt-0.5">{t('usersOrdersDelivered')}</p>
                        </div>
                        <div className="bg-brand-surface rounded-lg p-3 border border-brand-border-subtle">
                          <p className="text-lg font-bold text-brand-dark">€{orderStats.avgOrderValue.toFixed(2)}</p>
                          <p className="text-[11px] text-brand-text-tertiary mt-0.5">{t('usersOrdersAvgValue')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer.uid)}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {t('usersDeleteUser')}
                  </button>
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {activeModalTab === 'orders' && (
                <div className="p-6 space-y-5">

                  {/* Loading */}
                  {loadingOrders && (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-brand-primary" />
                        <p className="text-sm text-brand-text-tertiary">{t('usersOrdersLoading')}</p>
                      </div>
                    </div>
                  )}

                  {/* Empty */}
                  {!loadingOrders && customerOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ShoppingCart size={40} className="text-brand-text-tertiary mb-3" />
                      <p className="text-sm font-medium text-brand-muted">{t('usersOrdersEmpty')}</p>
                      <p className="text-xs text-brand-text-tertiary mt-1">{selectedCustomer.email}</p>
                    </div>
                  )}

                  {/* Stats bar */}
                  {!loadingOrders && orderStats && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-brand-light rounded-xl p-3.5 border border-brand-border-subtle">
                          <div className="flex items-center gap-2 mb-1.5">
                            <ShoppingCart size={14} className="text-blue-500" />
                            <span className="text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wide">{t('usersOrdersCount')}</span>
                          </div>
                          <p className="text-xl font-bold text-brand-dark">{customerOrders.length}</p>
                        </div>
                        <div className="bg-brand-light rounded-xl p-3.5 border border-brand-border-subtle">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Euro size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wide">{t('usersOrdersTotalSpent')}</span>
                          </div>
                          <p className="text-xl font-bold text-brand-dark">€{orderStats.totalSpent.toFixed(2)}</p>
                        </div>
                        <div className="bg-brand-light rounded-xl p-3.5 border border-brand-border-subtle">
                          <div className="flex items-center gap-2 mb-1.5">
                            <TrendingUp size={14} className="text-violet-500" />
                            <span className="text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wide">{t('usersOrdersAvgValue')}</span>
                          </div>
                          <p className="text-xl font-bold text-brand-dark">€{orderStats.avgOrderValue.toFixed(2)}</p>
                        </div>
                        <div className="bg-brand-light rounded-xl p-3.5 border border-brand-border-subtle">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Package size={14} className="text-green-500" />
                            <span className="text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wide">{t('usersOrdersDelivered')}</span>
                          </div>
                          <p className="text-xl font-bold text-brand-dark">{orderStats.delivered}</p>
                        </div>
                      </div>

                      {/* Orders list */}
                      <div className="space-y-2.5">
                        {customerOrders.map(order => {
                          const sc = statusConfig[order.status];
                          const itemsSummary = order.items.length > 0
                            ? order.items[0].productName + (order.items.length > 1 ? ` +${order.items.length - 1}` : '')
                            : '—';
                          return (
                            <div key={order.id} className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-primary/30 hover:shadow-sm transition-all">
                              {/* Row 1: Order number + date + total */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Hash size={12} className="text-brand-text-tertiary" />
                                    <span className="text-sm font-bold text-brand-dark">{order.orderNumber}</span>
                                  </div>
                                  <p className="text-[11px] text-brand-text-tertiary mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString(i18n.language, {
                                      day: 'numeric', month: 'long', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-base font-black text-brand-primary">€{order.total.toFixed(2)}</p>
                                  {order.shipping === 0 && (
                                    <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">{t('checkoutFree')}</p>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: Status + payment + items */}
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Status badge */}
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${sc.bg} ${sc.color}`}>
                                    {sc.icon}
                                    {sc.label}
                                  </span>
                                  {/* Payment method */}
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-light text-brand-muted rounded-lg text-[11px] font-medium">
                                    <CreditCard size={10} />
                                    {order.paymentMethod}
                                  </span>
                                </div>
                                {/* Items summary */}
                                <span className="text-xs text-brand-muted truncate max-w-[180px]">
                                  {itemsSummary}
                                </span>
                              </div>

                              {/* Row 3: Price breakdown */}
                              <div className="mt-3 pt-3 border-t border-brand-border-subtle grid grid-cols-3 gap-2 text-[11px] text-brand-muted">
                                <div>
                                  <span className="text-brand-text-tertiary">{t('ordersDetailSubtotal')}: </span>
                                  <span className="font-semibold text-brand-dark">€{order.subtotal.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-brand-text-tertiary">{t('checkoutShipping')}: </span>
                                  <span className={`font-semibold ${order.shipping === 0 ? 'text-green-600 dark:text-green-400' : 'text-brand-dark'}`}>
                                    {order.shipping === 0 ? t('checkoutFree') : `€${order.shipping.toFixed(2)}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-brand-text-tertiary">{t('cartTax')}: </span>
                                  <span className="font-semibold text-brand-dark">€{order.tax.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Row 4: Address + tracking */}
                              {(order.address || order.trackingNumber) && (
                                <div className="mt-2 text-[11px] text-brand-muted space-y-0.5">
                                  {order.address && (
                                    <p className="truncate">📍 {order.address}</p>
                                  )}
                                  {order.trackingNumber && (
                                    <p>🚚 {t('usersOrdersTracking')}: <span className="font-mono font-semibold text-brand-dark">{order.trackingNumber}</span></p>
                                  )}
                                </div>
                              )}

                              {/* Row 5: Purchased items */}
                              {order.items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-brand-border-subtle space-y-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <span className="text-brand-muted truncate flex-1">
                                        {item.productName}
                                        {item.selectedModel && <span className="text-brand-text-tertiary ml-1">({item.selectedModel})</span>}
                                      </span>
                                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                        <span className="text-brand-text-tertiary">×{item.quantity}</span>
                                        <span className="font-semibold text-brand-dark">€{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Row 6: Status history */}
                              {order.statusHistory && order.statusHistory.length > 1 && (
                                <details className="mt-3 pt-3 border-t border-brand-border-subtle">
                                  <summary className="text-[11px] text-brand-text-tertiary cursor-pointer hover:text-brand-muted select-none">
                                    {t('usersOrdersStatusHistory')} ({order.statusHistory.length})
                                  </summary>
                                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-brand-border-subtle">
                                    {order.statusHistory.map((entry, idx) => (
                                      <div key={idx} className="text-[11px] text-brand-muted">
                                        <span className="font-semibold text-brand-dark">{entry.status}</span>
                                        <span className="mx-1.5 text-brand-text-tertiary">·</span>
                                        {new Date(entry.timestamp).toLocaleString(i18n.language)}
                                        {entry.note && <span className="block text-brand-text-tertiary pl-2">{entry.note}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersManager;
