import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logAuditEvent } from './auditService';

const OFFERS_COLLECTION = 'specialOffers';

export interface SpecialOffer {
  id: string;
  name: string;
  type: 'buy_x_pay_y' | 'gift_with_purchase' | 'buy_x_get_extra' | 'first_purchase_discount';
  isActive: boolean;

  // buy_x_pay_y
  buyQuantity?: number;
  payQuantity?: number;
  scope?: 'all' | 'category' | 'brand';
  scopeValue?: string;

  // gift_with_purchase
  triggerProductId?: string;
  giftProductId?: string;

  // buy_x_get_extra
  requiredQuantity?: number;
  extraProductId?: string;
  extraPrice?: number;

  // first_purchase_discount
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;

  expiresAt: string | null;
  createdAt: string;
}

export type SpecialOfferInput = Omit<SpecialOffer, 'id' | 'createdAt'>;

interface CartItemForOffer {
  id: string | number;
  price: number;
  quantity: number;
  category: string;
  brands?: string[];
}

export interface AppliedOffer {
  offerName: string;
  discount: number;
}

export interface GiftSuggestion {
  offerName: string;
  giftProductId: string;
  extraPrice?: number;
}

export interface OfferDiscountResult {
  totalDiscount: number;
  appliedOffers: AppliedOffer[];
  giftSuggestions: GiftSuggestion[];
}

// ── Admin CRUD ──

export const getOffers = async (): Promise<SpecialOffer[]> => {
  const snap = await getDocs(collection(db, OFFERS_COLLECTION));
  return snap.docs.map(d => mapDoc(d.id, d.data()));
};

export const getActiveOffers = async (): Promise<SpecialOffer[]> => {
  const q = query(collection(db, OFFERS_COLLECTION), where('isActive', '==', true));
  const snap = await getDocs(q);
  const now = new Date();
  return snap.docs
    .map(d => mapDoc(d.id, d.data()))
    .filter(o => !o.expiresAt || new Date(o.expiresAt) > now);
};

export const createOffer = async (input: SpecialOfferInput, userId?: string, userEmail?: string): Promise<SpecialOffer> => {
  const docData: Record<string, unknown> = {
    name: input.name.trim(),
    type: input.type,
    isActive: input.isActive,
    expiresAt: input.expiresAt ? Timestamp.fromDate(new Date(input.expiresAt)) : null,
    createdAt: Timestamp.now(),
  };

  if (input.type === 'buy_x_pay_y') {
    docData.buyQuantity = input.buyQuantity;
    docData.payQuantity = input.payQuantity;
    docData.scope = input.scope;
    docData.scopeValue = input.scopeValue || null;
  } else if (input.type === 'buy_x_get_extra') {
    docData.requiredQuantity = input.requiredQuantity;
    docData.extraProductId = input.extraProductId;
    docData.extraPrice = input.extraPrice;
    docData.scope = input.scope;
    docData.scopeValue = input.scopeValue || null;
  } else if (input.type === 'first_purchase_discount') {
    docData.discountType = input.discountType;
    docData.discountValue = input.discountValue;
  } else {
    docData.triggerProductId = input.triggerProductId;
    docData.giftProductId = input.giftProductId;
  }

  const ref = await addDoc(collection(db, OFFERS_COLLECTION), docData);
  if (userId && userEmail) {
    logAuditEvent('offer.create', userId, userEmail, ref.id, input.name.trim());
  }
  return { id: ref.id, ...input, name: input.name.trim(), createdAt: new Date().toISOString() };
};

