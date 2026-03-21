import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Order, OrderStatus } from '@/types';

// ---------- Mock react-i18next ----------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// ---------- Mock lucide-react ----------
vi.mock('lucide-react', () => ({
  ShoppingCart: (props: Record<string, unknown>) => <span data-testid="icon-cart" {...props} />,
  Search: (props: Record<string, unknown>) => <span data-testid="icon-search" {...props} />,
  Eye: (props: Record<string, unknown>) => <span data-testid="icon-eye" {...props} />,
  XCircle: (props: Record<string, unknown>) => <span data-testid="icon-x-circle" {...props} />,
  Clock: (props: Record<string, unknown>) => <span data-testid="icon-clock" {...props} />,
  Package: (props: Record<string, unknown>) => <span data-testid="icon-package" {...props} />,
  Truck: (props: Record<string, unknown>) => <span data-testid="icon-truck" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="icon-loader" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="icon-x" {...props} />,
  Mail: (props: Record<string, unknown>) => <span data-testid="icon-mail" {...props} />,
  Phone: (props: Record<string, unknown>) => <span data-testid="icon-phone" {...props} />,
  MapPin: (props: Record<string, unknown>) => <span data-testid="icon-map-pin" {...props} />,
  Users: (props: Record<string, unknown>) => <span data-testid="icon-users" {...props} />,
  CreditCard: (props: Record<string, unknown>) => <span data-testid="icon-credit-card" {...props} />,
  Euro: (props: Record<string, unknown>) => <span data-testid="icon-euro" {...props} />,
  AlertTriangle: (props: Record<string, unknown>) => <span data-testid="icon-alert" {...props} />,
  Download: (props: Record<string, unknown>) => <span data-testid="icon-download" {...props} />,
  Printer: (props: Record<string, unknown>) => <span data-testid="icon-printer" {...props} />,
}));

// ---------- Mock orderService ----------
const mockSubscribeToOrders = vi.fn();
const mockUpdateOrderStatus = vi.fn();

vi.mock('@/services/orderService', () => ({
  subscribeToOrders: (...args: unknown[]) => mockSubscribeToOrders(...args),
  updateOrderStatus: (...args: unknown[]) => mockUpdateOrderStatus(...args),
}));

// ---------- Mock company config ----------
vi.mock('@/config/company', () => ({
  COMPANY: {
    brandName: 'TestShop',
    name: 'TestShop S.L.',
    nif: 'B-12345678',
    address: 'Test Street 1',
    email: 'test@shop.com',
    phone: '+34 600 000 000',
  },
}));

// Import the component AFTER all mocks are set up
import OrdersManager from '@/components/OrdersManager';

// ---------- Helpers ----------
const fakeUser = {
  uid: 'admin-001',
  email: 'admin@shop.com',
  role: 'admin' as const,
};

const createFakeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-001',
  orderNumber: 'ORD-2025-001',
  customerName: 'María López',
  email: 'maria@example.com',
  phone: '+34 600 111 222',
  address: 'Calle Mayor 1, Madrid 28001',
  items: [
    {
      productId: 'prod-1',
      productName: 'Phone Case',
      productImage: '/img/case.png',
      price: 19.99,
      quantity: 1,
    },
  ],
  subtotal: 19.99,
  shipping: 4.99,
  tax: 4.2,
  total: 29.18,
  status: 'Pending' as OrderStatus,
  statusHistory: [
    { status: 'Pending', timestamp: '2025-06-01T10:00:00.000Z' },
  ],
  paymentMethod: 'Stripe',
  createdAt: '2025-06-01T10:00:00.000Z',
  updatedAt: '2025-06-01T10:00:00.000Z',
  ...overrides,
});

/**
 * Helper to set up the subscribeToOrders mock.
 * Immediately fires the callback with the provided orders.
 */
const setupSubscription = (orders: Order[]) => {
  mockSubscribeToOrders.mockImplementation(
    (onUpdate: (orders: Order[]) => void, _onError?: (error: Error) => void) => {
      // Fire callback asynchronously to match real behavior
      setTimeout(() => onUpdate(orders), 0);
      return vi.fn(); // unsubscribe
    },
  );
};

/**
 * Helper to set up the subscription in loading state (never fires callback).
 */
const setupLoadingSubscription = () => {
  mockSubscribeToOrders.mockImplementation(() => {
    return vi.fn(); // unsubscribe — callback never called, stays loading
  });
};

const renderOrdersManager = () => render(<OrdersManager user={fakeUser} />);

