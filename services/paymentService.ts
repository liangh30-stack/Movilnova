import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

const functions = getFunctions(app);

interface PaymentIntentResponse {
  clientSecret: string;
  total: number;
}

/**
 * Calls the Cloud Function to create a Stripe PaymentIntent.
 * The Cloud Function fetches prices from Firestore and recalculates the
 * total server-side — the client-provided cart is only used for product IDs
 * and quantities, never for pricing.
 */
export const createPaymentIntent = async (
  items: Array<{ productId: string | number; quantity: number }>,
  promoCode?: string,
  currency: string = 'eur',
  metadata?: Record<string, string>
): Promise<PaymentIntentResponse> => {
  const createPI = httpsCallable<
    { items: Array<{ productId: string; quantity: number }>; promoCode?: string; currency: string; metadata?: Record<string, string> },
    PaymentIntentResponse
  >(functions, 'createPaymentIntent');

  const result = await createPI({
    items: items.map(i => ({ productId: String(i.productId), quantity: i.quantity })),
    promoCode,
    currency,
    metadata,
  });
  return result.data;
};
