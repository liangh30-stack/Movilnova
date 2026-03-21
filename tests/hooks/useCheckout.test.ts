import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@/services/customerService', () => ({
  clearFirestoreCart: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/orderService', () => ({
  createOrder: vi.fn().mockResolvedValue({
    orderNumber: 'ORD-001',
    status: 'Pending',
  }),
}));

vi.mock('@/services/productService', () => ({
  getProducts: vi.fn().mockResolvedValue([
    { id: '1', name: 'Case', price: 10, stock: 5 },
    { id: '2', name: 'Charger', price: 20, stock: 3 },
  ]),
}));

vi.mock('@/services/storeConfigService', () => ({
  DEFAULT_SHOP_SETTINGS: {
    ivaRate: 0.21,
    shippingCost: 4.99,
    freeShippingThreshold: 50,
    maintenanceMode: false,
    currency: 'EUR',
    featuredProductId: '',
  },
}));

vi.mock('@/services/promoCodeService', () => ({
  validatePromoCode: vi.fn(),
  calculateDiscount: vi.fn().mockReturnValue(0),
  incrementPromoUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/offerService', () => ({
  getActiveOffers: vi.fn().mockResolvedValue([]),
  calculateOfferDiscounts: vi.fn().mockReturnValue({ totalDiscount: 0, appliedOffers: [], giftSuggestions: [] }),
}));

import { useCheckout } from '@/hooks/useCheckout';

const mockCart = [
  { id: '1', name: 'Phone Case', image: '/img.jpg', price: 10, quantity: 2, selectedModel: 'iPhone 15', category: 'Case' },
];

const defaultOptions = () => ({
  cart: mockCart,
  cartTotal: 20,
  orders: [],
  setOrders: vi.fn(),
  setCart: vi.fn(),
  customerUid: 'user-123',
});

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    expect(result.current.activeSection).toBe('contact');
    expect(result.current.completedSections.size).toBe(0);
    expect(result.current.orderSuccess).toBe(false);
    expect(result.current.isPlacingOrder).toBe(false);
  });

  it('calculates subtotal with IVA correctly', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    // cartTotal=20, ivaRate=0.21 → 20 * 1.21 = 24.20
    expect(result.current.subtotal).toBe(24.2);
  });

  it('calculates shipping correctly', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    // subtotal 24.20 < freeShippingThreshold 50 → shipping = 4.99
    expect(result.current.isFreeShipping).toBe(false);
    expect(result.current.shippingCost).toBe(4.99);
  });

  it('offers free shipping above threshold', () => {
    const opts = defaultOptions();
    opts.cartTotal = 50; // 50 * 1.21 = 60.50 > 50 threshold
    const { result } = renderHook(() => useCheckout(opts));

    expect(result.current.isFreeShipping).toBe(true);
    expect(result.current.shippingCost).toBe(0);
  });

  it('validates contact email', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    // Try to complete contact without email
    act(() => {
      const success = result.current.completeContact();
      expect(success).toBe(false);
    });

    expect(result.current.formErrors.email).toBe('required');
  });

  it('completes contact section with valid email', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    // Set valid email
    act(() => {
      result.current.setShippingInfo({
        fullName: '', email: 'test@example.com', phone: '',
        street: '', city: '', postalCode: '', country: 'España',
      });
    });

    act(() => {
      const success = result.current.completeContact();
      expect(success).toBe(true);
    });

    expect(result.current.activeSection).toBe('shipping');
    expect(result.current.completedSections.has('contact')).toBe(true);
  });

  it('validates shipping section', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    // Try to complete shipping without fields
    act(() => {
      const success = result.current.completeShipping();
      expect(success).toBe(false);
    });

    expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
  });

  it('resets checkout state', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    // Set some state first
    act(() => {
      result.current.setShippingInfo({
        fullName: 'Test', email: 'test@test.com', phone: '123',
        street: 'St', city: 'City', postalCode: '12345', country: 'España',
      });
    });

    // Reset
    act(() => {
      result.current.resetCheckout();
    });

    expect(result.current.activeSection).toBe('contact');
    expect(result.current.completedSections.size).toBe(0);
    expect(result.current.shippingInfo.fullName).toBe('');
  });

  it('fills shipping from customer profile', () => {
    const { result } = renderHook(() => useCheckout(defaultOptions()));

    act(() => {
      result.current.fillFromCustomer({
        displayName: 'John Doe',
        email: 'john@example.com',
        phone: '+34 600 123 456',
      });
    });

    expect(result.current.shippingInfo.fullName).toBe('John Doe');
    expect(result.current.shippingInfo.email).toBe('john@example.com');
    expect(result.current.shippingInfo.phone).toBe('+34 600 123 456');
  });
});