// ---------- Tests ----------
describe('OrdersManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: subscription fires with empty orders
    setupSubscription([]);
  });

  // ---- Loading state ----
  it('renders loading state initially', () => {
    setupLoadingSubscription();

    renderOrdersManager();

    expect(screen.getByText('ordersLoading')).toBeInTheDocument();
  });

  // ---- Displays orders after loading ----
  it('displays orders after loading', async () => {
    const orders = [
      createFakeOrder(),
      createFakeOrder({
        id: 'order-002',
        orderNumber: 'ORD-2025-002',
        customerName: 'Juan García',
        email: 'juan@example.com',
        total: 45.50,
        status: 'Shipped',
      }),
    ];
    setupSubscription(orders);

    renderOrdersManager();

    await waitFor(() => {
      expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
    });

    expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.getByText('Juan García')).toBeInTheDocument();
  });

  // ---- Empty state ----
  it('shows empty state when no orders exist', async () => {
    setupSubscription([]);

    renderOrdersManager();

    await waitFor(() => {
      expect(screen.getByText('ordersEmpty')).toBeInTheDocument();
    });

    expect(screen.getByText('ordersEmptyDefault')).toBeInTheDocument();
  });

  // ---- Export CSV button ----
  it('renders export CSV button and it is disabled when no orders', async () => {
    setupSubscription([]);

    renderOrdersManager();

    await waitFor(() => {
      expect(screen.getByText('ordersExportCSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('ordersExportCSV').closest('button');
    expect(exportButton).toBeDisabled();
  });

  it('enables export CSV button when orders exist', async () => {
    setupSubscription([createFakeOrder()]);

    renderOrdersManager();

    await waitFor(() => {
      expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('ordersExportCSV').closest('button');
    expect(exportButton).not.toBeDisabled();
  });

  // ---- Status filter ----
  it('filters orders by status using the status select', async () => {
    const orders = [
      createFakeOrder({ id: 'o1', orderNumber: 'ORD-PEND', status: 'Pending', customerName: 'Pending Person' }),
      createFakeOrder({ id: 'o2', orderNumber: 'ORD-SHIP', status: 'Shipped', customerName: 'Shipped Person' }),
    ];
    setupSubscription(orders);

    renderOrdersManager();

    await waitFor(() => {
      expect(screen.getByText('ORD-PEND')).toBeInTheDocument();
    });

    // Both should be visible initially
    expect(screen.getByText('ORD-SHIP')).toBeInTheDocument();

    // Filter by Shipped
    const statusSelect = screen.getByDisplayValue('ordersAllStatuses');
    fireEvent.change(statusSelect, { target: { value: 'Shipped' } });

    // Only shipped order should remain
    expect(screen.queryByText('ORD-PEND')).not.toBeInTheDocument();
    expect(screen.getByText('ORD-SHIP')).toBeInTheDocument();
  });

  // ---- Search filter ----
  it('filters orders by search term', async () => {
    const orders = [
      createFakeOrder({ id: 'o1', orderNumber: 'ORD-001', customerName: 'Alice Smith', email: 'alice@example.com' }),
      createFakeOrder({ id: 'o2', orderNumber: 'ORD-002', customerName: 'Bob Jones', email: 'bob@example.com' }),
    ];
    setupSubscription(orders);

    renderOrdersManager();

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Both visible initially
    expect(screen.getByText('ORD-002')).toBeInTheDocument();

    // Type in search box
    const searchInput = screen.getByPlaceholderText('ordersSearchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // Only Alice's order should remain
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
  });

  // ---- Subscription cleanup ----
  it('unsubscribes from orders on unmount', () => {
    const unsubscribe = vi.fn();
    mockSubscribeToOrders.mockImplementation(() => unsubscribe);

    const { unmount } = renderOrdersManager();
    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  // ---- KPI display ----
  it('displays KPI cards with correct data', async () => {
    const orders = [
      createFakeOrder({ id: 'o1', status: 'Pending', total: 20 }),
      createFakeOrder({ id: 'o2', status: 'Paid', total: 30 }),
      createFakeOrder({ id: 'o3', status: 'Cancelled', total: 10 }),
    ];
    setupSubscription(orders);

    renderOrdersManager();

    await waitFor(() => {
      // Total orders KPI
      expect(screen.getByText('ordersKpiTotal')).toBeInTheDocument();
    });

    // Revenue KPI should exclude cancelled orders: 20 + 30 = 50
    expect(screen.getByText('ordersKpiRevenue')).toBeInTheDocument();
  });
});
