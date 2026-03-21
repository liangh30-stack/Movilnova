import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import app from './firebase';
import { db } from './firebase';

let messaging: Messaging | null = null;

async function initMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;
  const supported = await isSupported();
  if (!supported) return null;
  messaging = getMessaging(app);
  return messaging;
}

/**
 * Requests push notification permission, obtains the FCM token,
 * and saves it to the customer's Firestore document.
 */
export async function requestPushPermission(uid: string): Promise<boolean> {
  const m = await initMessaging();
  if (!m) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    if (import.meta.env.DEV) console.warn('VITE_FIREBASE_VAPID_KEY not set — push notifications disabled');
    return false;
  }

  try {
    const token = await getToken(m, { vapidKey });
    if (token) {
      await updateDoc(doc(db, 'customers', uid), { fcmToken: token });
      return true;
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Failed to get FCM token:', err);
  }
  return false;
}

/**
 * Removes the FCM token from the customer's Firestore document.
 */
export async function disablePush(uid: string): Promise<void> {
  await updateDoc(doc(db, 'customers', uid), { fcmToken: deleteField() });
}

/**
 * Listens for foreground push messages and invokes the callback.
 */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string }) => void
): Promise<(() => void) | null> {
  const m = await initMessaging();
  if (!m) return null;

  const unsubscribe = onMessage(m, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });

  return unsubscribe;
}
