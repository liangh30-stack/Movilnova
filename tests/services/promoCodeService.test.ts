import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- Mock Firestore ----------
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockIncrement = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  Timestamp: {
    now: () => ({ toDate: () => new Date('2025-06-01T00:00:00.000Z') }),
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
  increment: (n: number) => mockIncrement(n),
}));

vi.mock('@/services/firebase', () => ({
  db: {},
}));

// Import AFTER all mocks are set up
import {
  createPromoCode,
  validatePromoCode,
  deletePromoCode,
  calculateDiscount,
} from '@/services/promoCodeService';
import type { PromoCode, PromoCodeInput } from '@/services/promoCodeService';

// ---------- Helpers ----------
const makePromoInput = (overrides: Partial<PromoCodeInput> = {}): PromoCodeInput => ({
  code: 'WELCOME10',
  discountType: 'percentage',
  discountValue: 10,
  minPurchase: 0,
  maxUses: 0,
  isActive: true,
  expiresAt: null,
  ...overrides,
});

const makeFirestoreDoc = (data: Record<string, unknown>, id = 'promo-001') => ({
  id,
  data: () => data,
});

// ---------- Tests ----------
describe('promoCodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('promoCodes-ref');
    mockDoc.mockReturnValue('promo-doc-ref');
    mockQuery.mockReturnValue('promo-query');
    mockWhere.mockReturnValue('where-clause');
  });

  // ---- createPromoCode ----
  it('creates a promo code document and returns the promo code', async () => {
    mockAddDoc.mockResolvedValue({ id: 'promo-new-001' });

    const input = makePromoInput({ code: 'summer20' });
    const result = await createPromoCode(input);

    expect(mockAddDoc).toHaveBeenCalledOnce();
    expect(result.id).toBe('promo-new-001');
    expect(result.code).toBe('SUMMER20'); // uppercased and trimmed
    expect(result.usedCount).toBe(0);
    expect(result.discountType).toBe('percentage');
    expect(result.discountValue).toBe(10);
  });

  // ---- validatePromoCode (valid code) ----
  it('validates a valid promo code and returns it', async () => {
    const promoData = {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 0,
      maxUses: 0,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeFirestoreDoc(promoData)],
    });

    const result = await validatePromoCode('welcome10', 50);

    expect(mockQuery).toHaveBeenCalledOnce();
    expect(result.code).toBe('WELCOME10');
    expect(result.id).toBe('promo-001');
    expect(result.discountType).toBe('percentage');
    expect(result.discountValue).toBe(10);
  });

  // ---- validatePromoCode (expired) ----
  it('throws promoExpired for an expired promo code', async () => {
    const promoData = {
      code: 'EXPIRED5',
      discountType: 'fixed',
      discountValue: 5,
      minPurchase: 0,
      maxUses: 0,
      usedCount: 0,
      isActive: true,
      expiresAt: '2020-01-01T00:00:00.000Z', // expired
      createdAt: '2019-01-01T00:00:00.000Z',
    };

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeFirestoreDoc(promoData, 'promo-expired')],
    });

    await expect(validatePromoCode('EXPIRED5', 50)).rejects.toThrow('promoExpired');
  });

  // ---- validatePromoCode (maxUses exceeded) ----
  it('throws promoMaxUsed when usage limit is exceeded', async () => {
    const promoData = {
      code: 'LIMITED',
      discountType: 'percentage',
      discountValue: 15,
      minPurchase: 0,
      maxUses: 5,
      usedCount: 5,
      isActive: true,
      expiresAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeFirestoreDoc(promoData, 'promo-limited')],
    });

    await expect(validatePromoCode('LIMITED', 50)).rejects.toThrow('promoMaxUsed');
  });

  // ---- validatePromoCode (minPurchase not met) ----
  it('throws promoMinPurchase when subtotal is below minimum', async () => {
    const promoData = {
      code: 'BIGORDER',
      discountType: 'percentage',
      discountValue: 20,
      minPurchase: 100,
      maxUses: 0,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [makeFirestoreDoc(promoData, 'promo-bigorder')],
    });

    await expect(validatePromoCode('BIGORDER', 50)).rejects.toThrow('promoMinPurchase');
  });

  // ---- validatePromoCode (invalid / not found) ----
  it('throws promoInvalid when code does not exist', async () => {
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });

    await expect(validatePromoCode('FAKECODE', 50)).rejects.toThrow('promoInvalid');
  });

  // ---- deletePromoCode ----
  it('deletes a promo code by id', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await deletePromoCode('promo-del-001');

    expect(mockDoc).toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalledOnce();
  });

  // ---- calculateDiscount (percentage) ----
  it('calculates percentage discount correctly', () => {
    const promo: PromoCode = {
      id: 'p1',
      code: 'PERCENT10',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 0,
      maxUses: 0,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    expect(calculateDiscount(promo, 100)).toBe(10);
    expect(calculateDiscount(promo, 59.99)).toBe(6);
  });

  // ---- calculateDiscount (fixed) ----
  it('calculates fixed discount and caps it at subtotal', () => {
    const promo: PromoCode = {
      id: 'p2',
      code: 'FIXED15',
      discountType: 'fixed',
      discountValue: 15,
      minPurchase: 0,
      maxUses: 0,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    // Normal case: discount < subtotal
    expect(calculateDiscount(promo, 100)).toBe(15);
    // Capped: discount > subtotal
    expect(calculateDiscount(promo, 10)).toBe(10);
  });
});
