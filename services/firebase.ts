import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// Firebase App Check — protects Firestore and Cloud Functions from unauthorized access.
// In development, use the debug token (set VITE_FIREBASE_APPCHECK_DEBUG_TOKEN in .env.local).
// In production, reCAPTCHA v3 runs silently in the background with no user interaction.
// Prerequisites:
//   1. Enable App Check in Firebase Console → App Check → Register app with reCAPTCHA v3
//   2. Add VITE_RECAPTCHA_SITE_KEY to .env.local with your reCAPTCHA v3 site key
//   3. Enable enforcement in Firebase Console for Firestore and Cloud Functions
export let appCheck: AppCheck | null = null;
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  // Allow debug token in non-production environments
  if (import.meta.env.DEV) {
    // @ts-expect-error — self is available in browser context
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
  }
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (import.meta.env.PROD) {
  // Loud warning in production — without App Check, Firebase config is publicly
  // readable from the JS bundle and anyone can hit Firestore/Functions directly.
  // Once VITE_RECAPTCHA_SITE_KEY is set AND enforcement is enabled in the Firebase
  // Console, unauthorized requests will start being rejected.
  console.warn(
    '[firebase] App Check is NOT initialized in production. Set VITE_RECAPTCHA_SITE_KEY ' +
    'and enable App Check enforcement in Firebase Console (Firestore, Functions, Storage).',
  );
}

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const auth: Auth = getAuth(app);

export default app;
