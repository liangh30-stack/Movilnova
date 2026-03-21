/**
 * Email Notification Service
 *
 * Delegates email sending to the `sendOrderNotification` Cloud Function,
 * which uses Resend server-side. The Resend API key never leaves the server.
 *
 * getCustomerNotifications reads directly from Firestore (no function call needed).
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from './firebase';
import app from './firebase';
import { OrderStatus } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  newStatus: OrderStatus;
  previousStatus: OrderStatus;
  message: string;
  sentAt: Timestamp;
  emailSent: boolean;
}

interface EmailOrderData {
  items: Array<{
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface SendNotificationPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  newStatus: string;
  previousStatus: string;
  orderData?: EmailOrderData;
}

interface SendNotificationResult {
  success: boolean;
  emailSent: boolean;
}

const functions = getFunctions(app);
const sendOrderNotificationFn = httpsCallable<
  SendNotificationPayload,
  SendNotificationResult
>(functions, 'sendOrderNotification');

/**
 * Send email notification when order status changes.
 * Delegates to the sendOrderNotification Cloud Function.
 */
export const sendOrderStatusNotification = async (
  orderId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  newStatus: OrderStatus,
  previousStatus: OrderStatus,
  orderData?: EmailOrderData,
): Promise<void> => {
  try {
    await sendOrderNotificationFn({
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      newStatus,
      previousStatus,
      orderData,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Notification] Cloud Function call failed:', error);
    }
  }
};

/**
 * Get notifications for a customer's email
 */
export const getCustomerNotifications = async (
  customerEmail: string,
  maxResults: number = 20,
): Promise<Array<OrderNotification & { id: string }>> => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('customerEmail', '==', customerEmail),
    orderBy('sentAt', 'desc'),
    limit(maxResults),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as OrderNotification),
  }));
};
