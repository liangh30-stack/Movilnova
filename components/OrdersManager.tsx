import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUser } from '../services/authService';
import { Order, OrderStatus } from '../types';
import { subscribeToOrders, updateOrderStatus as updateOrderStatusInFirestore, takeOrder as takeOrderInFirestore, releaseOrder as releaseOrderInFirestore } from '../services/orderService';
import {
  ShoppingCart,
  Search,
  Eye,
  XCircle,
  Clock,
  Package,
  Truck,
  Loader2,
  X,
  Mail,
  Phone,
  MapPin,
  Users,
  CreditCard,
  Euro,
  AlertTriangle,
  Download,
  Printer,
  UserCheck,
  UserPlus,
  UserX,
  Lock,
} from 'lucide-react';
import { COMPANY } from '../config/company';

interface OrdersManagerProps {
  user: AppUser;
}

/** Escape HTML to prevent XSS when using document.write() */
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const OrdersManager: React.FC<OrdersManagerProps> = ({ user }) => {
  const { t, i18n } = useTranslation();

  const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; bg: string; dot: string }> = useMemo(() => ({
    Pending:    { label: t('ordersStatusPending'),    icon: <Clock size={14} />,      color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',     dot: 'bg-amber-500' },
    Processing: { label: t('ordersStatusProcessing'), icon: <Loader2 size={14} />,    color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',       dot: 'bg-blue-500' },
    Paid:       { label: t('ordersStatusPaid'),       icon: <CreditCard size={14} />, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    Shipped:    { label: t('ordersStatusShipped'),    icon: <Truck size={14} />,      color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200',   dot: 'bg-violet-500' },
    Delivered:  { label: t('ordersStatusDelivered'),  icon: <Package size={14} />,    color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',     dot: 'bg-green-500' },
    Cancelled:  { label: t('ordersStatusCancelled'),  icon: <XCircle size={14} />,    color: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',         dot: 'bg-red-500' },
  }), [t]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [takingOrder, setTakingOrder] = useState(false);
  const [confirmTakeOrderId, setConfirmTakeOrderId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToOrders(
      (ordersData) => { setOrders(ordersData); setIsLoading(false); },
      (error) => { if (import.meta.env.DEV) console.error('Error loading orders:', error); setIsLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (updatingStatus) return;
    try {
      setUpdatingStatus(true);
      await updateOrderStatusInFirestore(orderId, newStatus, `Status changed by admin ${user.email}`, user.uid, user.email ?? undefined, user.role === 'superadmin');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating order status:', error);
      alert(t('ordersUpdateStatusError'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const canModifyOrder = (order: Order): boolean => {
    if (user.role === 'superadmin') return true;
    if (!order.takenBy) return false;
    return order.takenBy.uid === user.uid;
  };

  const handleTakeOrder = async (orderId: string) => {
    if (takingOrder) return;
    try {
      setTakingOrder(true);
      await takeOrderInFirestore(orderId, user.uid, user.email ?? '');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          takenBy: { uid: user.uid, email: user.email ?? '', takenAt: new Date().toISOString() },
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error taking order:', error);
      alert(t('ordersTakeError'));
    } finally {
      setTakingOrder(false);
    }
  };

  const handleReleaseOrder = async (orderId: string) => {
    if (takingOrder) return;
    try {
      setTakingOrder(true);
      await releaseOrderInFirestore(orderId, user.uid, user.email ?? '');
      if (selectedOrder?.id === orderId) {
        const { takenBy: _, ...rest } = selectedOrder;
        setSelectedOrder({ ...rest, takenBy: undefined });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error releasing order:', error);
    } finally {
      setTakingOrder(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = [
      t('ordersColumnOrder'),
      t('ordersColumnCustomer'),
      t('ordersExportEmail'),
      t('ordersColumnDate'),
      t('ordersExportItems'),
      t('ordersDetailSubtotal'),
      t('ordersDetailShipping'),
      t('ordersDetailTax'),
      t('ordersColumnTotal'),
      t('ordersColumnStatus'),
      t('ordersExportPayment'),
    ];

    const csvRows = [headers.join(',')];

    filteredOrders.forEach(order => {
      const itemsSummary = order.items
        .map(item => `${item.productName} x${item.quantity}`)
        .join('; ');
      const dateStr = new Date(order.createdAt).toLocaleDateString(i18n.language, {
        day: 'numeric', month: 'short', year: 'numeric',
      });

      csvRows.push([
        `"${order.orderNumber}"`,
        `"${order.customerName}"`,
        `"${order.email}"`,
        `"${dateStr}"`,
        `"${itemsSummary}"`,
        order.subtotal.toFixed(2),
        order.shipping.toFixed(2),
        order.tax.toFixed(2),
        order.total.toFixed(2),
        `"${statusConfig[order.status]?.label || order.status}"`,
        `"${order.paymentMethod}"`,
      ].join(','));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${COMPANY.brandName}_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintShippingTicket = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    const dateStr = new Date(order.createdAt).toLocaleDateString(i18n.language, {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const itemsRows = order.items.map((item, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${escapeHtml(item.productName)}${item.selectedModel ? ' (' + escapeHtml(item.selectedModel) + ')' : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;text-align:center">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;text-align:right">&euro;${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>${t('shippingTicketTitle')} - ${order.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 24px; max-width: 500px; margin: 0 auto; }
        .header { border-bottom: 3px solid #008060; padding-bottom: 16px; margin-bottom: 16px; }
        .company { font-size: 20px; font-weight: 800; color: #008060; }
        .company-info { font-size: 10px; color: #666; margin-top: 4px; }
        .ticket-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0; color: #333; }
        .order-number { font-size: 18px; font-weight: 800; font-family: monospace; background: #f4f6f8; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
        .customer-info { font-size: 13px; line-height: 1.6; }
        .customer-info strong { display: block; font-size: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #f4f6f8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px; text-align: left; }
        .total-row { font-size: 16px; font-weight: 800; border-top: 2px solid #008060; padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
        .date { font-size: 12px; color: #666; }
        @media print { body { padding: 12px; } @page { margin: 8mm; size: auto; } }
      </style>
    </head><body>
      <div class="header">
        <div class="company">${escapeHtml(COMPANY.name)}</div>
        <div class="company-info">${escapeHtml(COMPANY.address)} | ${escapeHtml(COMPANY.phone)} | ${escapeHtml(COMPANY.email)}</div>
      </div>

      <div class="ticket-title">${escapeHtml(t('shippingTicketTitle'))}</div>
      <div class="order-number">${escapeHtml(order.orderNumber)}</div>
      <div class="date">${escapeHtml(t('shippingTicketDate'))}: ${escapeHtml(dateStr)}</div>

      <div class="section" style="margin-top:16px">
        <div class="section-title">${escapeHtml(t('shippingTicketRecipient'))}</div>
        <div class="customer-info">
          <strong>${escapeHtml(order.customerName)}</strong>
          ${escapeHtml(order.address || '')}<br/>
          ${escapeHtml(t('shippingTicketPhone'))}: ${escapeHtml(order.phone || '')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${escapeHtml(t('shippingTicketItems'))}</div>
        <table>
          <thead><tr>
            <th>#</th>
            <th>${escapeHtml(t('ordersDetailProducts'))}</th>
            <th style="text-align:center">${escapeHtml(t('shippingTicketQty'))}</th>
            <th style="text-align:right">${escapeHtml(t('ordersColumnTotal'))}</th>
          </tr></thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div class="total-row">
          <span>${escapeHtml(t('ordersDetailTotal'))}</span>
          <span>&euro;${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        ${escapeHtml(COMPANY.name)} | ${escapeHtml(COMPANY.nif)}<br/>
        ${escapeHtml(t('shippingTicketGenerated'))}: ${escapeHtml(new Date().toLocaleString())}
      </div>
    </body></html>`);

    printWindow.document.close();
    printWindow.print();
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    paid: orders.filter(o => o.status === 'Paid' || o.status === 'Processing').length,
    revenue: orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-brand-text-tertiary">{t('ordersLoading')}</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: t('ordersKpiTotal'), value: stats.total, icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('ordersKpiPending'), value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: t('ordersKpiPaid'), value: stats.paid, icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('ordersKpiRevenue'), value: `€${stats.revenue.toFixed(2)}`, icon: Euro, color: 'text-brand-primary', bg: 'bg-brand-primary/5' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">{t('ordersTitle')}</h2>
          <p className="text-sm text-brand-text-tertiary mt-0.5">{t('ordersSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-xs text-brand-muted font-medium">{isLoading ? t('ordersLoadingShort') : t('ordersRealTime')}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            {t('ordersAlertPendingPrefix')} <strong>{stats.pending} {t('ordersAlertPendingOrders')}</strong> {t('ordersAlertPendingSuffix')}
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('ordersSearchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="px-4 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none appearance-none cursor-pointer min-w-[180px]"
        >
          <option value="all">{t('ordersAllStatuses')}</option>
          <option value="Pending">{t('ordersFilterPending')}</option>
          <option value="Processing">{t('ordersFilterProcessing')}</option>
          <option value="Paid">{t('ordersFilterPaid')}</option>
          <option value="Shipped">{t('ordersFilterShipped')}</option>
          <option value="Delivered">{t('ordersFilterDelivered')}</option>
          <option value="Cancelled">{t('ordersFilterCancelled')}</option>
        </select>
        <button
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Download size={16} />
          {t('ordersExportCSV')}
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={40} className="mx-auto text-brand-text-tertiary mb-3" />
            <p className="text-sm font-medium text-brand-muted">{t('ordersEmpty')}</p>
            <p className="text-xs text-brand-text-tertiary mt-1">
              {searchTerm || statusFilter !== 'all'
                ? t('ordersEmptyFiltered')
                : t('ordersEmptyDefault')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border-subtle">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider">{t('ordersColumnOrder')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider">{t('ordersColumnCustomer')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider hidden md:table-cell">{t('ordersColumnDate')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider">{t('ordersColumnStatus')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider hidden lg:table-cell">{t('ordersColumnAssignedTo')}</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider">{t('ordersColumnTotal')}</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-subtle">
                {filteredOrders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.Pending;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-brand-light/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[13px] font-medium text-brand-dark">{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-brand-dark">{order.customerName}</p>
                        <p className="text-[11px] text-brand-text-tertiary">{order.email}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-brand-muted">
                          {new Date(order.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${status.color} ${status.bg}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {order.takenBy ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${order.takenBy.uid === user.uid ? 'text-brand-primary' : 'text-brand-muted'}`}>
                            <UserCheck size={13} />
                            {order.takenBy.uid === user.uid ? t('ordersAssignedToYou') : order.takenBy.email}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-text-tertiary italic">{t('ordersUnassigned')}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-brand-dark">€{order.total.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="p-1.5 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
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
      {filteredOrders.length > 0 && (
        <p className="text-xs text-brand-text-tertiary text-right">
          {filteredOrders.length} {t('ordersResultsOf')} {orders.length} {t('ordersResultsOrders')}
        </p>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] bg-brand-surface z-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border-subtle">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-brand-dark">{t('ordersDetailTitle')} {selectedOrder.orderNumber}</h2>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig[selectedOrder.status]?.color} ${statusConfig[selectedOrder.status]?.bg}`}>
                    {statusConfig[selectedOrder.status]?.icon}
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-brand-text-tertiary mt-0.5">
                  {new Date(selectedOrder.createdAt).toLocaleString(i18n.language)}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-brand-text-tertiary hover:text-brand-muted hover:bg-brand-light rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Customer Info */}
              <div className="bg-brand-light rounded-xl p-4">
                <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('ordersDetailCustomer')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Users size={15} className="text-brand-text-tertiary" />
                    <span className="font-medium text-brand-dark">{selectedOrder.customerName}</span>
                  </div>
                  {selectedOrder.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail size={15} className="text-brand-text-tertiary" />
                      <span className="text-brand-muted">{selectedOrder.email}</span>
                    </div>
                  )}
                  {selectedOrder.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-brand-text-tertiary" />
                      <span className="text-brand-muted">{selectedOrder.phone}</span>
                    </div>
                  )}
                  {selectedOrder.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="text-brand-text-tertiary mt-0.5" />
                      <span className="text-brand-muted">{selectedOrder.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Assignment */}
              <div className="bg-brand-light rounded-xl p-4">
                <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('ordersAssignment')}</h3>
                {selectedOrder.takenBy ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-sm">
                      <UserCheck size={16} className={selectedOrder.takenBy.uid === user.uid ? 'text-brand-primary' : 'text-amber-600'} />
                      <div>
                        <span className="font-medium text-brand-dark">
                          {selectedOrder.takenBy.uid === user.uid ? t('ordersTakenByYou') : selectedOrder.takenBy.email}
                        </span>
                        <p className="text-[11px] text-brand-text-tertiary">
                          {new Date(selectedOrder.takenBy.takenAt).toLocaleString(i18n.language)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!canModifyOrder(selectedOrder) && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">
                          <Lock size={12} />
                          {t('ordersLockedByOther')}
                        </div>
                      )}
                      {user.role === 'superadmin' && (
                        <button
                          onClick={() => handleReleaseOrder(selectedOrder.id)}
                          disabled={takingOrder}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                        >
                          {takingOrder ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                          {t('ordersReleaseButton')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmTakeOrderId(selectedOrder.id)}
                    disabled={takingOrder}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={16} />
                    {t('ordersTakeButton')}
                  </button>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('ordersDetailProducts')}</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-brand-light rounded-lg">
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-brand-dark truncate">{item.productName}</p>
                          {item.selectedColor && (
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-brand-border flex-shrink-0"
                              style={{ backgroundColor: item.selectedColor }}
                              title={item.selectedColor}
                            />
                          )}
                        </div>
                        {item.selectedModel && <p className="text-[11px] text-brand-text-tertiary">{item.selectedModel}</p>}
                        <p className="text-xs text-brand-muted">{item.quantity}x €{item.price.toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-bold text-brand-dark">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-brand-muted">
                      <span>{t('ordersDetailSubtotal')}</span>
                      <span>€{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>{t('ordersDetailShipping')}</span>
                      <span>€{selectedOrder.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>{t('ordersDetailTax')}</span>
                      <span>€{selectedOrder.tax.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-border flex justify-between items-center">
                    <span className="text-sm font-semibold text-brand-dark">{t('ordersDetailTotal')}</span>
                    <span className="text-xl font-bold text-brand-primary">€{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('ordersDetailChangeStatus')}</h3>
                {!canModifyOrder(selectedOrder) && (
                  <div className="mb-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <Lock size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      {selectedOrder.takenBy
                        ? t('ordersCannotModifyTakenByOther', { email: selectedOrder.takenBy.email })
                        : t('ordersCannotModifyNotTaken')}
                    </p>
                  </div>
                )}
                {canModifyOrder(selectedOrder) && selectedOrder.status === 'Pending' && (
                  <div className="mb-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      {t('ordersStockWarning')}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const isCurrent = selectedOrder.status === key;
                    const willDecrementStock = (key === 'Paid' || key === 'Processing') && selectedOrder.status === 'Pending';
                    return (
                      <button
                        key={key}
                        onClick={() => updateOrderStatus(selectedOrder.id, key as OrderStatus)}
                        disabled={updatingStatus || isCurrent || !canModifyOrder(selectedOrder)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all text-center disabled:cursor-not-allowed ${
                          isCurrent
                            ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20'
                            : willDecrementStock
                            ? 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:bg-emerald-900/20'
                            : 'border-brand-border hover:border-brand-border hover:bg-brand-light disabled:opacity-40'
                        }`}
                      >
                        <div className={isCurrent ? 'text-brand-primary' : willDecrementStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-text-tertiary'}>
                          {config.icon}
                        </div>
                        <span className={`text-[10px] font-medium leading-tight ${
                          isCurrent ? 'text-brand-primary' : willDecrementStock ? 'text-emerald-700 dark:text-emerald-400' : 'text-brand-muted'
                        }`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Print Shipping Ticket */}
              {(['Paid', 'Processing', 'Shipped'] as OrderStatus[]).includes(selectedOrder.status) && (
                <div>
                  <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-3">{t('shippingTicketSection')}</h3>
                  <button
                    onClick={() => handlePrintShippingTicket(selectedOrder)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                  >
                    <Printer size={16} />
                    {t('shippingTicketPrint')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirm Take Order Modal */}
      {confirmTakeOrderId && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setConfirmTakeOrderId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-brand-surface z-[60] rounded-2xl shadow-2xl border border-brand-border overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">{t('ordersTakeConfirmTitle')}</h3>
              <p className="text-sm text-brand-muted">{t('ordersTakeConfirmDesc')}</p>
            </div>
            <div className="flex border-t border-brand-border">
              <button
                onClick={() => setConfirmTakeOrderId(null)}
                disabled={takingOrder}
                className="flex-1 py-3.5 text-sm font-semibold text-brand-muted hover:bg-brand-light transition-colors border-r border-brand-border disabled:opacity-50"
              >
                {t('ordersTakeConfirmReject')}
              </button>
              <button
                onClick={async () => {
                  await handleTakeOrder(confirmTakeOrderId);
                  setConfirmTakeOrderId(null);
                }}
                disabled={takingOrder}
                className="flex-1 py-3.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {takingOrder && <Loader2 size={16} className="animate-spin" />}
                {t('ordersTakeConfirmAccept')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersManager;
