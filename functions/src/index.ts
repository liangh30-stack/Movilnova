import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';

admin.initializeApp();

// ============================================
// LAZY INIT HELPERS
// ============================================

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

let _genai: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!_genai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    _genai = new GoogleGenAI({ apiKey: key });
  }
  return _genai;
}

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not configured');
    _resend = new Resend(key);
  }
  return _resend;
}

interface CartItemInput {
  productId: string;
  quantity: number;
}

// ============================================
// RATE LIMITER (Firestore-backed)
// ============================================
// Tracks attempts per key in Firestore. Returns true if within limit.

async function checkRateLimit(
  db: admin.firestore.Firestore,
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<boolean> {
  const ref = db.collection('_rateLimits').doc(key);
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();

    if (!data) {
      tx.set(ref, { attempts: 1, windowStart: now, expiresAt: new Date(now + windowMs) });
      return true;
    }

    const windowStart = data.windowStart as number;
    if (now - windowStart > windowMs) {
      // Window expired, reset
      tx.set(ref, { attempts: 1, windowStart: now, expiresAt: new Date(now + windowMs) });
      return true;
    }

    if ((data.attempts as number) >= maxAttempts) {
      return false; // Rate limited
    }

    tx.update(ref, { attempts: admin.firestore.FieldValue.increment(1) });
    return true;
  });
}

// ============================================
// DELETE CUSTOMER ACCOUNT (Callable)
// ============================================
// Deletes a customer from Firebase Auth AND cleans up all Firestore data.
// Only admins can call this.

export const deleteCustomerAccount = functions.https.onCall(
  async (data: { uid: string }, context) => {
    // Verify caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const { uid } = data;
    if (!uid || typeof uid !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Customer UID is required');
    }

    // Verify caller is admin
    const db = admin.firestore();
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (!callerDoc.exists || !['admin', 'superadmin'].includes(callerRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can delete customers');
    }

    // 1. Delete subcollections (addresses, cart, favorites)
    const subcollections = ['addresses', 'cart', 'favorites'];
    for (const sub of subcollections) {
      const snap = await db.collection('customers').doc(uid).collection(sub).get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      if (snap.docs.length > 0) await batch.commit();
    }

    // 2. Delete Firestore documents
    await db.collection('customers').doc(uid).delete();
    await db.collection('users').doc(uid).delete();

    // 3. Delete Firebase Auth user
    try {
      await admin.auth().deleteUser(uid);
    } catch (error: unknown) {
      // User might not exist in Auth (e.g., already deleted)
      console.warn('Auth user not found or already deleted during admin deletion');
    }

    return { success: true };
  }
);

// ============================================
// GEMINI PROXY (Callable)
// ============================================
// Proxies all Gemini API calls so the API key stays server-side.

export const geminiProxy = functions.https.onCall(
  async (data: {
    message: string;
    systemInstruction?: string;
    model?: string;
    image?: { data: string; mimeType: string };
    imageGeneration?: boolean;
  }, context) => {
    const {
      message,
      systemInstruction,
      model = 'gemini-2.0-flash',
      image,
      imageGeneration = false,
    } = data;

    // Require authentication to prevent unauthenticated abuse of AI credits
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to use AI features');
    }

    if (!message || typeof message !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Message is required');
    }

    // Input length limits to prevent abuse
    if (message.length > 10000) {
      throw new functions.https.HttpsError('invalid-argument', 'Message too long (max 10000 chars)');
    }
    if (systemInstruction && systemInstruction.length > 5000) {
      throw new functions.https.HttpsError('invalid-argument', 'System instruction too long');
    }
    if (image?.data && image.data.length > 5 * 1024 * 1024) {
      throw new functions.https.HttpsError('invalid-argument', 'Image too large (max 5MB)');
    }

    // Rate limit: max 20 requests per minute per authenticated user
    const db = admin.firestore();
    const rateLimitKey = context.auth.uid;
    const allowed = await checkRateLimit(db, `gemini_${rateLimitKey}`, 20, 60 * 1000);
    if (!allowed) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many AI requests. Try again later.');
    }

    const ai = getGenAI();

    try {
      // Build content parts
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
      if (image?.data) {
        parts.push({ inlineData: { data: image.data, mimeType: image.mimeType || 'image/jpeg' } });
      }
      parts.push({ text: message });

      const config: Record<string, unknown> = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (imageGeneration) {
        config.responseModalities = ['image', 'text'];
      }

      const response = await ai.models.generateContent({
        model,
        contents: parts.length === 1 ? message : [{ role: 'user', parts }],
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      // Extract image data if present
      let imageData: string | null = null;
      if (imageGeneration && response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if ((part as { inlineData?: { data: string } }).inlineData) {
            imageData = (part as { inlineData: { data: string } }).inlineData.data;
            break;
          }
        }
      }

      return {
        text: response.text || null,
        imageData,
      };
    } catch (error: unknown) {
      console.error('Gemini Proxy Error:', (error as Error).message || 'unknown');
      throw new functions.https.HttpsError('internal', 'AI request failed');
    }
  }
);

