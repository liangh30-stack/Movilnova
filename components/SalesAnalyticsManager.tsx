import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUser } from '../services/authService';
import { Product, Order, OrderStatus, ProductReview, InventoryChange } from '../types';
import { getProducts } from '../services/productService';
import { getAllOrders } from '../services/orderService';
import { getRecentInventoryChanges } from '../services/inventoryService';
import { getPromoCodes, PromoCode } from '../services/promoCodeService';
import { getShopSettings, ShopSettings } from '../services/storeConfigService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Euro,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  MapPin,
  Cog,
  Repeat,
  Star,
  Clock,
  Truck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface SalesAnalyticsManagerProps {
  user: AppUser;
}

type Period = 'day' | 'week' | 'month' | 'year';
type AnalyticsTab = 'overview' | 'revenue' | 'customers' | 'products' | 'geography' | 'operations';

// ── Constants ────────────────────────────────────────────────────────────────
const PERIOD_KEYS: Record<Period, string> = {
  day: 'salesPeriodDay',
  week: 'salesPeriodWeek',
  month: 'salesPeriodMonth',
  year: 'salesPeriodYear',
};

const CHART_COLORS = ['#008060', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

const PAYMENT_COLORS: Record<string, string> = {
  Stripe: '#635bff',
  Card: '#3b82f6',
  Cash: '#10b981',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Paid: '#10b981',
  Shipped: '#8b5cf6',
  Delivered: '#059669',
  Cancelled: '#ef4444',
};

const PERIOD_COUNTS: Record<Period, number> = { day: 30, week: 12, month: 12, year: 5 };

const getChartTheme = () => {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return {
    tooltip: { backgroundColor: dark ? '#1e1e1e' : '#fff', border: `1px solid ${dark ? '#383838' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '12px', color: dark ? '#e0e0e0' : undefined },
    axisTick: { fill: dark ? '#808080' : '#94a3b8', fontSize: 11 },
    grid: dark ? '#383838' : '#f1f5f9',
    axisTickSecondary: { fill: dark ? '#606060' : '#cbd5e1', fontSize: 11 },
  };
};

// ── Utility functions ────────────────────────────────────────────────────────
const parseAddress = (address: string): { city: string; country: string } => {
  const parts = address.split(',').map(s => s.trim());
  if (parts.length < 2) return { city: '-', country: parts[0] || '-' };
  const country = parts[parts.length - 1];
  const cityPart = parts[parts.length - 2];
  const spaceIdx = cityPart.indexOf(' ');
  const city = spaceIdx > 0 ? cityPart.substring(spaceIdx + 1) : cityPart;
  return { city: city || '-', country: country || '-' };
};

const getDateKey = (dateStr: string, period: Period): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  switch (period) {
    case 'day': return d.toISOString().split('T')[0];
    case 'week': {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      return start.toISOString().split('T')[0];
    }
    case 'month': return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'year': return `${d.getFullYear()}`;
  }
};

const formatDateLabel = (key: string, period: Period, locale?: string): string => {
  if (key === '-') return '-';
  const loc = locale ?? 'es-ES';
  switch (period) {
    case 'day': {
      const d = new Date(key);
      return d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
    }
    case 'week': {
      const d = new Date(key);
      return d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
    }
    case 'month': {
      const [y, m] = key.split('-');
      const d = new Date(Number(y), Number(m) - 1);
      return d.toLocaleDateString(loc, { month: 'short', year: '2-digit' });
    }
    case 'year': return key;
  }
};

const fmtEur = (v: number) => `\u20AC${v.toFixed(2)}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

// ── Shared sub-components ─────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  sub?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, color, bg, sub }) => (
  <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
      <Icon size={18} className={color} />
    </div>
    <p className="text-lg font-bold text-brand-dark tracking-tight">{value}</p>
    {sub && <p className="text-[10px] text-brand-text-tertiary mt-0.5">{sub}</p>}
    <p className="text-[10px] font-medium text-brand-text-tertiary uppercase tracking-wide mt-1">{label}</p>
  </div>
);

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-brand-surface rounded-xl border border-brand-border p-6 ${className}`}>
    <div className="mb-4">
      <h3 className="font-semibold text-brand-dark text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-brand-text-tertiary mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const NoData: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-40">
    <p className="text-sm text-brand-text-tertiary">{message}</p>
  </div>
);

// ── Tab definitions ──────────────────────────────────────────────────────────
const TABS: { id: AnalyticsTab; labelKey: string; icon: LucideIcon }[] = [
  { id: 'overview', labelKey: 'salesTabOverview', icon: LayoutDashboard },
  { id: 'revenue', labelKey: 'salesTabRevenue', icon: Euro },
  { id: 'customers', labelKey: 'salesTabCustomers', icon: Users },
  { id: 'products', labelKey: 'salesTabProducts', icon: Package },
  { id: 'geography', labelKey: 'salesTabGeography', icon: MapPin },
  { id: 'operations', labelKey: 'salesTabOperations', icon: Cog },
];

// ── Main component ───────────────────────────────────────────────────────────
const SalesAnalyticsManager: React.FC<SalesAnalyticsManagerProps> = () => {
  const { t, i18n } = useTranslation();
  const chartTheme = getChartTheme();

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [, setShopSettings] = useState<ShopSettings | null>(null);
  const [, setInventoryChanges] = useState<InventoryChange[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [period, setPeriod] = useState<Period>('month');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [p, o, inv, promos, settings] = await Promise.all([
        getProducts(),
        getAllOrders(1000),
        getRecentInventoryChanges(500),
        getPromoCodes(),
        getShopSettings(),
      ]);
      const reviewsSnap = await getDocs(collection(db, 'productReviews'));
      const allReviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ProductReview[];

      setProducts(p);
      setOrders(o);
      setInventoryChanges(inv);
      setReviews(allReviews);
      setPromoCodes(promos);
      setShopSettings(settings);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error loading analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Shared computed data ─────────────────────────────────────────────────
  const validOrders = useMemo(() => orders.filter(o => o.status !== 'Cancelled'), [orders]);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(String(p.id), p));
    return map;
  }, [products]);

  // Product sales aggregation
  const productSalesMap = useMemo(() => {
    const m = new Map<string, { units: number; revenue: number }>();
    for (const o of validOrders) {
      for (const item of o.items) {
        const key = String(item.productId);
        const cur = m.get(key) || { units: 0, revenue: 0 };
        m.set(key, { units: cur.units + item.quantity, revenue: cur.revenue + item.price * item.quantity });
      }
    }
    return m;
  }, [validOrders]);

  // Average rating by product
  const avgRatingByProduct = useMemo(() => {
    const m = new Map<string, { sum: number; count: number }>();
    reviews.forEach(r => {
      const cur = m.get(r.productId) || { sum: 0, count: 0 };
      m.set(r.productId, { sum: cur.sum + r.rating, count: cur.count + 1 });
    });
    const result = new Map<string, number>();
    m.forEach((v, k) => result.set(k, parseFloat((v.sum / v.count).toFixed(1))));
    return result;
  }, [reviews]);

  // Customer aggregation
  const customerOrdersMap = useMemo(() => {
    const m = new Map<string, { orderCount: number; totalSpent: number; name: string; email: string; firstOrder: string }>();
    for (const o of validOrders) {
      const key = o.customerId || o.email;
      const cur = m.get(key);
      if (cur) {
        cur.orderCount += 1;
        cur.totalSpent += o.total;
        if (o.createdAt < cur.firstOrder) cur.firstOrder = o.createdAt;
      } else {
        m.set(key, { orderCount: 1, totalSpent: o.total, name: o.customerName, email: o.email, firstOrder: o.createdAt });
      }
    }
    return m;
  }, [validOrders]);

  // ── KPI calculations ─────────────────────────────────────────────────────
  const totalRevenue = useMemo(() => validOrders.reduce((s, o) => s + o.total, 0), [validOrders]);
  const orderCount = validOrders.length;
  const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
  const productsSold = useMemo(() => validOrders.flatMap(o => o.items).reduce((s, i) => s + i.quantity, 0), [validOrders]);
  const uniqueCustomerCount = customerOrdersMap.size;
  const arpu = uniqueCustomerCount > 0 ? totalRevenue / uniqueCustomerCount : 0;

  const repeatCustomers = useMemo(() => [...customerOrdersMap.values()].filter(c => c.orderCount > 1).length, [customerOrdersMap]);
  const repeatRate = uniqueCustomerCount > 0 ? (repeatCustomers / uniqueCustomerCount) * 100 : 0;

  const { totalCost, hasMissingCost } = useMemo(() => {
    let cost = 0;
    let missing = false;
    for (const order of validOrders) {
      for (const item of order.items) {
        const product = productMap.get(String(item.productId));
        if (product?.costPrice != null) {
          cost += item.quantity * product.costPrice;
        } else {
          missing = true;
        }
      }
    }
    return { totalCost: cost, hasMissingCost: missing };
  }, [validOrders, productMap]);

  const totalShipping = useMemo(() => validOrders.reduce((s, o) => s + o.shipping, 0), [validOrders]);
  const totalTax = useMemo(() => validOrders.reduce((s, o) => s + o.tax, 0), [validOrders]);
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? ((totalRevenue - totalCost - totalShipping) / totalRevenue) * 100 : 0;

  // ── Time Series ───────────────────────────────────────────────────────────
  const { timeSeries, currentPeriodRevenue, previousPeriodRevenue } = useMemo(() => {
    const count = PERIOD_COUNTS[period];
    const grouped = new Map<string, { revenue: number; orders: number }>();

    for (const o of validOrders) {
      const key = getDateKey(o.createdAt, period);
      const existing = grouped.get(key) || { revenue: 0, orders: 0 };
      existing.revenue += o.total;
      existing.orders += 1;
      grouped.set(key, existing);
    }

    const allKeys: string[] = [];
    const now = new Date();
    for (let i = count * 2 - 1; i >= 0; i--) {
      const d = new Date(now);
      switch (period) {
        case 'day': d.setDate(d.getDate() - i); break;
        case 'week': d.setDate(d.getDate() - i * 7); break;
        case 'month': d.setMonth(d.getMonth() - i); break;
        case 'year': d.setFullYear(d.getFullYear() - i); break;
      }
      allKeys.push(getDateKey(d.toISOString(), period));
    }
    const uniqueKeys = [...new Set(allKeys)].slice(-count * 2);
    const prevKeys = uniqueKeys.slice(0, count);
    const currKeys = uniqueKeys.slice(count);

    const prevRevenue = prevKeys.reduce((s, k) => s + (grouped.get(k)?.revenue ?? 0), 0);
    const currRevenue = currKeys.reduce((s, k) => s + (grouped.get(k)?.revenue ?? 0), 0);

    const series = currKeys.map(k => ({
      date: formatDateLabel(k, period, i18n.language),
      revenue: parseFloat((grouped.get(k)?.revenue ?? 0).toFixed(2)),
      orders: grouped.get(k)?.orders ?? 0,
    }));

    return { timeSeries: series, currentPeriodRevenue: currRevenue, previousPeriodRevenue: prevRevenue };
  }, [validOrders, period, i18n.language]);

  const growth = previousPeriodRevenue > 0
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : currentPeriodRevenue > 0 ? 100 : 0;

  // ── Breakdowns ────────────────────────────────────────────────────────────
  const salesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of validOrders) {
      for (const item of o.items) {
        const product = productMap.get(String(item.productId));
        const cat = product?.category || t('salesOther');
        map.set(cat, (map.get(cat) || 0) + item.price * item.quantity);
      }
    }
    return [...map.entries()].map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })).sort((a, b) => b.value - a.value);
  }, [validOrders, productMap, t]);

  const salesByBrand = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of validOrders) {
      for (const item of o.items) {
        const product = productMap.get(String(item.productId));
        const brands = product?.brands?.length ? product.brands : ['Universal'];
        const revenue = item.price * item.quantity;
        for (const brand of brands) {
          map.set(brand, (map.get(brand) || 0) + revenue);
        }
      }
    }
    return [...map.entries()].map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })).sort((a, b) => b.value - a.value);
  }, [validOrders, productMap]);

  const salesByPayment = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of validOrders) {
      map.set(o.paymentMethod, (map.get(o.paymentMethod) || 0) + o.total);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [validOrders]);

  // Geography
  const geoStats = useMemo(() => {
    const m = new Map<string, { revenue: number; orders: number }>();
    const cityMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of validOrders) {
      const { country, city } = parseAddress(o.address);
      const cur = m.get(country) || { revenue: 0, orders: 0 };
      cur.revenue += o.total;
      cur.orders += 1;
      m.set(country, cur);
      const cc = cityMap.get(city) || { revenue: 0, orders: 0 };
      cc.revenue += o.total;
      cc.orders += 1;
      cityMap.set(city, cc);
    }
    return { byCountry: m, byCity: cityMap };
  }, [validOrders]);

  const countryRevenue = useMemo(() =>
    [...geoStats.byCountry.entries()]
      .map(([name, d]) => ({ name, value: parseFloat(d.revenue.toFixed(2)) }))
      .sort((a, b) => b.value - a.value).slice(0, 10),
    [geoStats]);

  const countryOrders = useMemo(() =>
    [...geoStats.byCountry.entries()]
      .map(([name, d]) => ({ name, orders: d.orders }))
      .sort((a, b) => b.orders - a.orders).slice(0, 10),
    [geoStats]);

  const countryAOV = useMemo(() =>
    [...geoStats.byCountry.entries()]
      .filter(([, d]) => d.orders > 0)
      .map(([name, d]) => ({ name, aov: parseFloat((d.revenue / d.orders).toFixed(2)) }))
      .sort((a, b) => b.aov - a.aov).slice(0, 10),
    [geoStats]);

  const cityRevenue = useMemo(() =>
    [...geoStats.byCity.entries()]
      .map(([name, d]) => ({ name, value: parseFloat(d.revenue.toFixed(2)) }))
      .sort((a, b) => b.value - a.value).slice(0, 10),
    [geoStats]);

  // Products — top 10, worst, models, at-risk
  const top10ByRevenue = useMemo(() => {
    return products
      .map(p => {
        const sales = productSalesMap.get(String(p.id));
        const revenue = sales?.revenue ?? 0;
        const units = sales?.units ?? 0;
        const cost = p.costPrice != null ? p.costPrice * units : null;
        const margin = cost != null && revenue > 0 ? ((revenue - cost) / revenue) * 100 : null;
        return { id: String(p.id), name: p.name, category: p.category, units, revenue, margin, stock: p.stock ?? 0, rating: avgRatingByProduct.get(String(p.id)) ?? null };
      })
      .filter(p => p.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [products, productSalesMap, avgRatingByProduct]);

  const neverSoldProducts = useMemo(() =>
    products.filter(p => !productSalesMap.has(String(p.id))),
    [products, productSalesMap]);

  const popularModels = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of validOrders)
      for (const item of o.items)
        if (item.selectedModel) m.set(item.selectedModel, (m.get(item.selectedModel) || 0) + item.quantity);
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [validOrders]);

  const stockAtRisk = useMemo(() =>
    products
      .filter(p => p.stock != null && p.stock > 0 && p.stock < 10)
      .map(p => ({ name: p.name, stock: p.stock!, velocity: productSalesMap.get(String(p.id))?.units ?? 0 }))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 8),
    [products, productSalesMap]);

  // Custom orders
  const customOrderStats = useMemo(() => {
    let count = 0; let revenue = 0;
    for (const o of validOrders) {
      if (o.items.some(i => i.isCustom)) { count++; revenue += o.total; }
    }
    return { count, revenue };
  }, [validOrders]);

  // Shipping stats
  const freeShippingOrders = useMemo(() => validOrders.filter(o => o.shipping === 0).length, [validOrders]);

  // Discount stats
  const avgDiscountDepth = useMemo(() => {
    let total = 0; let count = 0;
    products.forEach(p => {
      if (p.originalPrice && p.originalPrice > p.price) {
        total += (p.originalPrice - p.price) / p.originalPrice * 100;
        count++;
      }
    });
    return count > 0 ? total / count : 0;
  }, [products]);

  // Operations
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const cancellationRate = orders.length > 0
    ? (orders.filter(o => o.status === 'Cancelled').length / orders.length) * 100 : 0;

  const ordersWithTracking = validOrders.filter(o => !!o.trackingNumber).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  const avgFulfillmentDays = useMemo(() => {
    const times: number[] = [];
    for (const o of orders) {
      if (!o.statusHistory?.length) continue;
      const pending = o.statusHistory.find(h => h.status === 'Pending');
      const shipped = o.statusHistory.find(h => h.status === 'Shipped' || h.status === 'Delivered');
      if (pending && shipped) {
        const ms = new Date(shipped.timestamp).getTime() - new Date(pending.timestamp).getTime();
        if (ms > 0) times.push(ms / (1000 * 60 * 60 * 24));
      }
    }
    return times.length > 0 ? times.reduce((s, v) => s + v, 0) / times.length : null;
  }, [orders]);

  const pipelineTiming = useMemo(() => {
    const pairs: [OrderStatus, OrderStatus][] = [
      ['Pending', 'Processing'], ['Processing', 'Paid'], ['Paid', 'Shipped'], ['Shipped', 'Delivered'],
    ];
    return pairs.map(([from, to]) => {
      const times: number[] = [];
      for (const o of orders) {
        const fromE = o.statusHistory?.find(h => h.status === from);
        const toE = o.statusHistory?.find(h => h.status === to);
        if (fromE && toE) {
          const ms = new Date(toE.timestamp).getTime() - new Date(fromE.timestamp).getTime();
          if (ms > 0) times.push(ms / (1000 * 60 * 60));
        }
      }
      const avg = times.length > 0 ? times.reduce((s, v) => s + v, 0) / times.length : null;
      return { from, to, avgHours: avg, samples: times.length };
    });
  }, [orders]);

  const ordersByDayOfWeek = useMemo(() => {
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const counts = new Array(7).fill(0);
    for (const o of orders) {
      const dow = (new Date(o.createdAt).getDay() + 6) % 7;
      counts[dow]++;
    }
    return labels.map((name, i) => ({ name, orders: counts[i] }));
  }, [orders]);

  const ordersByHour = useMemo(() => {
    const counts = new Array(24).fill(0);
    for (const o of orders) counts[new Date(o.createdAt).getHours()]++;
    return counts.map((orders, h) => ({ hour: `${h}:00`, orders }));
  }, [orders]);

  const cancellationNotes = useMemo(() =>
    orders
      .filter(o => o.status === 'Cancelled' && o.notes)
      .slice(0, 10)
      .map(o => ({ orderNumber: o.orderNumber, note: o.notes!, date: o.updatedAt })),
    [orders]);

  // Order status funnel
  const statusFunnel = useMemo(() => {
    const stages: OrderStatus[] = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered'];
    return stages.map(status => ({
      name: status,
      value: orders.filter(o => o.status === status).length,
      fill: STATUS_COLORS[status],
    }));
  }, [orders]);

  // Customer acquisition by period
  const customerAcquisition = useMemo(() => {
    const count = PERIOD_COUNTS[period];
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      switch (period) {
        case 'day': d.setDate(d.getDate() - i); break;
        case 'week': d.setDate(d.getDate() - i * 7); break;
        case 'month': d.setMonth(d.getMonth() - i); break;
        case 'year': d.setFullYear(d.getFullYear() - i); break;
      }
      buckets.set(getDateKey(d.toISOString(), period), 0);
    }
    customerOrdersMap.forEach(c => {
      const key = getDateKey(c.firstOrder, period);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return [...buckets.entries()].map(([k, v]) => ({ date: formatDateLabel(k, period, i18n.language), customers: v }));
  }, [customerOrdersMap, period, i18n.language]);

  // Order distribution histogram
  const orderDistribution = useMemo(() => {
    const dist = { '1': 0, '2': 0, '3-5': 0, '6+': 0 };
    customerOrdersMap.forEach(({ orderCount: oc }) => {
      if (oc === 1) dist['1']++;
      else if (oc === 2) dist['2']++;
      else if (oc <= 5) dist['3-5']++;
      else dist['6+']++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [customerOrdersMap]);

  // Guest vs registered
  const guestVsRegistered = useMemo(() => {
    let guest = 0; let reg = 0;
    validOrders.forEach(o => { if (o.customerId) reg++; else guest++; });
    return [
      { name: t('salesGuest'), value: guest },
      { name: t('salesRegistered'), value: reg },
    ];
  }, [validOrders, t]);

  // Top 10 customers
  const top10Customers = useMemo(() =>
    [...customerOrdersMap.entries()]
      .map(([, data]) => ({ ...data, aov: data.totalSpent / data.orderCount }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10),
    [customerOrdersMap]);

  // Revenue by segment
  const revenueBySegment = useMemo(() => {
    let oneTime = 0;
    customerOrdersMap.forEach(c => { if (c.orderCount === 1) oneTime += c.totalSpent; });
    return { oneTime, repeat: totalRevenue - oneTime };
  }, [customerOrdersMap, totalRevenue]);

  // ── Period Selector Component ──────────────────────────────────────────────
  const PeriodSelector = () => (
    <div className="flex bg-brand-surface border border-brand-border rounded-lg overflow-hidden">
      {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            period === p ? 'bg-brand-primary text-white' : 'text-brand-muted hover:bg-brand-light'
          }`}
        >
          {t(PERIOD_KEYS[p])}
        </button>
      ))}
    </div>
  );

  // Tooltip formatter helper (safe for Recharts which passes number | undefined)
  const eurFormatter = (v: number | undefined) => fmtEur(v ?? 0);
  const eurLabelFormatter = (v: number | undefined) => [fmtEur(v ?? 0), t('salesRevenue')];

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 1: OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard label={t('salesRevenue')} value={fmtEur(totalRevenue)} icon={Euro} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <KpiCard label={t('salesOrders')} value={orderCount} icon={ShoppingCart} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <KpiCard label={t('salesAOV')} value={fmtEur(aov)} icon={TrendingUp} color="text-violet-600" bg="bg-violet-50" />
        <KpiCard label={t('salesProductsSold')} value={productsSold} icon={Package} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
        <KpiCard label={t('salesUniqueCustomers')} value={uniqueCustomerCount} icon={Users} color="text-cyan-600" bg="bg-cyan-50" />
        <KpiCard label={t('salesRepeatRate')} value={fmtPct(repeatRate)} icon={Repeat} color="text-indigo-600" bg="bg-indigo-50" />
        <KpiCard label={t('salesGrossMargin')} value={fmtPct(grossMargin)} icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <KpiCard label={t('salesNetMargin')} value={fmtPct(netMargin)} icon={netMargin >= 0 ? TrendingUp : TrendingDown} color={netMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} bg={netMargin >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'} />
      </div>

      {/* Revenue Trend + Period Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title={t('salesTimeSeries')} subtitle={t(PERIOD_KEYS[period])} className="lg:col-span-2">
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={timeSeries}>
                <defs>
                  <linearGradient id="gradSalesOverview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#008060" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis yAxisId="left" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="none" tick={chartTheme.axisTickSecondary} tickLine={false} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#008060" strokeWidth={2} fill="url(#gradSalesOverview)" name={t('salesRevenue')} />
                <Bar yAxisId="right" dataKey="orders" fill="#3b82f6" opacity={0.3} radius={[2, 2, 0, 0]} barSize={16} name={t('salesOrderCount')} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        {/* Period Comparison */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6 flex flex-col">
          <h3 className="font-semibold text-brand-dark text-sm mb-1">{t('salesComparison')}</h3>
          <p className="text-xs text-brand-text-tertiary mb-6">{t('salesVsPrevious')}</p>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            <div>
              <p className="text-xs text-brand-text-tertiary mb-1">{t('salesCurrentPeriod')}</p>
              <p className="text-2xl font-bold text-brand-dark">{fmtEur(currentPeriodRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-tertiary mb-1">{t('salesPreviousPeriod')}</p>
              <p className="text-lg font-semibold text-brand-muted">{fmtEur(previousPeriodRevenue)}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${growth >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {growth >= 0 ? <ArrowUpRight size={18} className="text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight size={18} className="text-red-600 dark:text-red-400" />}
              <div>
                <p className={`text-lg font-bold ${growth >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </p>
                <p className="text-[10px] text-brand-muted">{t('salesGrowth')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Funnel + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('salesStatusFunnel')} subtitle={`${t('salesCancellationRate')}: ${fmtPct(cancellationRate)}`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusFunnel} layout="vertical" margin={{ left: 75 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
              <XAxis type="number" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={75} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                {statusFunnel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('salesRecentActivity')}>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 6).map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-brand-border-subtle last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[o.status] }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{o.customerName}</p>
                      <p className="text-[10px] text-brand-text-tertiary">{o.orderNumber}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-brand-dark">{fmtEur(o.total)}</p>
                    <p className="text-[10px] text-brand-text-tertiary">{timeAgo(o.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NoData message={t('salesNoOrders')} />
          )}
        </ChartCard>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2: REVENUE
  // ══════════════════════════════════════════════════════════════════════════
  const renderRevenueTab = () => (
    <div className="space-y-6">
      {/* Revenue time series */}
      <ChartCard title={t('salesTimeSeries')} subtitle={t(PERIOD_KEYS[period])}>
        {timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="gradSalesRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008060" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="date" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <YAxis stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Area type="monotone" dataKey="revenue" stroke="#008060" strokeWidth={2} fill="url(#gradSalesRev)" name={t('salesRevenue')} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <NoData message={t('salesNoData')} />
        )}
      </ChartCard>

      {/* Summary cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label={t('salesTaxCollected')} value={fmtEur(totalTax)} icon={Euro} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
        <KpiCard label={t('salesShippingRevenue')} value={fmtEur(totalShipping)} icon={Truck} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <KpiCard label={t('salesFreeShippingOrders')} value={freeShippingOrders} icon={Package} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" sub={`${orderCount > 0 ? ((freeShippingOrders / orderCount) * 100).toFixed(0) : 0}%`} />
        <KpiCard label={t('salesAvgDiscount')} value={fmtPct(avgDiscountDepth)} icon={TrendingDown} color="text-violet-600" bg="bg-violet-50" sub={`${products.filter(p => p.originalPrice && p.originalPrice > p.price).length} ${t('salesProduct').toLowerCase()}s`} />
      </div>

      {/* Category + Brand + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title={t('salesByCategory')}>
          {salesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesByCategory} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke="none" tick={{ ...chartTheme.axisTick, fontSize: 10 }} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={70} />
                <Tooltip contentStyle={chartTheme.tooltip} formatter={eurLabelFormatter} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                  {salesByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        <ChartCard title={t('salesByBrand')}>
          {salesByBrand.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesByBrand} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke="none" tick={{ ...chartTheme.axisTick, fontSize: 10 }} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={70} />
                <Tooltip contentStyle={chartTheme.tooltip} formatter={eurLabelFormatter} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                  {salesByBrand.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        <ChartCard title={t('salesByPayment')}>
          {salesByPayment.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={salesByPayment} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={2} stroke="#fff">
                    {salesByPayment.map(entry => <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltip} formatter={eurFormatter} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {salesByPayment.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[item.name] || '#94a3b8' }} />
                      <span className="text-brand-muted">{item.name}</span>
                    </div>
                    <span className="font-semibold text-brand-dark">{fmtEur(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>
      </div>

      {/* Top 10 Products Table */}
      <ChartCard title={t('salesTop10ByRevenue')}>
        {top10ByRevenue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border-subtle">
                  <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesRank')}</th>
                  <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesProduct')}</th>
                  <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCategory')}</th>
                  <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesUnitsSold')}</th>
                  <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesRevenue')}</th>
                  <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesMargin')}</th>
                </tr>
              </thead>
              <tbody>
                {top10ByRevenue.map((p, i) => (
                  <tr key={p.id} className="border-b border-brand-border-subtle hover:bg-brand-light/50">
                    <td className="px-3 py-2.5 text-brand-text-tertiary font-mono text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-brand-dark max-w-[200px] truncate">{p.name}</td>
                    <td className="px-3 py-2.5 text-brand-muted">{p.category}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-brand-dark">{p.units}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-brand-dark">{fmtEur(p.revenue)}</td>
                    <td className={`px-3 py-2.5 text-right font-mono ${p.margin != null ? (p.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : 'text-brand-text-tertiary'}`}>
                      {p.margin != null ? fmtPct(p.margin) : t('salesNa')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <NoData message={t('salesNoData')} />
        )}
      </ChartCard>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 3: CUSTOMERS
  // ══════════════════════════════════════════════════════════════════════════
  const renderCustomersTab = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers30d = [...customerOrdersMap.values()].filter(c => new Date(c.firstOrder) >= thirtyDaysAgo).length;
    const avgOrdersPerCustomer = uniqueCustomerCount > 0 ? validOrders.length / uniqueCustomerCount : 0;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KpiCard label={t('salesUniqueCustomers')} value={uniqueCustomerCount} icon={Users} color="text-cyan-600" bg="bg-cyan-50" />
          <KpiCard label={t('salesNewCustomers30d')} value={newCustomers30d} icon={Users} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
          <KpiCard label={t('salesRepeatRate')} value={fmtPct(repeatRate)} icon={Repeat} color="text-indigo-600" bg="bg-indigo-50" />
          <KpiCard label="ARPU" value={fmtEur(arpu)} icon={Euro} color="text-violet-600" bg="bg-violet-50" />
          <KpiCard label={t('salesAvgOrdersPerCustomer')} value={avgOrdersPerCustomer.toFixed(1)} icon={ShoppingCart} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        </div>

        {/* Guest vs Registered + Order Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title={t('salesGuestVsRegistered')}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={guestVsRegistered} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2} stroke="#fff">
                  <Cell fill="#3b82f6" />
                  <Cell fill="#008060" />
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {guestVsRegistered.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? '#3b82f6' : '#008060' }} />
                  <span className="text-brand-muted">{item.name}: <span className="font-semibold">{item.value}</span></span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title={t('salesOrderDistribution')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="name" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} name={t('salesUniqueCustomers')} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t('salesRevenueBySegment')}>
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-brand-muted">{t('salesOneTimeCustomers')}</span>
                  <span className="font-semibold text-brand-dark">{fmtEur(revenueBySegment.oneTime)}</span>
                </div>
                <div className="h-3 bg-brand-light rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueBySegment.oneTime / totalRevenue) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-brand-muted">{t('salesRepeatCustomers')}</span>
                  <span className="font-semibold text-brand-dark">{fmtEur(revenueBySegment.repeat)}</span>
                </div>
                <div className="h-3 bg-brand-light rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (revenueBySegment.repeat / totalRevenue) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-brand-border-subtle">
                <p className="text-xs text-brand-text-tertiary">
                  {t('salesRepeatCustomers')}: <span className="font-semibold text-brand-dark">{totalRevenue > 0 ? ((revenueBySegment.repeat / totalRevenue) * 100).toFixed(1) : 0}%</span> {t('salesRevenue').toLowerCase()}
                </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Customer Acquisition */}
        <ChartCard title={t('salesCustomerAcquisition')} subtitle={t(PERIOD_KEYS[period])}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={customerAcquisition}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="date" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <YAxis stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Bar dataKey="customers" fill="#008060" radius={[4, 4, 0, 0]} barSize={20} name={t('salesUniqueCustomers')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 Customers Table */}
        <ChartCard title={t('salesTop10Customers')}>
          {top10Customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border-subtle">
                    <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesRank')}</th>
                    <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCustomerName')}</th>
                    <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCustomerEmail')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCustomerOrders')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCustomerTotal')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCustomerAOV')}</th>
                  </tr>
                </thead>
                <tbody>
                  {top10Customers.map((c, i) => (
                    <tr key={i} className="border-b border-brand-border-subtle hover:bg-brand-light/50">
                      <td className="px-3 py-2.5 text-brand-text-tertiary font-mono text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-brand-dark truncate max-w-[150px]">{c.name}</td>
                      <td className="px-3 py-2.5 text-brand-muted truncate max-w-[180px]">{c.email}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-brand-dark">{c.orderCount}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-brand-dark">{fmtEur(c.totalSpent)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-brand-muted">{fmtEur(c.aov)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 4: PRODUCTS
  // ══════════════════════════════════════════════════════════════════════════
  const renderProductsTab = () => {
    const lowStockCount = products.filter(p => p.stock != null && p.stock > 0 && p.stock < 10).length;
    const outOfStockCount = products.filter(p => (p.stock ?? 0) === 0 && p.stock != null).length;
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label={t('salesTotalSKUs')} value={products.length} icon={Package} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
          <KpiCard label={t('salesProductsSold')} value={productsSold} icon={ShoppingCart} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
          <KpiCard label={t('salesNeverSold')} value={neverSoldProducts.length} icon={AlertTriangle} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
          <KpiCard label={t('salesLowStock')} value={lowStockCount} icon={AlertTriangle} color="text-orange-600" bg="bg-orange-50" />
          <KpiCard label={t('salesOutOfStock')} value={outOfStockCount} icon={Package} color="text-red-600 dark:text-red-400" bg="bg-red-50" />
          <KpiCard label={t('salesAvgRating')} value={avgRating > 0 ? avgRating.toFixed(1) : t('salesNa')} icon={Star} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-50" sub={`${reviews.length} reviews`} />
        </div>

        {/* Best Sellers Table */}
        <ChartCard title={t('salesBestSellers')}>
          {top10ByRevenue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border-subtle">
                    <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesRank')}</th>
                    <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesProduct')}</th>
                    <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesCategory')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesUnitsSold')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesRevenue')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesStockLeft')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesMargin')}</th>
                    <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesRating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {top10ByRevenue.map((p, i) => (
                    <tr key={p.id} className="border-b border-brand-border-subtle hover:bg-brand-light/50">
                      <td className="px-3 py-2.5 text-brand-text-tertiary font-mono text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-brand-dark max-w-[180px] truncate">{p.name}</td>
                      <td className="px-3 py-2.5 text-brand-muted text-xs">{p.category}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-brand-dark">{p.units}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-brand-dark">{fmtEur(p.revenue)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono ${p.stock < 10 ? 'text-red-600 font-semibold' : 'text-brand-muted'}`}>{p.stock}</td>
                      <td className={`px-3 py-2.5 text-right font-mono ${p.margin != null ? (p.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : 'text-brand-text-tertiary'}`}>
                        {p.margin != null ? fmtPct(p.margin) : t('salesNa')}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {p.rating != null ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            {p.rating}
                          </span>
                        ) : (
                          <span className="text-brand-text-tertiary text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        {/* Revenue by Category + Popular Models */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={t('salesRevenuePerCategory')}>
            {salesByCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" strokeWidth={2} stroke="#fff">
                      {salesByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltip} formatter={eurFormatter} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {salesByCategory.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-brand-muted truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <NoData message={t('salesNoData')} />
            )}
          </ChartCard>

          <ChartCard title={t('salesPopularModels')}>
            {popularModels.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, popularModels.length * 28)}>
                <BarChart data={popularModels} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} width={100} />
                  <Tooltip contentStyle={chartTheme.tooltip} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} name={t('salesUnitsSold')} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData message={t('salesNoData')} />
            )}
          </ChartCard>
        </div>

        {/* Stock at Risk + Custom Orders + Never Sold count */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title={t('salesStockAtRisk')} className="lg:col-span-2">
            {stockAtRisk.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border-subtle">
                      <th className="text-left text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesProduct')}</th>
                      <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesStockLeft')}</th>
                      <th className="text-right text-[11px] font-semibold text-brand-text-tertiary uppercase tracking-wider px-3 py-2">{t('salesSalesVelocity')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockAtRisk.map(p => (
                      <tr key={p.name} className="border-b border-brand-border-subtle">
                        <td className="px-3 py-2 text-brand-dark truncate max-w-[250px]">{p.name}</td>
                        <td className="px-3 py-2 text-right font-mono text-red-600 font-semibold">{p.stock}</td>
                        <td className="px-3 py-2 text-right font-mono text-brand-muted">{p.velocity} {t('salesUnitsSold').toLowerCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <NoData message={t('salesNoData')} />
            )}
          </ChartCard>

          <div className="space-y-4">
            <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
              <p className="text-[10px] font-medium text-brand-text-tertiary uppercase tracking-wide mb-2">{t('salesCustomOrders')}</p>
              <p className="text-2xl font-bold text-brand-dark">{customOrderStats.count}</p>
              <p className="text-xs text-brand-text-tertiary mt-1">{fmtEur(customOrderStats.revenue)} {t('salesRevenue').toLowerCase()}</p>
            </div>
            <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
              <p className="text-[10px] font-medium text-brand-text-tertiary uppercase tracking-wide mb-2">{t('salesWorstPerformers')}</p>
              <p className="text-2xl font-bold text-brand-dark">{neverSoldProducts.length}</p>
              <p className="text-xs text-brand-text-tertiary mt-1">{products.length > 0 ? ((neverSoldProducts.length / products.length) * 100).toFixed(0) : 0}% {t('salesTotalSKUs').toLowerCase()}</p>
            </div>
            {promoCodes.length > 0 && (
              <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
                <p className="text-[10px] font-medium text-brand-text-tertiary uppercase tracking-wide mb-2">Promo Codes</p>
                <p className="text-2xl font-bold text-brand-dark">{promoCodes.filter(p => p.isActive).length} <span className="text-sm font-normal text-brand-text-tertiary">/ {promoCodes.length}</span></p>
                <p className="text-xs text-brand-text-tertiary mt-1">{promoCodes.reduce((s, p) => s + p.usedCount, 0)} usos totales</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 5: GEOGRAPHY
  // ══════════════════════════════════════════════════════════════════════════
  const renderGeographyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('salesRevenueByCountry')}>
          {countryRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryRevenue} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={80} />
                <Tooltip contentStyle={chartTheme.tooltip} formatter={eurLabelFormatter} />
                <Bar dataKey="value" fill="#008060" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        <ChartCard title={t('salesOrdersByCountry')}>
          {countryOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryOrders} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={80} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name={t('salesOrderCount')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('salesRevenueByCity')}>
          {cityRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityRevenue} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={80} />
                <Tooltip contentStyle={chartTheme.tooltip} formatter={eurLabelFormatter} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        <ChartCard title={t('salesAOVByCountry')}>
          {countryAOV.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryAOV} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="none" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} width={80} />
                <Tooltip contentStyle={chartTheme.tooltip} formatter={(v: number | undefined) => [fmtEur(v ?? 0), 'AOV']} />
                <Bar dataKey="aov" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} name="AOV" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 6: OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════
  const renderOperationsTab = () => (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label={t('salesAvgFulfillmentTime')}
          value={avgFulfillmentDays != null ? `${avgFulfillmentDays.toFixed(1)} ${t('salesDays')}` : t('salesNa')}
          icon={Clock}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <KpiCard label={t('salesCancellationRate')} value={fmtPct(cancellationRate)} icon={AlertTriangle} color="text-red-600 dark:text-red-400" bg="bg-red-50" />
        <KpiCard label={t('salesOrdersWithTracking')} value={ordersWithTracking} icon={Truck} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" sub={`${validOrders.length > 0 ? ((ordersWithTracking / validOrders.length) * 100).toFixed(0) : 0}%`} />
        <KpiCard label={t('salesPendingOrders')} value={pendingOrdersCount} icon={Clock} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
      </div>

      {/* Status Distribution + Pipeline Timing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('salesStatusDistribution')}>
          {statusCounts.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" strokeWidth={2} stroke="#fff">
                    {statusCounts.map(entry => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name as OrderStatus] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {statusCounts.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[item.name as OrderStatus] || '#94a3b8' }} />
                    <span className="text-brand-muted">{item.name}: <span className="font-semibold">{item.value}</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <NoData message={t('salesNoData')} />
          )}
        </ChartCard>

        <ChartCard title={t('salesPipelineTiming')}>
          <div className="space-y-4">
            {pipelineTiming.map(stage => (
              <div key={`${stage.from}-${stage.to}`} className="flex items-center gap-3">
                <div className="w-20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[stage.from] }} />
                  <span className="text-[10px] text-brand-muted">{stage.from}</span>
                </div>
                <div className="text-brand-text-tertiary text-xs">&rarr;</div>
                <div className="w-20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[stage.to] }} />
                  <span className="text-[10px] text-brand-muted">{stage.to}</span>
                </div>
                <div className="flex-1 h-2.5 bg-brand-light rounded-full overflow-hidden">
                  {stage.avgHours != null && (
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[stage.to],
                        width: `${Math.min((stage.avgHours / 120) * 100, 100)}%`,
                        minWidth: '4px',
                      }}
                    />
                  )}
                </div>
                <div className="text-right flex-shrink-0 w-24">
                  {stage.avgHours != null ? (
                    <span className="text-xs font-mono font-semibold text-brand-dark">
                      {stage.avgHours >= 24 ? `${(stage.avgHours / 24).toFixed(1)} ${t('salesDays')}` : `${stage.avgHours.toFixed(1)} ${t('salesHours')}`}
                    </span>
                  ) : (
                    <span className="text-xs text-brand-text-tertiary">{t('salesNa')}</span>
                  )}
                </div>
                <span className="text-[10px] text-brand-text-tertiary flex-shrink-0 w-12 text-right">n={stage.samples}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Day of Week + Hour of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('salesOrdersByDayOfWeek')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersByDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="name" stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <YAxis stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Bar dataKey="orders" radius={[4, 4, 0, 0]} barSize={28} name={t('salesOrderCount')}>
                {ordersByDayOfWeek.map((entry, i) => (
                  <Cell key={i} fill={entry.orders === Math.max(...ordersByDayOfWeek.map(d => d.orders)) ? '#008060' : '#94a3b8'} opacity={0.4 + (entry.orders / Math.max(1, Math.max(...ordersByDayOfWeek.map(d => d.orders)))) * 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('salesOrdersByHour')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="hour" stroke="none" tick={{ ...chartTheme.axisTick, fontSize: 9 }} tickLine={false} interval={1} />
              <YAxis stroke="none" tick={chartTheme.axisTick} tickLine={false} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Bar dataKey="orders" radius={[2, 2, 0, 0]} barSize={12} name={t('salesOrderCount')}>
                {ordersByHour.map((entry, i) => {
                  const max = Math.max(1, Math.max(...ordersByHour.map(d => d.orders)));
                  const intensity = entry.orders / max;
                  return <Cell key={i} fill={intensity > 0.7 ? '#dc2626' : intensity > 0.4 ? '#f59e0b' : '#3b82f6'} opacity={0.3 + intensity * 0.7} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Cancellation Notes */}
      <ChartCard title={t('salesCancellationNotes')}>
        {cancellationNotes.length > 0 ? (
          <div className="space-y-3">
            {cancellationNotes.map((c, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-brand-border-subtle last:border-0">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-brand-dark">{c.note}</p>
                  <p className="text-[10px] text-brand-text-tertiary mt-0.5">{c.orderNumber} &middot; {new Date(c.date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NoData message={t('salesNoCancellations')} />
        )}
      </ChartCard>
    </div>
  );

  // ── Tab router ────────────────────────────────────────────────────────────
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'revenue': return renderRevenueTab();
      case 'customers': return renderCustomersTab();
      case 'products': return renderProductsTab();
      case 'geography': return renderGeographyTab();
      case 'operations': return renderOperationsTab();
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-brand-text-tertiary">{t('salesLoading')}</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">{t('salesTitle')}</h2>
          <p className="text-sm text-brand-text-tertiary mt-0.5">{t('salesSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector />
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-brand-muted bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-light transition-colors"
          >
            <RefreshCw size={14} />
            {t('salesRefresh')}
          </button>
        </div>
      </div>

      {/* Missing cost warning */}
      {hasMissingCost && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">{t('salesMissingCostWarning')}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-dark hover:bg-brand-light'
            }`}
          >
            <tab.icon size={15} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {renderActiveTab()}
    </div>
  );
};

export default SalesAnalyticsManager;
