import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: Math.floor(Date.now() / 1000) }),
  },
}));

vi.mock('@/services/firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('@/services/inventoryService', () => ({
  logInventoryChange: vi.fn(),
}));

import {
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/productService';

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return products from Firestore', async () => {
      const mockProducts = [
        {
          id: 'p1',
          data: () => ({
            name: 'Test Product',
            price: 29.99,
            category: 'case',
            image: 'url',
            description: 'desc',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockProducts,
      } as never);

      const result = await getProducts();

      expect(collection).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'p1',
        name: 'Test Product',
        price: 29.99,
        category: 'case',
      });
    });

    it('should return empty array when no products', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

      const result = await getProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductById', () => {
    it('should return product when exists', async () => {
      const mockDoc = {
        id: 'p1',
        exists: () => true,
        data: () => ({
          name: 'Single Product',
          price: 19.99,
          category: 'charger',
          image: 'img',
          description: 'd',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockDoc as never);

      const result = await getProductById('p1');

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: 'p1',
        name: 'Single Product',
        price: 19.99,
      });
    });

    it('should return null when product does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as never);

      const result = await getProductById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create product and return with id', async () => {
      const newProduct = {
        name: 'New Product',
        price: 39.99,
        category: 'bundle',
        image: 'url',
        description: 'New bundle',
      };

      vi.mocked(addDoc).mockResolvedValue({
        id: 'new-id',
      } as never);

      const result = await createProduct(newProduct);

      expect(addDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'new-id',
        name: newProduct.name,
        price: newProduct.price,
      });
    });
  });

  describe('updateProduct', () => {
    it('should call updateDoc with partial data', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateProduct('p1', { price: 25.99 });

      expect(updateDoc).toHaveBeenCalled();
      const [, updateData] = vi.mocked(updateDoc).mock.calls[0];
      expect(updateData).toMatchObject({ price: 25.99 });
      expect(updateData).toHaveProperty('updatedAt');
    });
  });

  describe('deleteProduct', () => {
    it('should call deleteDoc', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

      await deleteProduct('p1');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