// ============================================
// REQUEST ACCOUNT DELETION (Callable)
// ============================================
// Customer requests their own account deletion — sets a 30-day timer.
// Requires password re-verification via Firebase Auth token (already authenticated).

export const requestAccountDeletion = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // Rate limit: max 5 requests per hour per user
    const accDelAllowed = await checkRateLimit(db, 'accDel_' + context.auth.uid, 5, 3600000);
    if (!accDelAllowed) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Try again later.');
    }

    const customerRef = db.collection('customers').doc(uid);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Customer profile not found');
    }

    // Check if already requested
    const data = customerSnap.data()!;
    if (data.deletionRequestedAt) {
      throw new functions.https.HttpsError('already-exists', 'Deletion already requested');
    }

    // Set deletion timestamp
    await customerRef.update({
      deletionRequestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, deletionRequestedAt: new Date().toISOString() };
  }
);

// ============================================
// CANCEL ACCOUNT DELETION (Callable)
// ============================================
// Customer cancels their pending account deletion within the 30-day window.

export const cancelAccountDeletion = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    // Rate limit: max 5 requests per hour per user
    const accDelCancelAllowed = await checkRateLimit(db, 'accDelCancel_' + context.auth.uid, 5, 3600000);
    if (!accDelCancelAllowed) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Try again later.');
    }

    const customerRef = db.collection('customers').doc(uid);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Customer profile not found');
    }

    const data = customerSnap.data()!;
    if (!data.deletionRequestedAt) {
      throw new functions.https.HttpsError('failed-precondition', 'No deletion request found');
    }

    // Remove deletion timestamp
    await customerRef.update({
      deletionRequestedAt: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  }
);

// ============================================
// PROCESS SCHEDULED DELETIONS (Scheduled — runs daily)
// ============================================
// Finds all customers with deletionRequestedAt older than 30 days and deletes them.

export const processScheduledDeletions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    // Query customers with deletion requested before cutoff
    const snap = await db.collection('customers')
      .where('deletionRequestedAt', '<=', cutoff)
      .get();

    console.log(`Found ${snap.size} accounts to delete`);

    for (const customerDoc of snap.docs) {
      const uid = customerDoc.id;
      try {
        // Delete subcollections
        const subcollections = ['addresses', 'cart', 'favorites', 'orders'];
        for (const sub of subcollections) {
          const subSnap = await db.collection('customers').doc(uid).collection(sub).get();
          const batch = db.batch();
          subSnap.docs.forEach(d => batch.delete(d.ref));
          if (subSnap.docs.length > 0) await batch.commit();
        }

        // Delete Firestore documents
        await db.collection('customers').doc(uid).delete();
        await db.collection('users').doc(uid).delete();

        // Delete Firebase Auth user
        try {
          await admin.auth().deleteUser(uid);
        } catch (authErr) {
          console.warn('Auth user not found or already deleted during scheduled cleanup');
        }

        console.log('Successfully deleted scheduled account');
      } catch (err) {
        console.error('Failed to delete scheduled account:', (err as Error).message);
      }
    }

    return null;
  });

// ============================================
// CREATE PAYMENT INTENT (Callable)
// ============================================
// Validates the order amount server-side by fetching product prices and
// shopSettings from Firestore — the client cannot manipulate the total.

