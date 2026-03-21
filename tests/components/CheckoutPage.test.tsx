import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------- Mock react-i18next ----------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ---------- Mock lucide-react ----------
vi.mock('lucide-react', () => ({
  ArrowLeft: (props: Record<string, unknown>) => <span data-testid="icon-arrow-left" {...props} />,
  CheckCircle2: (props: Record<string, unknown>) => <span data-testid="icon-check-circle" {...props} />,
  ChevronDown: (props: Record<string, unknown>) => <span data-testid="icon-chevron-down" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <span data-testid="icon-chevron-right" {...props} />,
  CreditCard: (props: Record<string, unknown>) => <span data-testid="icon-credit-card" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="icon-loader" {...props} />,
  Mail: (props: Record<string, unknown>) => <span data-testid="icon-mail" {...props} />,
  Package: (props: Record<string, unknown>) => <span data-testid="icon-package" {...props} />,
  Truck: (props: Record<string, unknown>) => <span data-testid="icon-truck" {...props} />,
  Wallet: (props: Record<string, unknown>) => <span data-testid="icon-wallet" {...props} />,
}));

// ---------- Mock checkout sub-components ----------
vi.mock('@/components/checkout/OrderSummary', () => ({
  default: () => <div data-testid="order-summary">OrderSummary</div>,
}));

vi.mock('@/components/checkout/TrustBadges', () => ({
  default: () => <div data-testid="trust-badges">TrustBadges</div>,
}));

vi.mock('@/components/checkout/StripePaymentForm', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="stripe-payment-form" data-total={props.total}>
      StripePaymentForm
    </div>
  ),
}));

// ---------- Mock ErrorBoundary ----------
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// ---------- Mock payment service ----------
vi.mock('@/services/paymentService', () => ({
  createPaymentIntent: vi.fn().mockResolvedValue({ clientSecret: 'pi_test_secret' }),
}));

// Import the component AFTER all mocks are set up
import CheckoutPage from '@/components/CheckoutPage';
import type { ShopSettings } from '@/services/storeConfigService';
import type { CheckoutSection, ShippingInfo } from '@/hooks/useCheckout';

// ---------- Helpers ----------
const defaultShopSettings: ShopSettings = {
  ivaRate: 0.21,
  showIva: true,
  shippingCost: 4.99,
  freeShippingThreshold: 50,
  currency: 'EUR',
  currencySymbol: '€',
  maintenanceMode: false,
  bannerEnabled: false,
  bannerText: '',
  bannerSubtext: '',
};

const defaultShippingInfo: ShippingInfo = {
  fullName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
};

const createDefaultProps = (overrides: Record<string, unknown> = {}) => ({
  cart: [
    { id: 'prod-1', name: 'Phone Case', image: '/img/case.png', price: 19.99, quantity: 1 },
  ],
  updateCartQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  activeSection: 'contact' as CheckoutSection,
  setActiveSection: vi.fn(),
  completedSections: new Set<CheckoutSection>(),
  shippingInfo: { ...defaultShippingInfo },
  setShippingInfo: vi.fn(),
  acceptTerms: false,
  setAcceptTerms: vi.fn(),
  acceptPrivacy: false,
  setAcceptPrivacy: vi.fn(),
  formErrors: {} as Record<string, string>,
  completeContact: vi.fn(() => true),
  completeShipping: vi.fn(() => true),
  fillFromAddress: vi.fn(),
  handlePlaceOrder: vi.fn(),
  lastOrderNumber: '',
  orderSuccess: false,
  orderError: null,
  isPlacingOrder: false,
  resetCheckout: vi.fn(),
  subtotal: 19.99,
  shippingCost: 4.99,
  isFreeShipping: false,
  tax: 4.2,
  total: 29.18,
  discount: 0,
  amountToFreeShipping: 30.01,
  shopSettings: defaultShopSettings,
  customer: null,
  customerAddresses: [],
  onSignInClick: vi.fn(),
  onBack: vi.fn(),
  appliedPromo: null,
  promoError: '',
  isValidatingPromo: false,
  applyPromoCode: vi.fn(),
  removePromoCode: vi.fn(),
  appliedOfferDetails: [],
  giftSuggestions: [],
  products: [],
  onAddToCart: vi.fn(),
  ...overrides,
});

const renderCheckout = (overrides: Record<string, unknown> = {}) =>
  render(<CheckoutPage {...createDefaultProps(overrides)} />);

