import { useState, useEffect } from 'react';
import { ShopSettings, DEFAULT_SHOP_SETTINGS, subscribeToShopSettings } from '../services/storeConfigService';

/**
 * Hook to load and subscribe to shop settings (IVA, shipping, etc.)
 * Returns default values immediately while loading from Firestore.
 */
export const useShopSettings = () => {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToShopSettings(
      (newSettings) => {
        setSettings(newSettings);
        setLoading(false);
      },
      (error) => {
        if (import.meta.env.DEV) console.warn('Shop settings subscription error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { settings, loading };
};