export const createPaymentIntent = functions.https.onCall(
  async (data: {
    items: CartItemInput[];
    promoCode?: string;
    currency?: string;
    metadata?: Record<string, string>;
  }, context) => {
    const { items, promoCode, currency = 'eur', metadata = {} } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Cart items are required');
    }

    // Limit cart size to prevent abuse
    if (items.length > 50) {
      throw new functions.https.HttpsError('invalid-argument', 'Too many items in cart (max 50)');
    }

    // Validate each item has valid fields
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid product ID');
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid quantity (1-100)');
      }
    }

    // Validate currency whitelist
    const allowedCurrencies = ['eur', 'usd', 'gbp'];
    if (!allowedCurrencies.includes(currency)) {
      throw new functions.https.HttpsError('invalid-argument', 'Unsupported currency');
    }

    // Rate limit: max 10 payment intents per minute per IP
    const db = admin.firestore();
    const ip = context.rawRequest?.ip || 'unknown';
    const allowed = await checkRateLimit(db, `payment_${ip}`, 10, 60 * 1000);
    if (!allowed) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many payment attempts. Try again later.');
    }

    // 1. Fetch product prices from Firestore (authoritative source)
    const productSnaps = await Promise.all(
      items.map(item => db.collection('products').doc(String(item.productId)).get())
    );

    let cartTotal = 0;
    for (let i = 0; i < items.length; i++) {
      const snap = productSnaps[i];
      if (!snap || !snap.exists) {
        throw new functions.https.HttpsError('not-found', `Product ${items[i].productId} not found`);
      }
      const snapData = snap.data();
      if (!snapData) {
        throw new functions.https.HttpsError('not-found', `Product ${items[i].productId} data is missing`);
      }
      const price = snapData.price as number;
      const quantity = items[i].quantity;
      if (!price || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid product price or quantity');
      }
      cartTotal += price * quantity;
    }

    // 2. Fetch shop settings (IVA rate, shipping cost, free shipping threshold)
    const settingsSnap = await db.collection('shopSettings').doc('general').get();
    const settings = settingsSnap.exists ? settingsSnap.data() ?? {} : {};
    const ivaRate: number = (settings.ivaRate as number) ?? 0.21;
    const shippingCost: number = (settings.shippingCost as number) ?? 4.99;
    const freeShippingThreshold: number = (settings.freeShippingThreshold as number) ?? 50;

    // 3. Subtotal (prices in DB already include IVA)
    const subtotal = parseFloat(cartTotal.toFixed(2));

    // 4. Apply promo code if provided — validate against Firestore
    let discount = 0;
    if (promoCode) {
      const promoQuery = await db.collection('promoCodes')
        .where('code', '==', promoCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!promoQuery.empty) {
        const promoDoc = promoQuery.docs[0];
        if (!promoDoc) {
          throw new functions.https.HttpsError('not-found', 'Promo code document not found');
        }
        const promo = promoDoc.data();
        const now = new Date().toISOString();
        const isExpired = promo.expiresAt && promo.expiresAt < now;
        const isMaxUsed = promo.maxUses > 0 && promo.usedCount >= promo.maxUses;
        const meetsMin = subtotal >= (promo.minPurchase ?? 0);

        if (!isExpired && !isMaxUsed && meetsMin) {
          if (promo.discountType === 'percentage') {
            discount = parseFloat((subtotal * promo.discountValue / 100).toFixed(2));
          } else {
            discount = parseFloat(Math.min(promo.discountValue as number, subtotal).toFixed(2));
          }
        }
      }
    }

    // 5. Final total
    const discountedSubtotal = parseFloat((subtotal - discount).toFixed(2));
    const isFreeShipping = discountedSubtotal >= freeShippingThreshold;
    const shipping = isFreeShipping ? 0 : shippingCost;
    const total = parseFloat((discountedSubtotal + shipping).toFixed(2));

    if (total <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Order total must be positive');
    }

    // 6. Create PaymentIntent with server-calculated amount (cents)
    const amountInCents = Math.round(total * 100);

    try {
      // Filter out empty-string metadata values — Stripe rejects them
      const cleanMeta = metadata
        ? Object.fromEntries(Object.entries(metadata).filter(([, v]) => v !== '' && v != null))
        : {};

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountInCents,
        currency,
        automatic_payment_methods: { enabled: true },
        ...(Object.keys(cleanMeta).length > 0 ? { metadata: cleanMeta } : {}),
      });

      return { clientSecret: paymentIntent.client_secret, total };
    } catch (error: unknown) {
      const stripeErr = error as { type?: string; message?: string; code?: string };
      console.error('Error creating PaymentIntent:', stripeErr.type, stripeErr.code, stripeErr.message);
      throw new functions.https.HttpsError('internal', 'Unable to process payment. Please try again.');
    }
  }
);


// ============================================
// PUSH NOTIFICATION HELPER
// ============================================
// Sends a push notification to a customer via FCM if they have a token stored.

