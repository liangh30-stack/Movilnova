import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cookie_consent';
const CONSENT_MAX_AGE_MS = 24 * 30 * 24 * 60 * 60 * 1000; // ~24 months (AEPD max)

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

interface StoredConsent {
  preferences: CookiePreferences;
  timestamp: number;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: true,
};

function isConsentValid(stored: StoredConsent): boolean {
  return Date.now() - stored.timestamp < CONSENT_MAX_AGE_MS;
}

function loadConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    // Migrate from old format ('all' | 'essential')
    if (raw === 'all' || raw === 'essential') {
      const migrated: StoredConsent = {
        preferences: {
          essential: true,
          analytics: raw === 'all',
          functional: true,
        },
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed.preferences || !parsed.timestamp) return null;
    if (!isConsentValid(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<StoredConsent | null>(() => loadConsent());
  const [bannerVisible, setBannerVisible] = useState(!loadConsent());

  // Listen for re-open event (from footer "Manage cookies" link)
  useEffect(() => {
    const handler = () => setBannerVisible(true);
    window.addEventListener('open-cookie-settings', handler);
    return () => window.removeEventListener('open-cookie-settings', handler);
  }, []);

  const saveConsent = useCallback((preferences: CookiePreferences) => {
    const stored: StoredConsent = {
      preferences: { ...preferences, essential: true },
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setConsent(stored);
    setBannerVisible(false);
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({ essential: true, analytics: true, functional: true });
  }, [saveConsent]);

  const rejectNonEssential = useCallback(() => {
    saveConsent({ essential: true, analytics: false, functional: true });
  }, [saveConsent]);

  const openBanner = useCallback(() => {
    setBannerVisible(true);
  }, []);

  const preferences = consent?.preferences ?? DEFAULT_PREFERENCES;

  return {
    bannerVisible,
    preferences,
    hasConsented: !!consent,
    acceptAll,
    rejectNonEssential,
    saveConsent,
    openBanner,
  };
}
