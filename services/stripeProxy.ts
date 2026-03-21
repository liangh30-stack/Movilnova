import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Pre-load eagerly so it's ready when the checkout page mounts.
// Stripe.js MUST be loaded from js.stripe.com (enforced by Stripe).
export const stripePromise: Promise<Stripe | null> = loadStripe(STRIPE_PK);
