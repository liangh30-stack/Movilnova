import { captureMessage } from './sentry';

type FunnelStep = 'view_cart' | 'begin_checkout' | 'add_contact' | 'add_shipping' | 'add_payment' | 'purchase' | 'checkout_error';
type TrafficEvent = 'page_view' | 'view_item' | 'add_to_cart' | 'search';
type AllEvents = FunnelStep | TrafficEvent;

interface AnalyticsEvent {
  event: AllEvents;
  properties?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gtag: ((...args: any[]) => void) | null =
  typeof window !== 'undefined' && 'gtag' in window
    ? (window as unknown as { gtag: (...args: unknown[]) => void }).gtag
    : null;

const trackEvent = ({ event, properties }: AnalyticsEvent) => {
  captureMessage(`[analytics] ${event}`, 'info');

  // Push to dataLayer for GTM/GA4
  if (typeof window !== 'undefined' && 'dataLayer' in window) {
    (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.push({
      event,
      ...properties,
    });
  }

  // Also send via gtag if available
  if (gtag) {
    gtag('event', event, properties);
  }
};

// ── Traffic & Navigation ──

export const trackPageView = (path: string, title?: string) =>
  trackEvent({ event: 'page_view', properties: { page_path: path, page_title: title } });

export const trackViewItem = (productId: string | number, productName: string, price: number, category?: string, brands?: string[]) =>
  trackEvent({
    event: 'view_item',
    properties: {
      currency: 'EUR',
      value: price,
      items: [{ item_id: String(productId), item_name: productName, price, item_category: category, item_brand: brands?.join(', ') }],
    },
  });

export const trackAddToCart = (productId: string | number, productName: string, price: number, quantity: number) =>
  trackEvent({
    event: 'add_to_cart',
    properties: {
      currency: 'EUR',
      value: price * quantity,
      items: [{ item_id: String(productId), item_name: productName, price, quantity }],
    },
  });

export const trackSearch = (searchTerm: string, resultsCount: number) =>
  trackEvent({ event: 'search', properties: { search_term: searchTerm, results_count: resultsCount } });

// ── Checkout Funnel ──

export const trackViewCart = (itemCount: number, total: number) =>
  trackEvent({ event: 'view_cart', properties: { itemCount, total } });

export const trackBeginCheckout = (itemCount: number, total: number) =>
  trackEvent({ event: 'begin_checkout', properties: { itemCount, total } });

export const trackContactComplete = () =>
  trackEvent({ event: 'add_contact' });

export const trackShippingComplete = () =>
  trackEvent({ event: 'add_shipping' });

export const trackPaymentSelected = (method: string) =>
  trackEvent({ event: 'add_payment', properties: { method } });

export const trackPurchase = (orderNumber: string, total: number, itemCount: number) =>
  trackEvent({ event: 'purchase', properties: { orderNumber, total, itemCount } });

export const trackCheckoutError = (step: string, error: string) =>
  trackEvent({ event: 'checkout_error', properties: { step, error } });