export const updateOffer = async (id: string, input: Partial<SpecialOfferInput>, userId?: string, userEmail?: string): Promise<void> => {
  const docRef = doc(db, OFFERS_COLLECTION, id);
  const data = { ...input } as Record<string, unknown>;
  if (input.name) data.name = input.name.trim();
  if (input.expiresAt !== undefined) {
    data.expiresAt = input.expiresAt ? Timestamp.fromDate(new Date(input.expiresAt)) : null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(docRef, data as any);
  if (userId && userEmail) {
    logAuditEvent('offer.update', userId, userEmail, id, input.name?.trim());
  }
};

export const deleteOffer = async (id: string, userId?: string, userEmail?: string): Promise<void> => {
  await deleteDoc(doc(db, OFFERS_COLLECTION, id));
  if (userId && userEmail) {
    logAuditEvent('offer.delete', userId, userEmail, id);
  }
};

// ── Discount Calculation ──

export const calculateOfferDiscounts = (
  cart: CartItemForOffer[],
  activeOffers: SpecialOffer[],
  isFirstPurchase: boolean = false,
): OfferDiscountResult => {
  const appliedOffers: AppliedOffer[] = [];
  const giftSuggestions: GiftSuggestion[] = [];
  let totalDiscount = 0;

  for (const offer of activeOffers) {
    if (offer.type === 'buy_x_pay_y') {
      const d = calcBuyXPayY(cart, offer);
      if (d > 0) {
        totalDiscount += d;
        appliedOffers.push({ offerName: offer.name, discount: d });
      }
    } else if (offer.type === 'gift_with_purchase') {
      const result = calcGiftWithPurchase(cart, offer);
      if (result.discount > 0) {
        totalDiscount += result.discount;
        appliedOffers.push({ offerName: offer.name, discount: result.discount });
      }
      if (result.suggestion) {
        giftSuggestions.push({ offerName: offer.name, giftProductId: result.suggestion });
      }
    } else if (offer.type === 'buy_x_get_extra') {
      const result = calcBuyXGetExtra(cart, offer);
      if (result.discount > 0) {
        totalDiscount += result.discount;
        appliedOffers.push({ offerName: offer.name, discount: result.discount });
      }
      if (result.suggestion) {
        giftSuggestions.push({ offerName: offer.name, giftProductId: result.suggestion, extraPrice: offer.extraPrice });
      }
    } else if (offer.type === 'first_purchase_discount' && isFirstPurchase) {
      const d = calcFirstPurchaseDiscount(cart, offer);
      if (d > 0) {
        totalDiscount += d;
        appliedOffers.push({ offerName: offer.name, discount: d });
      }
    }
  }

  return {
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    appliedOffers,
    giftSuggestions,
  };
};

// ── Internal helpers ──

function mapDoc(id: string, data: Record<string, unknown>): SpecialOffer {
  return {
    id,
    name: (data.name as string) ?? '',
    type: (data.type as SpecialOffer['type']) ?? 'buy_x_pay_y',
    isActive: (data.isActive as boolean) ?? true,
    buyQuantity: data.buyQuantity as number | undefined,
    payQuantity: data.payQuantity as number | undefined,
    scope: data.scope as SpecialOffer['scope'],
    scopeValue: data.scopeValue as string | undefined,
    triggerProductId: data.triggerProductId as string | undefined,
    giftProductId: data.giftProductId as string | undefined,
    requiredQuantity: data.requiredQuantity as number | undefined,
    extraProductId: data.extraProductId as string | undefined,
    extraPrice: data.extraPrice as number | undefined,
    discountType: data.discountType as SpecialOffer['discountType'],
    discountValue: data.discountValue as number | undefined,
    expiresAt: (data.expiresAt as { toDate?: () => Date })?.toDate?.()?.toISOString()
      ?? (data.expiresAt as string) ?? null,
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString()
      ?? (data.createdAt as string) ?? new Date().toISOString(),
  };
}

function matchesScope(item: CartItemForOffer, offer: SpecialOffer): boolean {
  if (!offer.scope || offer.scope === 'all') return true;
  if (offer.scope === 'category') return item.category === offer.scopeValue;
  if (offer.scope === 'brand') return !!offer.scopeValue && (item.brands?.includes(offer.scopeValue) ?? false);
  return false;
}

function calcBuyXPayY(cart: CartItemForOffer[], offer: SpecialOffer): number {
  const buyQty = offer.buyQuantity ?? 3;
  const payQty = offer.payQuantity ?? 2;
  if (buyQty <= payQty) return 0;

  // Expand cart items matching scope into individual units sorted by price ascending
  const units: number[] = [];
  for (const item of cart) {
    if (matchesScope(item, offer)) {
      for (let i = 0; i < item.quantity; i++) {
        units.push(item.price);
      }
    }
  }

  units.sort((a, b) => a - b);

  const freePerGroup = buyQty - payQty;
  let discount = 0;

  // Process complete groups
  const fullGroups = Math.floor(units.length / buyQty);
  for (let g = 0; g < fullGroups; g++) {
    const groupStart = g * buyQty;
    // Cheapest items in each group are free
    for (let f = 0; f < freePerGroup; f++) {
      discount += units[groupStart + f];
    }
  }

  // Prices already include IVA, so discount is already IVA-inclusive
  return parseFloat(discount.toFixed(2));
}

function calcGiftWithPurchase(
  cart: CartItemForOffer[],
  offer: SpecialOffer
): { discount: number; suggestion: string | null } {
  if (!offer.triggerProductId || !offer.giftProductId) {
    return { discount: 0, suggestion: null };
  }

  const hasTrigger = cart.some(item => String(item.id) === offer.triggerProductId);
  if (!hasTrigger) return { discount: 0, suggestion: null };

  const giftItem = cart.find(item => String(item.id) === offer.giftProductId);
  if (giftItem) {
    // Gift is in cart — discount 1 unit of the gift product
    const discount = parseFloat(giftItem.price.toFixed(2));
    return { discount, suggestion: null };
  }

  // Gift not in cart — suggest adding it
  return { discount: 0, suggestion: offer.giftProductId };
}

function calcBuyXGetExtra(
  cart: CartItemForOffer[],
  offer: SpecialOffer
): { discount: number; suggestion: string | null } {
  if (!offer.extraProductId || offer.extraPrice == null) {
    return { discount: 0, suggestion: null };
  }

  const reqQty = offer.requiredQuantity ?? 2;

  // Count qualifying items in cart (excluding the extra product itself)
  let qualifyingCount = 0;
  for (const item of cart) {
    if (String(item.id) === offer.extraProductId) continue;
    if (matchesScope(item, offer)) {
      qualifyingCount += item.quantity;
    }
  }

  if (qualifyingCount < reqQty) return { discount: 0, suggestion: null };

  const extraItem = cart.find(item => String(item.id) === offer.extraProductId);
  if (extraItem) {
    // Extra product is in cart — discount = original price minus the special price
    const discount = Math.max(0, extraItem.price - offer.extraPrice);
    return { discount: parseFloat(discount.toFixed(2)), suggestion: null };
  }

  // Extra product not in cart — suggest adding it
  return { discount: 0, suggestion: offer.extraProductId };
}

function calcFirstPurchaseDiscount(cart: CartItemForOffer[], offer: SpecialOffer): number {
  if (!offer.discountValue || offer.discountValue <= 0) return 0;
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (cartTotal <= 0) return 0;

  if (offer.discountType === 'percentage') {
    const pct = Math.min(offer.discountValue, 100);
    return parseFloat((cartTotal * pct / 100).toFixed(2));
  }
  // fixed
  return parseFloat(Math.min(offer.discountValue, cartTotal).toFixed(2));
}