// ---------- Tests ----------
describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub window.scrollTo used on mount
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  // ---- Section rendering ----
  it('renders contact section initially when activeSection is contact', () => {
    renderCheckout({ activeSection: 'contact' });

    // The contact section header shows its title
    expect(screen.getByText('checkoutContact')).toBeInTheDocument();
    // The email input should be visible since contact is active
    expect(screen.getByPlaceholderText('you@email.com')).toBeInTheDocument();
    // Continue button for contact section
    expect(screen.getByText('checkoutContinueShipping')).toBeInTheDocument();
  });

  it('shows shipping form after completing contact section', () => {
    renderCheckout({
      activeSection: 'shipping',
      completedSections: new Set<CheckoutSection>(['contact']),
      shippingInfo: { ...defaultShippingInfo, email: 'user@example.com' },
    });

    // Shipping section is now active
    expect(screen.getByText('checkoutShippingDetails')).toBeInTheDocument();
    // Shipping form fields should be visible
    expect(screen.getByText('checkoutFullName')).toBeInTheDocument();
    expect(screen.getByText('checkoutPhone')).toBeInTheDocument();
    expect(screen.getByText('checkoutStreet')).toBeInTheDocument();
    // Continue button for shipping section
    expect(screen.getByText('checkoutContinuePayment')).toBeInTheDocument();
  });

  it('shows payment section after completing shipping', () => {
    renderCheckout({
      activeSection: 'payment',
      completedSections: new Set<CheckoutSection>(['contact', 'shipping']),
      shippingInfo: {
        ...defaultShippingInfo,
        email: 'user@example.com',
        fullName: 'John Doe',
        phone: '+34 600 111 222',
        street: 'Calle Mayor 1',
        city: 'Madrid',
        postalCode: '28001',
        country: 'Spain',
      },
    });

    // Payment section header should be visible
    expect(screen.getByText('checkoutPayment')).toBeInTheDocument();
    // The payment total summary should show
    expect(screen.getByText('checkoutTotal')).toBeInTheDocument();
  });

  // ---- Order summary ----
  it('displays order summary component', () => {
    renderCheckout();

    // OrderSummary is rendered (mocked component with test id)
    const summaries = screen.getAllByTestId('order-summary');
    expect(summaries.length).toBeGreaterThanOrEqual(1);
  });

  // ---- Trust badges ----
  it('shows trust badges in the payment section', () => {
    renderCheckout({
      activeSection: 'payment',
      completedSections: new Set<CheckoutSection>(['contact', 'shipping']),
      shippingInfo: {
        ...defaultShippingInfo,
        email: 'user@example.com',
        fullName: 'John Doe',
        phone: '+34 600 111 222',
        street: 'Calle Mayor 1',
        city: 'Madrid',
        postalCode: '28001',
        country: 'Spain',
      },
    });

    // TrustBadges are rendered inside the payment section
    const badges = screen.getAllByTestId('trust-badges');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  // ---- ErrorBoundary ----
  it('wraps the payment section with ErrorBoundary', () => {
    renderCheckout({
      activeSection: 'payment',
      completedSections: new Set<CheckoutSection>(['contact', 'shipping']),
      shippingInfo: {
        ...defaultShippingInfo,
        email: 'user@example.com',
        fullName: 'John Doe',
        phone: '+34 600 111 222',
        street: 'Calle Mayor 1',
        city: 'Madrid',
        postalCode: '28001',
        country: 'Spain',
      },
    });

    // ErrorBoundary wraps the payment section
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  // ---- Success screen ----
  it('renders success screen when orderSuccess is true', () => {
    renderCheckout({
      orderSuccess: true,
      lastOrderNumber: 'ORD-2025-001',
    });

    expect(screen.getByText('checkoutThankYou')).toBeInTheDocument();
    expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
    expect(screen.getByText('checkoutConfirmationMsg')).toBeInTheDocument();
    expect(screen.getByText('cartBackToShop')).toBeInTheDocument();
  });

  // ---- Back button on success screen ----
  it('calls resetCheckout and onBack when clicking back button on success screen', () => {
    const resetCheckout = vi.fn();
    const onBack = vi.fn();

    renderCheckout({
      orderSuccess: true,
      lastOrderNumber: 'ORD-2025-002',
      resetCheckout,
      onBack,
    });

    const backButton = screen.getByText('cartBackToShop');
    fireEvent.click(backButton);

    expect(resetCheckout).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  // ---- Contact continue button ----
  it('calls completeContact when clicking continue in contact section', () => {
    const completeContact = vi.fn(() => true);

    renderCheckout({
      activeSection: 'contact',
      completeContact,
    });

    const continueButton = screen.getByText('checkoutContinueShipping');
    fireEvent.click(continueButton);

    expect(completeContact).toHaveBeenCalledOnce();
  });

  // ---- Sign-in prompt when no customer ----
  it('shows sign-in prompt when no customer is logged in', () => {
    renderCheckout({ activeSection: 'contact', customer: null });

    expect(screen.getByText('checkoutHaveAccount')).toBeInTheDocument();
    expect(screen.getByText('customerLogin')).toBeInTheDocument();
  });
});
