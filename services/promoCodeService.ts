import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { logAuditEvent } from './auditService';

const PROMO_CODES_COLLECTION = 'promoCodes';

export interface PromoCode {
  id: string;
  code: string;           // e.g. "WELCOME10"
  discountType: 'percentage' | 'fixed';  // percentage or fixed amount
  discountValue: number;  // e.g. 10 for 10% or 5 for 5€
  minPurchase: number;    // minimum subtotal to apply (0 = no minimum)
  maxUses: number;        // 0 = unlimited (global)
  maxUsesPerUser: number; // 0 = unlimited, 1 = once per user account
  usedCount: number;
  usedByUsers: string[];  // list of userIds who have used this code
  isActive: boolean;
  expiresAt: string | null;  // ISO date string or null for no expiry
  createdAt: string;
}

export type PromoCodeInput = Omit<PromoCode, 'id' | 'usedCount' | 'usedByUsers' | 'createdAt'>;

/**
 * Get all promo codes (admin)
 */
export const getPromoCodes = async (): Promise<PromoCode[]> => {
  const snap = await getDocs(collection(db, PROMO_CODES_COLLECTION));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchase: data.minPurchase ?? 0,
      maxUses: data.maxUses ?? 0,
      maxUsesPerUser: data.maxUsesPerUser ?? 0,
      usedCount: data.usedCount ?? 0,
      usedByUsers: data.usedByUsers ?? [],
      isActive: data.isActive ?? true,
      expiresAt: data.expiresAt?.toDate?.()?.toISOString() ?? data.expiresAt ?? null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? new Date().toISOString(),
    };
  });
};

/**
 * Create a new promo code
 */
export const createPromoCode = async (input: PromoCodeInput, userId?: string, userEmail?: string): Promise<PromoCode> => {
  const code = input.code.toUpperCase().trim();
  const docData = {
    code,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minPurchase: input.minPurchase,
    maxUses: input.maxUses,
    maxUsesPerUser: input.maxUsesPerUser ?? 0,
    usedCount: 0,
    usedByUsers: [],
    isActive: input.isActive,
    expiresAt: input.expiresAt ? Timestamp.fromDate(new Date(input.expiresAt)) : null,
    createdAt: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, PROMO_CODES_COLLECTION), docData);
  if (userId && userEmail) {
    logAuditEvent('promo.create', userId, userEmail, ref.id, code);
  }
  return {
    id: ref.id,
    ...input,
    code,
    usedCount: 0,
    usedByUsers: [],
    createdAt: new Date().toISOString(),
  };
};

/**
 * Update a promo code
 */
export const updatePromoCode = async (id: string, input: Partial<PromoCodeInput>, userId?: string, userEmail?: string): Promise<void> => {
  const docRef = doc(db, PROMO_CODES_COLLECTION, id);
  const data = { ...input } as Record<string, unknown>;
  if (input.code) data.code = input.code.toUpperCase().trim();
  if (input.expiresAt !== undefined) {
    data.expiresAt = input.expiresAt ? Timestamp.fromDate(new Date(input.expiresAt)) : null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(docRef, data as any);
  if (userId && userEmail) {
    logAuditEvent('promo.update', userId, userEmail, id);
  }
};

/**
 * Delete a promo code
 */
export const deletePromoCode = async (id: string, userId?: string, userEmail?: string): Promise<void> => {
  await deleteDoc(doc(db, PROMO_CODES_COLLECTION, id));
  if (userId && userEmail) {
    logAuditEvent('promo.delete', userId, userEmail, id);
  }
};

/**
 * Validate and apply a promo code (customer-facing)
 * Returns the promo code if valid, or throws an error with a reason key
 */
export const validatePromoCode = async (code: string, subtotal: number, userId?: string): Promise<PromoCode> => {
  const q = query(
    collection(db, PROMO_CODES_COLLECTION),
    where('code', '==', code.toUpperCase().trim()),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('promoInvalid');
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  const promo: PromoCode = {
    id: docSnap.id,
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minPurchase: data.minPurchase ?? 0,
    maxUses: data.maxUses ?? 0,
    maxUsesPerUser: data.maxUsesPerUser ?? 0,
    usedCount: data.usedCount ?? 0,
    usedByUsers: data.usedByUsers ?? [],
    isActive: data.isActive,
    expiresAt: data.expiresAt?.toDate?.()?.toISOString() ?? data.expiresAt ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? '',
  };

  // Check expiry
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    throw new Error('promoExpired');
  }

  // Check global usage limit
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    throw new Error('promoMaxUsed');
  }

  // Check per-user usage limit
  if (promo.maxUsesPerUser > 0 && userId) {
    const userUses = promo.usedByUsers.filter(uid => uid === userId).length;
    if (userUses >= promo.maxUsesPerUser) {
      throw new Error('promoAlreadyUsed');
    }
  }

  // Check minimum purchase
  if (subtotal < promo.minPurchase) {
    throw new Error('promoMinPurchase');
  }

  return promo;
};

/**
 * Atomically increment usage count after a successful order.
 * Also records the userId to enforce per-user limits.
 */
export const incrementPromoUsage = async (id: string, userId?: string): Promise<void> => {
  const docRef = doc(db, PROMO_CODES_COLLECTION, id);
  const update: Record<string, unknown> = { usedCount: increment(1) };
  if (userId) {
    update.usedByUsers = arrayUnion(userId);
  }
  await updateDoc(docRef, update);
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (promo: PromoCode, subtotal: number): number => {
  if (promo.discountType === 'percentage') {
    return parseFloat((subtotal * promo.discountValue / 100).toFixed(2));
  }
  // Fixed discount — can't exceed subtotal
  return parseFloat(Math.min(promo.discountValue, subtotal).toFixed(2));
};
