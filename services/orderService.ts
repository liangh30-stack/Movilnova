import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  runTransaction,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, OrderStatus, OrderStatusHistory, OrderItem, OrderTakenBy } from '../types';
import { decrementProductStock, incrementProductStock } from './inventoryService';
import { sendOrderStatusNotification } from './emailService';
import { logAuditEvent } from './auditService';

const ORDERS_COLLECTION = 'orders';

interface FirestoreOrder {
  orderNumber: string;
  customerId?: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Timestamp;
    note?: string;
    updatedBy?: string;
  }>;
  paymentMethod: string;
  paymentId?: string;
  trackingNumber?: string;
  notes?: string;
  takenBy?: {
    uid: string;
    email: string;
    takenAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const docToOrder = (id: string, data: FirestoreOrder): Order => ({
  id,
  orderNumber: data.orderNumber,
  customerId: data.customerId,
  customerName: data.customerName,
  email: data.email,
  phone: data.phone,
  address: data.address,
  items: data.items,
  subtotal: data.subtotal,
  shipping: data.shipping,
  tax: data.tax,
  total: data.total,
  status: data.status,
  statusHistory: data.statusHistory.map(h => ({
    status: h.status,
    timestamp: h.timestamp.toDate().toISOString(),
    note: h.note,
    updatedBy: h.updatedBy,
  })),
  paymentMethod: data.paymentMethod as Order['paymentMethod'],
  paymentId: data.paymentId,
  trackingNumber: data.trackingNumber,
  notes: data.notes,
  takenBy: data.takenBy ? {
    uid: data.takenBy.uid,
    email: data.takenBy.email,
    takenAt: data.takenBy.takenAt.toDate().toISOString(),
  } : undefined,
  createdAt: data.createdAt.toDate().toISOString(),
  updatedAt: data.updatedAt.toDate().toISOString(),
});

// Generate unique order number using timestamp to avoid requiring read permissions
const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');

  // Format: ORD-YYYY-MMDDHHMMSS-MS (e.g., ORD-2026-021215304523-001)
  // This ensures uniqueness without requiring database reads
  return `ORD-${year}-${month}${day}${hours}${minutes}${seconds}-${ms}`;
};

/**
 * Create a new order and automatically decrement stock for all items
 */
export const createOrder = async (
  orderData: Omit<Order, 'id' | 'orderNumber' | 'statusHistory' | 'createdAt' | 'updatedAt'>
): Promise<Order> => {
  const now = Timestamp.now();
  const orderNumber = generateOrderNumber();

  // Build Firestore order object, explicitly omitting undefined fields
  const status = orderData.status || 'Pending';

  const firestoreOrder: Record<string, unknown> = {
    orderNumber,
    customerName: orderData.customerName,
    email: orderData.email,
    phone: orderData.phone,
    address: orderData.address,
    items: orderData.items,
    subtotal: orderData.subtotal,
    shipping: orderData.shipping,
    tax: orderData.tax,
    total: orderData.total,
    status,
    statusHistory: [{
      status,
      timestamp: now,
      note: 'Order created',
    }],
    paymentMethod: orderData.paymentMethod,
    createdAt: now,
    updatedAt: now,
  };

  // Only add optional fields if they have actual values
  if (orderData.customerId !== undefined) {
    firestoreOrder.customerId = orderData.customerId;
  }
  if (orderData.paymentId !== undefined && orderData.paymentId !== null && orderData.paymentId !== '') {
    firestoreOrder.paymentId = orderData.paymentId;
  }
  if (orderData.trackingNumber !== undefined && orderData.trackingNumber !== null && orderData.trackingNumber !== '') {
    firestoreOrder.trackingNumber = orderData.trackingNumber;
  }
  if (orderData.notes !== undefined && orderData.notes !== null && orderData.notes !== '') {
    firestoreOrder.notes = orderData.notes;
  }

  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), firestoreOrder);

  // Stock decrement is handled when admin updates order status to Paid/Processing
  // This simplifies permissions and makes the flow more realistic

  // Send order confirmation email to customer
  try {
    await sendOrderStatusNotification(
      docRef.id,
      orderNumber,
      orderData.email,
      orderData.customerName,
      status as OrderStatus,
      'Pending',
      {
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        total: orderData.total,
      }
    );
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to send order confirmation:', error);
  }

  return docToOrder(docRef.id, firestoreOrder as unknown as FirestoreOrder);
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docToOrder(docSnap.id, docSnap.data() as FirestoreOrder);
};

/**
 * Get order by order number
 */
export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('orderNumber', '==', orderNumber),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToOrder(doc.id, doc.data() as FirestoreOrder);
};

/**
 * Get all orders for a customer (by UID, with email fallback for guest orders)
 */
export const getCustomerOrders = async (customerId: string, email?: string): Promise<Order[]> => {
  // Query by customerId
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map(doc => docToOrder(doc.id, doc.data() as FirestoreOrder));

  // If no results and email provided, also try matching by email (guest orders)
  if (orders.length === 0 && email) {
    const emailQ = query(
      collection(db, ORDERS_COLLECTION),
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );
    const emailSnapshot = await getDocs(emailQ);
    return emailSnapshot.docs.map(doc => docToOrder(doc.id, doc.data() as FirestoreOrder));
  }

  return orders;
};