async function sendPushToCustomer(
  db: admin.firestore.Firestore,
  uid: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const customerSnap = await db.collection('customers').doc(uid).get();
    const fcmToken = customerSnap.data()?.fcmToken;
    if (!fcmToken) return;

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // Token expired or invalid — clean it up
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      await db.collection('customers').doc(uid).update({
        fcmToken: admin.firestore.FieldValue.delete(),
      });
    }
    console.warn('Push notification failed:', error.message || 'unknown');
  }
}

// ============================================
// STRIPE WEBHOOK (HTTP)
// ============================================

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!sig || !webhookSecret) {
    res.status(400).send('Missing signature or webhook secret');
    return;
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  const db = admin.firestore();

  // Helper: find order by paymentId (Stripe PaymentIntent ID)
  async function findOrderByPaymentId(paymentId: string) {
    const snap = await db.collection('orders')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ref: doc.ref, data: doc.data() };
  }

  // Helper: update order status with history tracking
  async function updateOrderStatus(
    orderRef: admin.firestore.DocumentReference,
    currentHistory: Array<{ status: string; timestamp: string; note?: string }>,
    newStatus: string,
    note?: string
  ) {
    const now = new Date().toISOString();
    const historyEntry: { status: string; timestamp: string; note?: string } = {
      status: newStatus,
      timestamp: now,
    };
    if (note) historyEntry.note = note;

    await orderRef.update({
      status: newStatus,
      statusHistory: [...currentHistory, historyEntry],
      updatedAt: now,
    });
  }

  switch (event.type) {
    // ── Payment confirmed ──
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent succeeded: ${pi.id}`);
      const order = await findOrderByPaymentId(pi.id);
      if (order) {
        // Only advance if still Pending (avoid double-processing)
        if (order.data.status === 'Pending') {
          await updateOrderStatus(
            order.ref,
            order.data.statusHistory || [],
            'Paid',
            'Payment confirmed via Stripe webhook'
          );
          console.log(`Order ${order.id} updated to Paid`);

          // Send push notification to customer
          const customerUid = order.data.customerUid;
          if (customerUid) {
            await sendPushToCustomer(db, customerUid, 'Pago confirmado', 'Tu pedido ha sido confirmado y está siendo procesado.');
          }
        }
      } else {
        console.warn(`No order found for PaymentIntent ${pi.id}`);
      }
      break;
    }

    // ── Payment failed ──
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const errorMsg = pi.last_payment_error?.message || 'Unknown error';
      console.error(`PaymentIntent failed: ${pi.id}`, errorMsg);
      const order = await findOrderByPaymentId(pi.id);
      if (order && order.data.status === 'Pending') {
        await updateOrderStatus(
          order.ref,
          order.data.statusHistory || [],
          'Cancelled',
          `Payment failed: ${errorMsg}`
        );
        console.log(`Order ${order.id} cancelled due to payment failure`);
      }
      break;
    }

    // ── Payment canceled by customer or expired ──
    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent canceled: ${pi.id}`);
      const order = await findOrderByPaymentId(pi.id);
      if (order && !['Cancelled', 'Delivered'].includes(order.data.status)) {
        await updateOrderStatus(
          order.ref,
          order.data.statusHistory || [],
          'Cancelled',
          'Payment canceled via Stripe'
        );
        console.log(`Order ${order.id} cancelled`);
      }
      break;
    }

    // ── Refund processed ──
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const piId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;
      console.log(`Charge refunded: ${charge.id}, PaymentIntent: ${piId}`);
      if (piId) {
        const order = await findOrderByPaymentId(piId);
        if (order && order.data.status !== 'Cancelled') {
          const isFullRefund = charge.amount_refunded === charge.amount;
          await updateOrderStatus(
            order.ref,
            order.data.statusHistory || [],
            'Cancelled',
            isFullRefund
              ? 'Full refund processed via Stripe'
              : `Partial refund: ${(charge.amount_refunded / 100).toFixed(2)} ${charge.currency.toUpperCase()}`
          );
          console.log(`Order ${order.id} updated after refund`);
        }
      }
      break;
    }

    // ── Dispute / chargeback opened ──
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      console.error(`Dispute created: ${dispute.id}, charge: ${chargeId}, reason: ${dispute.reason}`);
      // Try to find the order via the charge's payment_intent
      if (chargeId) {
        try {
          const charge = await getStripe().charges.retrieve(chargeId as string);
          const piId = typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
          if (piId) {
            const order = await findOrderByPaymentId(piId);
            if (order) {
              // Add a note but don't change status — admin should handle disputes manually
              const now = new Date().toISOString();
              const history = order.data.statusHistory || [];
              history.push({
                status: order.data.status,
                timestamp: now,
                note: `DISPUTE OPENED: ${dispute.reason} (${dispute.id}) — Amount: ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}`,
              });
              await order.ref.update({
                statusHistory: history,
                updatedAt: now,
              });
              console.log(`Dispute noted on order ${order.id}`);
            }
          }
        } catch (err) {
          console.error('Error processing dispute:', (err as Error).message);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// DYNAMIC SITEMAP (HTTP)
// ============================================
// Generates an XML sitemap that includes all product pages from Firestore.

export const dynamicSitemap = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const db = admin.firestore();
  const BASE = 'https://movilnova.es';

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/reparaciones', changefreq: 'weekly', priority: '0.7' },
    { loc: '/privacidad', changefreq: 'yearly', priority: '0.3' },
    { loc: '/condiciones', changefreq: 'yearly', priority: '0.3' },
    { loc: '/aviso-legal', changefreq: 'yearly', priority: '0.3' },
    { loc: '/cookies', changefreq: 'yearly', priority: '0.3' },
  ];

  // Product pages — only fetch IDs
  let productIds: string[] = [];
  try {
    const snap = await db.collection('products').select().get();
    productIds = snap.docs.map(d => d.id);
  } catch (err) {
    console.error('Sitemap: failed to fetch products', (err as Error).message);
  }

  const urls = [
    ...staticPages.map(p =>
      `  <url><loc>${BASE}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
    ),
    ...productIds.map(id =>
      `  <url><loc>${BASE}/producto/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');

  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
});

// ============================================
// SEND ORDER NOTIFICATION (Callable — Resend)
// ============================================

interface EmailOrderItem {
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

interface SendOrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  newStatus: string;
  previousStatus: string;
  orderData?: {
    items: EmailOrderItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
}

const ORDER_STATUS_MESSAGES: Record<string, { subject: string; body: string }> = {
  Pending: {
    subject: 'Pedido recibido',
    body: 'Tu pedido ha sido recibido y está pendiente de confirmación.',
  },
  Processing: {
    subject: 'Pedido en procesamiento',
    body: 'Tu pedido está siendo procesado. Te notificaremos cuando esté listo para enviar.',
  },
  Paid: {
    subject: 'Pago confirmado',
    body: 'El pago de tu pedido ha sido confirmado. Estamos preparando tu envío.',
  },
  Shipped: {
    subject: 'Pedido enviado',
    body: 'Tu pedido ha sido enviado. Pronto recibirás el número de seguimiento.',
  },
  Delivered: {
    subject: 'Pedido entregado',
    body: 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
  },
  Cancelled: {
    subject: 'Pedido cancelado',
    body: 'Tu pedido ha sido cancelado. Si tienes preguntas, contacta con nosotros.',
  },
};

function buildOrderEmailHtml(params: {
  customerName: string;
  orderNumber: string;
  subject: string;
  body: string;
  newStatus: string;
  orderData?: SendOrderNotificationData['orderData'];
}): string {
  const { customerName, orderNumber, subject, body, newStatus, orderData } = params;

  const itemsHtml = orderData?.items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;vertical-align:middle;">
        <img src="${item.productImage}" alt="${item.productName}"
             width="50" height="50"
             style="object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;" />
        <span style="vertical-align:middle;">${item.productName}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;color:#555;">&times;${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${item.price.toFixed(2)} &euro;</td>
    </tr>
  `).join('') ?? '';

  const pricingHtml = orderData ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px;">
      <tr>
        <td style="padding:5px 0;color:#666;">Subtotal</td>
        <td style="padding:5px 0;text-align:right;color:#333;">${orderData.subtotal.toFixed(2)} &euro;</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#666;">Env&iacute;o</td>
        <td style="padding:5px 0;text-align:right;color:#333;">
          ${orderData.shipping === 0 ? '<span style="color:#16a34a;font-weight:600;">Gratis</span>' : `${orderData.shipping.toFixed(2)} &euro;`}
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#666;">IVA incluido</td>
        <td style="padding:5px 0;text-align:right;color:#333;">${orderData.tax.toFixed(2)} &euro;</td>
      </tr>
      <tr>
        <td style="padding:10px 0 0;border-top:2px solid #1a1a2e;font-weight:700;font-size:16px;color:#1a1a2e;">Total</td>
        <td style="padding:10px 0 0;border-top:2px solid #1a1a2e;text-align:right;font-weight:700;font-size:16px;color:#1a1a2e;">${orderData.total.toFixed(2)} &euro;</td>
      </tr>
    </table>
  ` : '';

  const productTableHtml = orderData?.items.length ? `
    <h3 style="margin:24px 0 10px;color:#1a1a2e;font-size:15px;">Productos</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f8f8fc;">
          <th style="padding:10px 8px;text-align:left;color:#666;font-weight:600;font-size:12px;text-transform:uppercase;">Producto</th>
          <th style="padding:10px 8px;text-align:center;color:#666;font-weight:600;font-size:12px;text-transform:uppercase;">Cant.</th>
          <th style="padding:10px 8px;text-align:right;color:#666;font-weight:600;font-size:12px;text-transform:uppercase;">Precio</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    ${pricingHtml}
  ` : '';

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: '#fef3c7', text: '#92400e' },
    Processing: { bg: '#dbeafe', text: '#1e40af' },
    Paid: { bg: '#d1fae5', text: '#065f46' },
    Shipped: { bg: '#e0e7ff', text: '#3730a3' },
    Delivered: { bg: '#d1fae5', text: '#065f46' },
    Cancelled: { bg: '#fee2e2', text: '#991b1b' },
  };
  const sc = statusColors[newStatus] ?? { bg: '#f3f4f6', text: '#374151' };

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a1a2e;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">MovilNova</h1>
            <p style="margin:6px 0 0;color:#a0a0c0;font-size:13px;">Notificaci&oacute;n de pedido</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <span style="display:inline-block;padding:6px 16px;border-radius:20px;
                         background:${sc.bg};color:${sc.text};font-weight:700;font-size:13px;letter-spacing:0.3px;">
              ${newStatus}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 32px;">
            <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">${subject}</h2>
            <p style="color:#555;margin:0 0 6px;font-size:15px;">Hola, <strong>${customerName}</strong></p>
            <p style="color:#555;margin:0 0 20px;font-size:15px;line-height:1.5;">${body}</p>
            <p style="color:#888;font-size:13px;margin:0;">Pedido: <strong style="color:#1a1a2e;">${orderNumber}</strong></p>
            ${productTableHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8fc;padding:20px 32px;text-align:center;
                     color:#999;font-size:12px;border-top:1px solid #eee;line-height:1.6;">
            MovilNova S.L. &middot; R&uacute;a Ram&oacute;n Gonz&aacute;lez 54, 36400 O Porri&ntilde;o, Pontevedra<br>
            <a href="mailto:info@movilnova.es" style="color:#666;text-decoration:none;">info@movilnova.es</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const sendOrderNotification = functions.https.onCall(
  async (data: SendOrderNotificationData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const {
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      newStatus,
      previousStatus,
      orderData,
    } = data;

    if (!orderId || !orderNumber || !customerEmail || !customerName || !newStatus) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId, orderNumber, customerEmail, customerName, and newStatus are required',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
    }

    const statusMsg = ORDER_STATUS_MESSAGES[newStatus] ?? {
      subject: `Actualización de pedido: ${newStatus}`,
      body: `El estado de tu pedido ha cambiado a ${newStatus}.`,
    };

    const db = admin.firestore();
    let emailSent = false;

    // 1. Send email via Resend
    try {
      const resend = getResend();
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      await resend.emails.send({
        from: `MovilNova <${fromEmail}>`,
        to: [customerEmail],
        subject: `${statusMsg.subject} — Pedido ${orderNumber}`,
        html: buildOrderEmailHtml({
          customerName,
          orderNumber,
          subject: statusMsg.subject,
          body: statusMsg.body,
          newStatus,
          orderData,
        }),
      });
      emailSent = true;
    } catch (emailError: unknown) {
      console.error('Resend send failed:', (emailError as Error).message || emailError);
    }

    // 2. Save notification to Firestore
    try {
      await db.collection('notifications').add({
        orderId,
        orderNumber,
        customerEmail,
        customerName,
        newStatus,
        previousStatus,
        message: statusMsg.body,
        sentAt: admin.firestore.Timestamp.now(),
        emailSent,
      });
    } catch (dbError: unknown) {
      console.error('Failed to save notification:', (dbError as Error).message || dbError);
    }

    return { success: true, emailSent };
  },
);
