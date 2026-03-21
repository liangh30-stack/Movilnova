import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logAuditEvent } from './auditService';

const SHOP_SETTINGS_DOC = 'shopSettings/general';

export interface ShopSettings {
  ivaRate: number;          // e.g. 0.21 for 21%
  showIva: boolean;         // whether to display the IVA line at checkout
  shippingCost: number;     // e.g. 4.99
  freeShippingThreshold: number; // e.g. 50 (free shipping above this subtotal)
  currency: string;         // e.g. "EUR"
  currencySymbol: string;   // e.g. "$" or "€"
  maintenanceMode: boolean; // when true, non-admin users see a maintenance page
  featuredProductId?: string; // Firestore product ID to highlight in hero section
  bannerEnabled: boolean;   // show/hide the promotional banner
  bannerText: string;       // main banner text
  bannerSubtext: string;    // secondary text (e.g. "Ends in 24h")
  updatedAt?: string;
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  ivaRate: 0.21,
  showIva: true,
  shippingCost: 4.99,
  freeShippingThreshold: 50,
  currency: 'EUR',
  currencySymbol: '€',
  maintenanceMode: false,
  bannerEnabled: false,
  bannerText: '',
  bannerSubtext: '',
};

/**
 * Get shop settings from Firestore (or defaults if not set)
 */
export const getShopSettings = async (): Promise<ShopSettings> => {
  try {
    const docRef = doc(db, SHOP_SETTINGS_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return DEFAULT_SHOP_SETTINGS;
    }

    const data = docSnap.data();
    return {
      ivaRate: data.ivaRate ?? DEFAULT_SHOP_SETTINGS.ivaRate,
      showIva: data.showIva ?? DEFAULT_SHOP_SETTINGS.showIva,
      shippingCost: data.shippingCost ?? DEFAULT_SHOP_SETTINGS.shippingCost,
      freeShippingThreshold: data.freeShippingThreshold ?? DEFAULT_SHOP_SETTINGS.freeShippingThreshold,
      currency: data.currency ?? DEFAULT_SHOP_SETTINGS.currency,
      currencySymbol: data.currencySymbol ?? DEFAULT_SHOP_SETTINGS.currencySymbol,
      maintenanceMode: data.maintenanceMode ?? DEFAULT_SHOP_SETTINGS.maintenanceMode,
      featuredProductId: data.featuredProductId ?? undefined,
      bannerEnabled: data.bannerEnabled ?? DEFAULT_SHOP_SETTINGS.bannerEnabled,
      bannerText: data.bannerText ?? DEFAULT_SHOP_SETTINGS.bannerText,
      bannerSubtext: data.bannerSubtext ?? DEFAULT_SHOP_SETTINGS.bannerSubtext,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
    };
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Error loading shop settings, using defaults:', error);
    return DEFAULT_SHOP_SETTINGS;
  }
};

/**
 * Save shop settings to Firestore (admin only)
 */
export const saveShopSettings = async (
  settings: Omit<ShopSettings, 'updatedAt'>,
  userId?: string,
  userEmail?: string,
): Promise<void> => {
  const docRef = doc(db, SHOP_SETTINGS_DOC);
  const payload: Record<string, unknown> = {
    ivaRate: settings.ivaRate,
    showIva: settings.showIva,
    shippingCost: settings.shippingCost,
    freeShippingThreshold: settings.freeShippingThreshold,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    maintenanceMode: settings.maintenanceMode,
    bannerEnabled: settings.bannerEnabled,
    bannerText: settings.bannerText,
    bannerSubtext: settings.bannerSubtext,
    updatedAt: Timestamp.now(),
  };
  if (settings.featuredProductId) {
    payload.featuredProductId = settings.featuredProductId;
  }
  await setDoc(docRef, payload);
  if (userId && userEmail) {
    logAuditEvent('settings.update', userId, userEmail, 'general', 'Shop Settings');
  }
};

/**
 * Subscribe to real-time shop settings changes
 */
export const subscribeToShopSettings = (
  onUpdate: (settings: ShopSettings) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const docRef = doc(db, SHOP_SETTINGS_DOC);

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      onUpdate(DEFAULT_SHOP_SETTINGS);
      return;
    }

    const data = docSnap.data();
    onUpdate({
      ivaRate: data.ivaRate ?? DEFAULT_SHOP_SETTINGS.ivaRate,
      showIva: data.showIva ?? DEFAULT_SHOP_SETTINGS.showIva,
      shippingCost: data.shippingCost ?? DEFAULT_SHOP_SETTINGS.shippingCost,
      freeShippingThreshold: data.freeShippingThreshold ?? DEFAULT_SHOP_SETTINGS.freeShippingThreshold,
      currency: data.currency ?? DEFAULT_SHOP_SETTINGS.currency,
      currencySymbol: data.currencySymbol ?? DEFAULT_SHOP_SETTINGS.currencySymbol,
      maintenanceMode: data.maintenanceMode ?? DEFAULT_SHOP_SETTINGS.maintenanceMode,
      featuredProductId: data.featuredProductId ?? undefined,
      bannerEnabled: data.bannerEnabled ?? DEFAULT_SHOP_SETTINGS.bannerEnabled,
      bannerText: data.bannerText ?? DEFAULT_SHOP_SETTINGS.bannerText,
      bannerSubtext: data.bannerSubtext ?? DEFAULT_SHOP_SETTINGS.bannerSubtext,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
    });
  }, onError);
};