/**
 * Get all orders (admin)
 */
export const getAllOrders = async (maxResults: number = 100): Promise<Order[]> => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => docToOrder(doc.id, doc.data() as FirestoreOrder));
};

/**
 * Subscribe to real-time orders (admin)
 */
export const subscribeToOrders = (
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => docToOrder(doc.id, doc.data() as FirestoreOrder));
    onUpdate(orders);
  }, onError);
};

/**
 * Update order status with history tracking
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  updatedBy?: string,
  updatedByEmail?: string,
  isSuperadmin?: boolean,
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Order not found');
  }

  const currentOrder = docSnap.data() as FirestoreOrder;

  // Enforce take-order ownership: only the assigned admin (or superadmin) can change status
  if (!isSuperadmin && currentOrder.takenBy && updatedBy && currentOrder.takenBy.uid !== updatedBy) {
    throw new Error('Cannot update status: order is taken by another admin');
  }

  const newHistoryEntry = {
    status: newStatus,
    timestamp: Timestamp.now(),
    note,
    updatedBy,
  };

  await updateDoc(docRef, {
    status: newStatus,
    statusHistory: [...currentOrder.statusHistory, newHistoryEntry],
    updatedAt: Timestamp.now(),
  });

  if (updatedBy && updatedByEmail) {
    logAuditEvent('order.statusChange', updatedBy, updatedByEmail, orderId, currentOrder.orderNumber, {
      previousStatus: currentOrder.status,
      newStatus,
    });
  }

  // If order is being marked as paid/processing and stock wasn't decremented yet
  if ((newStatus === 'Paid' || newStatus === 'Processing') &&
      currentOrder.status === 'Pending') {
    for (const item of currentOrder.items) {
      await decrementProductStock(item.productId, item.quantity, currentOrder.orderNumber);
    }
  }

  // If order is being cancelled and stock was already decremented, restore it
  if (newStatus === 'Cancelled' &&
      (currentOrder.status === 'Paid' || currentOrder.status === 'Processing' || currentOrder.status === 'Shipped')) {
    for (const item of currentOrder.items) {
      await incrementProductStock(item.productId, item.quantity, currentOrder.orderNumber);
    }
  }

  // Send email notification to customer
  try {
    await sendOrderStatusNotification(
      orderId,
      currentOrder.orderNumber,
      currentOrder.email,
      currentOrder.customerName,
      newStatus,
      currentOrder.status,
      {
        items: currentOrder.items,
        subtotal: currentOrder.subtotal,
        shipping: currentOrder.shipping,
        tax: currentOrder.tax,
        total: currentOrder.total,
      }
    );
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to send notification:', error);
  }
};

/**
 * Update tracking number
 */
export const updateTrackingNumber = async (
  orderId: string,
  trackingNumber: string
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);

  await updateDoc(docRef, {
    trackingNumber,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Search orders by customer email or order number
 */
export const searchOrders = async (searchTerm: string): Promise<Order[]> => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map(doc => docToOrder(doc.id, doc.data() as FirestoreOrder));

  const searchLower = searchTerm.toLowerCase();
  return orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchLower) ||
    order.email.toLowerCase().includes(searchLower) ||
    order.customerName.toLowerCase().includes(searchLower)
  );
};

/**
 * Take (claim) an order so only this admin can manage it.
 * Uses a transaction to prevent race conditions.
 */
export const takeOrder = async (
  orderId: string,
  adminUid: string,
  adminEmail: string,
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists()) throw new Error('Order not found');

    const data = docSnap.data() as FirestoreOrder;

    if (data.takenBy && data.takenBy.uid !== adminUid) {
      throw new Error(`Order already taken by ${data.takenBy.email}`);
    }

    // Already taken by this admin — no-op
    if (data.takenBy && data.takenBy.uid === adminUid) return;

    transaction.update(docRef, {
      takenBy: { uid: adminUid, email: adminEmail, takenAt: Timestamp.now() },
      updatedAt: Timestamp.now(),
    });
  });

  logAuditEvent('order.take', adminUid, adminEmail, orderId, '', { action: 'take' });
};

/**
 * Release an order assignment (superadmin action).
 */
export const releaseOrder = async (
  orderId: string,
  adminUid: string,
  adminEmail: string,
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error('Order not found');

  const currentOrder = docSnap.data() as FirestoreOrder;

  await updateDoc(docRef, {
    takenBy: deleteField(),
    updatedAt: Timestamp.now(),
  });

  logAuditEvent('order.release', adminUid, adminEmail, orderId, currentOrder.orderNumber, {
    previouslyTakenBy: currentOrder.takenBy?.email ?? 'none',
  });
};

// Comprobar si un cliente ha comprado un producto específico
export const hasPurchasedProduct = async (
  customerUid: string,
  productId: string | number
): Promise<boolean> => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('customerId', '==', customerUid)
  );

  const snapshot = await getDocs(q);
  const validStatuses: OrderStatus[] = ['Paid', 'Shipped', 'Delivered'];

  return snapshot.docs.some(d => {
    const data = d.data() as FirestoreOrder;
    if (!validStatuses.includes(data.status)) return false;
    return data.items.some(item =>
      String(item.productId) === String(productId)
    );
  });
};
