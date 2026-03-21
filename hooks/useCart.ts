import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product, FirestoreCartItem } from '../types';
import { getFirestoreCart, setFirestoreCart } from '../services/customerService';
import { captureException } from '../services/sentry';

interface CartItem extends Product {
  quantity: number;
}

const LOCAL_CART_KEY = 'movilnova_cart';
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const getLocalCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(LOCAL_CART_KEY);
    if (!stored) return [];
    const { items, timestamp } = JSON.parse(stored);
    // Expire cart after 30 days
    if (timestamp && Date.now() - timestamp > CART_TTL_MS) {
      localStorage.removeItem(LOCAL_CART_KEY);
      return [];
    }
    // Backwards-compatible: if no timestamp (old format), treat as valid array
    return Array.isArray(items) ? items : (Array.isArray(JSON.parse(stored)) ? JSON.parse(stored) : []);
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)), { source: 'getLocalCart' });
    return [];
  }
};

const saveLocalCart = (items: CartItem[]) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify({ items, timestamp: Date.now() }));
};

export const useCart = (customerUid: string | null = null) => {
  // Always initialize from localStorage (instant, works for both anon & logged-in)
  const [cart, setCart] = useState<CartItem[]>(getLocalCart);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  // Load cart from Firestore when customer logs in, merge with local cache
  useEffect(() => {
    if (customerUid && !initialLoadDone.current) {
      initialLoadDone.current = true;
      getFirestoreCart(customerUid)
        .then((firestoreItems) => {
          const loadedCart: CartItem[] = firestoreItems.map((item) => ({
            id: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            selectedModel: item.selectedModel,
            selectedColor: item.selectedColor,
            isCustom: item.isCustom,
            category: '',
            description: '',
          }));
          setCart((prev) => {
            // Merge: keep existing (from localStorage) + add Firestore items not already present
            const merged: CartItem[] = [...prev];
            const existingKeys = new Set(merged.map((p) => `${p.id}-${p.selectedModel || ''}-${p.selectedColor || ''}`));
            for (const item of loadedCart) {
              const key = `${item.id}-${item.selectedModel || ''}-${item.selectedColor || ''}`;
              if (!existingKeys.has(key)) {
                merged.push(item);
                existingKeys.add(key);
              }
            }
            // Persist merged result to both localStorage and Firestore
            saveLocalCart(merged);
            if (merged.length !== loadedCart.length || prev.length > 0) {
              syncToFirestoreImmediate(customerUid, merged);
            }
            return merged;
          });
        })
        .catch((err) => {
          captureException(err instanceof Error ? err : new Error(String(err)), { source: 'useCart.loadFirestoreCart' });
        });
    }
    if (!customerUid) {
      initialLoadDone.current = false;
    }
  }, [customerUid]);

  // Immediate sync helper
  const syncToFirestoreImmediate = useCallback(
    (uid: string, items: CartItem[]) => {
      const firestoreItems: FirestoreCartItem[] = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        selectedModel: item.selectedModel,
        selectedColor: item.selectedColor,
        isCustom: item.isCustom,
        addedAt: new Date().toISOString(),
      }));
      setFirestoreCart(uid, firestoreItems).catch((err) => {
        captureException(err instanceof Error ? err : new Error(String(err)), { source: 'useCart.syncFirestore' });
      });
    },
    []
  );

  // Persist cart: always to localStorage, additionally to Firestore if logged in
  const persistCart = useCallback(
    (items: CartItem[]) => {
      saveLocalCart(items);
      if (customerUid) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          syncToFirestoreImmediate(customerUid, items);
        }, 500);
      }
    },
    [customerUid, syncToFirestoreImmediate]
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      let updated: CartItem[];
      if (product.isCustom) {
        updated = [...prev, { ...product, quantity: 1 }];
      } else {
        const existingIndex = prev.findIndex(
          (item) => item.id === product.id && item.selectedModel === product.selectedModel && item.selectedColor === product.selectedColor
        );
        if (existingIndex >= 0) {
          updated = [...prev];
          const existing = updated[existingIndex]!;
          updated[existingIndex] = {
            ...existing,
            quantity: existing.quantity + 1,
          };
        } else {
          updated = [...prev, { ...product, quantity: 1 }];
        }
      }
      persistCart(updated);
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      persistCart(updated);
      return updated;
    });
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      let result: CartItem[];
      if (newQty <= 0) {
        result = prev.filter((_, i) => i !== index);
      } else {
        updated[index] = { ...item, quantity: newQty };
        result = updated;
      }
      persistCart(result);
      return result;
    });
  };

  const cartTotal = useMemo(() => cart.reduce((acc, p) => acc + p.price * p.quantity, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((acc, p) => acc + p.quantity, 0), [cart]);

  return {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    cartItemCount,
  };
};

export type { CartItem };
