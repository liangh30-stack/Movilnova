import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock dependencies
vi.mock('@/services/customerService', () => ({
  getFirestoreCart: vi.fn().mockResolvedValue([]),
  setFirestoreCart: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/sentry', () => ({
  captureException: vi.fn(),
}));

import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Phone Case',
  price: 19.99,
  category: 'cases',
  image: '/case.jpg',
  description: 'A phone case',
  selectedModel: 'iPhone 15',
  ...overrides,
});

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('initializes with an empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
    expect(result.current.cartItemCount).toBe(0);
  });

  it('adds a product to the cart', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toMatchObject({
      id: 'prod-1',
      name: 'Phone Case',
      quantity: 1,
    });
  });

  it('increments quantity when adding the same product', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product);
    });
    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]!.quantity).toBe(2);
  });

  it('adds custom products as separate items even with same id', () => {
    const { result } = renderHook(() => useCart());
    const customProduct = makeProduct({ isCustom: true });

    act(() => {
      result.current.addToCart(customProduct);
    });
    act(() => {
      result.current.addToCart(customProduct);
    });

    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart[0]!.quantity).toBe(1);
    expect(result.current.cart[1]!.quantity).toBe(1);
  });

  it('treats different selectedModel as separate items', () => {
    const { result } = renderHook(() => useCart());
    const product1 = makeProduct({ selectedModel: 'iPhone 15' });
    const product2 = makeProduct({ selectedModel: 'iPhone 16' });

    act(() => {
      result.current.addToCart(product1);
    });
    act(() => {
      result.current.addToCart(product2);
    });

    expect(result.current.cart).toHaveLength(2);
  });

  it('removes a product from the cart by index', () => {
    const { result } = renderHook(() => useCart());
    const product1 = makeProduct({ id: 'prod-1', name: 'Case' });
    const product2 = makeProduct({ id: 'prod-2', name: 'Charger', selectedModel: undefined });

    act(() => {
      result.current.addToCart(product1);
    });
    act(() => {
      result.current.addToCart(product2);
    });

    expect(result.current.cart).toHaveLength(2);

    act(() => {
      result.current.removeFromCart(0);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]!.name).toBe('Charger');
  });

  it('increases quantity with updateCartQuantity', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product);
    });

    act(() => {
      result.current.updateCartQuantity(0, 1);
    });

    expect(result.current.cart[0]!.quantity).toBe(2);
  });

  it('decreases quantity with updateCartQuantity', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product);
    });
    act(() => {
      result.current.addToCart(product); // quantity = 2
    });

    act(() => {
      result.current.updateCartQuantity(0, -1);
    });

    expect(result.current.cart[0]!.quantity).toBe(1);
  });

  it('removes item when updateCartQuantity brings quantity to 0', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product); // quantity = 1
    });

    act(() => {
      result.current.updateCartQuantity(0, -1); // quantity = 0 → remove
    });

    expect(result.current.cart).toHaveLength(0);
  });

  it('does nothing when updateCartQuantity targets invalid index', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product);
    });

    act(() => {
      result.current.updateCartQuantity(99, 1);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]!.quantity).toBe(1);
  });

  it('calculates cartTotal correctly', () => {
    const { result } = renderHook(() => useCart());
    const product1 = makeProduct({ id: 'prod-1', price: 10, selectedModel: 'A' });
    const product2 = makeProduct({ id: 'prod-2', price: 25.5, selectedModel: 'B' });

    act(() => {
      result.current.addToCart(product1); // 10 * 1
    });
    act(() => {
      result.current.addToCart(product2); // 25.5 * 1
    });
    act(() => {
      result.current.addToCart(product1); // 10 * 2
    });

    // (10 * 2) + (25.5 * 1) = 45.5
    expect(result.current.cartTotal).toBe(45.5);
  });

  it('calculates cartItemCount correctly', () => {
    const { result } = renderHook(() => useCart());
    const product1 = makeProduct({ id: 'prod-1', selectedModel: 'A' });
    const product2 = makeProduct({ id: 'prod-2', selectedModel: 'B' });

    act(() => {
      result.current.addToCart(product1);
    });
    act(() => {
      result.current.addToCart(product2);
    });
    act(() => {
      result.current.addToCart(product1); // increments prod-1 quantity to 2
    });

    // 2 + 1 = 3 total items
    expect(result.current.cartItemCount).toBe(3);
  });

  it('persists cart to localStorage on add', () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    act(() => {
      result.current.addToCart(product);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'movilnova_cart',
      expect.any(String)
    );

    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0]).toMatchObject({ id: 'prod-1', quantity: 1 });
    expect(stored.timestamp).toEqual(expect.any(Number));
  });

  it('loads cart from localStorage on initialization', () => {
    const cartData = {
      items: [{ id: 'existing-1', name: 'Existing', price: 5, image: '/x.jpg', category: 'c', description: 'd', quantity: 3 }],
      timestamp: Date.now(),
    };
    localStorageMock.setItem('movilnova_cart', JSON.stringify(cartData));

    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toMatchObject({ id: 'existing-1', quantity: 3 });
  });
});
