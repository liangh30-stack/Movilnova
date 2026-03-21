import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sentry
vi.mock('@/services/sentry', () => ({
  captureMessage: vi.fn(),
}));

import { captureMessage } from '@/services/sentry';
import {
  trackViewCart,
  trackBeginCheckout,
  trackContactComplete,
  trackShippingComplete,
  trackPaymentSelected,
  trackPurchase,
  trackCheckoutError,
} from '@/services/analytics';

describe('analytics', () => {
  let originalDataLayer: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original dataLayer state
    originalDataLayer = (window as unknown as Record<string, unknown>).dataLayer;
  });

  afterEach(() => {
    // Restore original dataLayer state
    if (originalDataLayer !== undefined) {
      (window as unknown as Record<string, unknown>).dataLayer = originalDataLayer;
    } else {
      delete (window as unknown as Record<string, unknown>).dataLayer;
    }
  });

  describe('trackViewCart', () => {
    it('calls captureMessage with view_cart event', () => {
      trackViewCart(3, 59.99);

      expect(captureMessage).toHaveBeenCalledWith('[analytics] view_cart', 'info');
    });

    it('pushes to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackViewCart(3, 59.99);

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({
        event: 'view_cart',
        itemCount: 3,
        total: 59.99,
      });
    });

    it('does not crash when dataLayer does not exist', () => {
      delete (window as unknown as Record<string, unknown>).dataLayer;

      expect(() => trackViewCart(3, 59.99)).not.toThrow();
      expect(captureMessage).toHaveBeenCalledOnce();
    });
  });

  describe('trackBeginCheckout', () => {
    it('calls captureMessage with begin_checkout event', () => {
      trackBeginCheckout(2, 40.0);

      expect(captureMessage).toHaveBeenCalledWith('[analytics] begin_checkout', 'info');
    });

    it('pushes to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackBeginCheckout(2, 40.0);

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({
        event: 'begin_checkout',
        itemCount: 2,
        total: 40.0,
      });
    });
  });

  describe('trackContactComplete', () => {
    it('calls captureMessage with add_contact event', () => {
      trackContactComplete();

      expect(captureMessage).toHaveBeenCalledWith('[analytics] add_contact', 'info');
    });

    it('pushes to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackContactComplete();

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({ event: 'add_contact' });
    });
  });

  describe('trackShippingComplete', () => {
    it('calls captureMessage with add_shipping event', () => {
      trackShippingComplete();

      expect(captureMessage).toHaveBeenCalledWith('[analytics] add_shipping', 'info');
    });

    it('pushes to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackShippingComplete();

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({ event: 'add_shipping' });
    });
  });

  describe('trackPaymentSelected', () => {
    it('calls captureMessage with add_payment event', () => {
      trackPaymentSelected('Stripe');

      expect(captureMessage).toHaveBeenCalledWith('[analytics] add_payment', 'info');
    });

    it('pushes method to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackPaymentSelected('Stripe');

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({
        event: 'add_payment',
        method: 'Stripe',
      });
    });
  });

  describe('trackPurchase', () => {
    it('calls captureMessage with purchase event', () => {
      trackPurchase('ORD-2026-0101120000-123', 99.99, 5);

      expect(captureMessage).toHaveBeenCalledWith('[analytics] purchase', 'info');
    });

    it('pushes purchase details to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackPurchase('ORD-2026-0101120000-123', 99.99, 5);

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({
        event: 'purchase',
        orderNumber: 'ORD-2026-0101120000-123',
        total: 99.99,
        itemCount: 5,
      });
    });
  });

  describe('trackCheckoutError', () => {
    it('calls captureMessage with checkout_error event', () => {
      trackCheckoutError('payment', 'Card declined');

      expect(captureMessage).toHaveBeenCalledWith('[analytics] checkout_error', 'info');
    });

    it('pushes error details to dataLayer when it exists', () => {
      const dataLayer: Record<string, unknown>[] = [];
      (window as unknown as Record<string, unknown>).dataLayer = dataLayer;

      trackCheckoutError('payment', 'Card declined');

      expect(dataLayer).toHaveLength(1);
      expect(dataLayer[0]).toEqual({
        event: 'checkout_error',
        step: 'payment',
        error: 'Card declined',
      });
    });

    it('does not crash when dataLayer does not exist', () => {
      delete (window as unknown as Record<string, unknown>).dataLayer;

      expect(() => trackCheckoutError('shipping', 'Invalid address')).not.toThrow();
      expect(captureMessage).toHaveBeenCalledOnce();
    });
  });
});
