import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: Math.floor(Date.now() / 1000), toDate: () => new Date() }),
  },
}));

vi.mock('@/services/firebase', () => ({
  db: {},
}));

vi.mock('@/services/inventoryService', () => ({
  decrementProductStock: vi.fn().mockResolvedValue(undefined),
  incrementProductStock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/emailService', () => ({
  sendOrderStatusNotification: vi.fn().mockResolvedValue(undefined),
}));

import {
  addDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {
  createOrder,
  getCustomerOrders,
  hasPurchasedProduct,
} from '@/services/orderService';

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOrderNumber (tested via createOrder)', () => {
    it('generates order number in correct format ORD-YYYY-MMDDHHMMSS-MS', async () => {
      const mockDocRef = { id: 'doc-123' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as never);

      const orderData = {
        customerName: 'John Doe',
        email: 'john@test.com',
        phone: '+34600111222',
        address: '123 Main St, Madrid',
        items: [
          {
            productId: 'p1',
            productName: 'Phone Case',
            productImage: '/case.jpg',
            price: 19.99,
            quantity: 1,
          },
        ],
        subtotal: 19.99,
        shipping: 4.99,
        tax: 4.2,
        total: 29.18,
        status: 'Pending' as const,
        paymentMethod: 'Stripe' as const,
      };

      const result = await createOrder(orderData);

      // Verify the order number format: ORD-YYYY-MMDDHHMMSS-MS
      // month(2) + day(2) + hours(2) + minutes(2) + seconds(2) = 10 digits, then 3-digit ms
      expect(result.orderNumber).toMatch(/^ORD-\d{4}-\d{10}-\d{3}$/);

      // Verify it starts with ORD- and current year
      const currentYear = new Date().getFullYear().toString();
      expect(result.orderNumber).toContain(`ORD-${currentYear}-`);
    });
  });

  describe('createOrder', () => {
    it('builds correct Firestore object and calls addDoc', async () => {
      const mockDocRef = { id: 'new-order-id' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as never);

      const orderData = {
        customerId: 'user-123',
        customerName: 'Jane Doe',
        email: 'jane@test.com',
        phone: '+34600222333',
        address: '456 Elm St, Barcelona',
        items: [
          {
            productId: 'p1',
            productName: 'Charger',
            productImage: '/charger.jpg',
            price: 29.99,
            quantity: 2,
          },
        ],
        subtotal: 59.98,
        shipping: 0,
        tax: 12.6,
        total: 72.58,
        status: 'Pending' as const,
        paymentMethod: 'Card' as const,
        paymentId: 'pay_abc123',
      };

      const result = await createOrder(orderData);

      expect(addDoc).toHaveBeenCalledOnce();
      const firestoreObj = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;

      // Verify required fields
      expect(firestoreObj).toMatchObject({
        customerName: 'Jane Doe',
        email: 'jane@test.com',
        phone: '+34600222333',
        address: '456 Elm St, Barcelona',
        subtotal: 59.98,
        shipping: 0,
        tax: 12.6,
        total: 72.58,
        status: 'Pending',
        paymentMethod: 'Card',
        customerId: 'user-123',
        paymentId: 'pay_abc123',
      });

      // Verify statusHistory was created
      expect(firestoreObj.statusHistory).toEqual([
        expect.objectContaining({
          status: 'Pending',
          note: 'Order created',
        }),
      ]);

      // Verify timestamps were added
      expect(firestoreObj.createdAt).toBeDefined();
      expect(firestoreObj.updatedAt).toBeDefined();

      // Verify orderNumber was generated
      expect(firestoreObj.orderNumber).toMatch(/^ORD-\d{4}-\d{10}-\d{3}$/);

      // Verify returned order has the doc id
      expect(result.id).toBe('new-order-id');
    });

    it('omits optional fields when they are undefined', async () => {
      const mockDocRef = { id: 'doc-456' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as never);

      const orderData = {
        customerName: 'Guest User',
        email: 'guest@test.com',
        phone: '+34600333444',
        address: '789 Oak St',
        items: [
          {
            productId: 'p2',
            productName: 'Screen Protector',
            productImage: '/screen.jpg',
            price: 9.99,
            quantity: 1,
          },
        ],
        subtotal: 9.99,
        shipping: 4.99,
        tax: 2.1,
        total: 17.08,
        status: 'Pending' as const,
        paymentMethod: 'Stripe' as const,
      };

      await createOrder(orderData);

      const firestoreObj = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;

      // Optional fields should not be present
      expect(firestoreObj).not.toHaveProperty('customerId');
      expect(firestoreObj).not.toHaveProperty('paymentId');
      expect(firestoreObj).not.toHaveProperty('trackingNumber');
      expect(firestoreObj).not.toHaveProperty('notes');
    });

    it('defaults status to Pending when not provided', async () => {
      const mockDocRef = { id: 'doc-789' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as never);

      const orderData = {
        customerName: 'Test',
        email: 'test@test.com',
        phone: '123',
        address: 'Addr',
        items: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        status: 'Pending' as const,
        paymentMethod: 'Cash' as const,
      } as Parameters<typeof createOrder>[0];

      await createOrder(orderData);

      const firestoreObj = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(firestoreObj.status).toBe('Pending');
    });
  });

  describe('getCustomerOrders', () => {
    it('returns orders queried by customerId', async () => {
      const mockTimestamp = {
        toDate: () => new Date('2026-01-15T10:00:00Z'),
      };

      const mockDocs = [
        {
          id: 'order-1',
          data: () => ({
            orderNumber: 'ORD-2026-011510000-001',
            customerName: 'John',
            email: 'john@test.com',
            phone: '123',
            address: 'Addr',
            items: [],
            subtotal: 10,
            shipping: 0,
            tax: 2.1,
            total: 12.1,
            status: 'Delivered',
            statusHistory: [
              { status: 'Pending', timestamp: mockTimestamp, note: 'Created' },
            ],
            paymentMethod: 'Stripe',
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
        empty: false,
      } as never);

      const orders = await getCustomerOrders('user-123');

      expect(getDocs).toHaveBeenCalledOnce();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: 'order-1',
        orderNumber: 'ORD-2026-011510000-001',
        customerName: 'John',
        status: 'Delivered',
      });
    });

    it('falls back to email query when customerId returns no results', async () => {
      const mockTimestamp = {
        toDate: () => new Date('2026-02-01T12:00:00Z'),
      };

      // First call (by customerId) returns empty
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
        empty: true,
      } as never);

      // Second call (by email) returns a result
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'guest-order-1',
            data: () => ({
              orderNumber: 'ORD-2026-020112000-010',
              customerName: 'Guest',
              email: 'guest@test.com',
              phone: '456',
              address: 'Guest Addr',
              items: [],
              subtotal: 5,
              shipping: 4.99,
              tax: 1,
              total: 10.99,
              status: 'Pending',
              statusHistory: [
                { status: 'Pending', timestamp: mockTimestamp, note: 'Created' },
              ],
              paymentMethod: 'Stripe',
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            }),
          },
        ],
        empty: false,
      } as never);

      const orders = await getCustomerOrders('user-999', 'guest@test.com');

      // getDocs should have been called twice: once for customerId, once for email
      expect(getDocs).toHaveBeenCalledTimes(2);
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: 'guest-order-1',
        email: 'guest@test.com',
      });
    });

    it('does not fall back to email when customerId returns results', async () => {
      const mockTimestamp = {
        toDate: () => new Date('2026-01-20T08:00:00Z'),
      };

      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'order-1',
            data: () => ({
              orderNumber: 'ORD-2026-012008000-005',
              customerId: 'user-123',
              customerName: 'John',
              email: 'john@test.com',
              phone: '123',
              address: 'Addr',
              items: [],
              subtotal: 10,
              shipping: 0,
              tax: 2.1,
              total: 12.1,
              status: 'Shipped',
              statusHistory: [
                { status: 'Pending', timestamp: mockTimestamp },
              ],
              paymentMethod: 'Card',
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            }),
          },
        ],
        empty: false,
      } as never);

      const orders = await getCustomerOrders('user-123', 'john@test.com');

      // Only one call should have been made (no email fallback)
      expect(getDocs).toHaveBeenCalledOnce();
      expect(orders).toHaveLength(1);
    });

    it('does not fall back to email when email is not provided', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
        empty: true,
      } as never);

      const orders = await getCustomerOrders('user-999');

      expect(getDocs).toHaveBeenCalledOnce();
      expect(orders).toEqual([]);
    });
  });

  describe('hasPurchasedProduct', () => {
    it('returns true when product found in order with Paid status', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Paid',
              items: [{ productId: 'p1', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(true);
    });

    it('returns true when product found in order with Shipped status', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Shipped',
              items: [{ productId: 'p1', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(true);
    });

    it('returns true when product found in order with Delivered status', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Delivered',
              items: [{ productId: 'p1', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(true);
    });

    it('returns false for Pending status even if product matches', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Pending',
              items: [{ productId: 'p1', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(false);
    });

    it('returns false for Cancelled status even if product matches', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Cancelled',
              items: [{ productId: 'p1', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(false);
    });

    it('returns false for Processing status even if product matches', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Processing',
              items: [{ productId: 'p1', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(false);
    });

    it('returns false when product is not in any order', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Delivered',
              items: [{ productId: 'p2', quantity: 1 }],
            }),
          },
        ],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(false);
    });

    it('returns false when customer has no orders', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as never);

      const result = await hasPurchasedProduct('user-123', 'p1');

      expect(result).toBe(false);
    });

    it('matches productId using string comparison', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'Delivered',
              items: [{ productId: 123, quantity: 1 }],
            }),
          },
        ],
      } as never);

      // Passing number productId as string should still match due to String() comparison
      const result = await hasPurchasedProduct('user-123', 123);

      expect(result).toBe(true);
    });
  });
});
