import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryChange } from '../types';

const INVENTORY_CHANGES_COLLECTION = 'inventoryChanges';

export interface FirestoreInventoryChange {
  productId: string | number;
  productName: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: 'manual' | 'sale' | 'restock' | 'adjustment';
  userId?: string;
  userEmail?: string;
  timestamp: Timestamp;
}

const docToInventoryChange = (id: string, data: FirestoreInventoryChange): InventoryChange => ({
  id,
  productId: data.productId,
  productName: data.productName,
  previousStock: data.previousStock,
  newStock: data.newStock,
  change: data.change,
  reason: data.reason,
  userId: data.userId,
  userEmail: data.userEmail,
  timestamp: data.timestamp.toDate().toISOString(),
});

// Log a stock change
export const logInventoryChange = async (
  productId: string | number,
  productName: string,
  previousStock: number,
  newStock: number,
  reason: 'manual' | 'sale' | 'restock' | 'adjustment',
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const change = newStock - previousStock;

  const changeDoc: FirestoreInventoryChange = {
    productId,
    productName,
    previousStock,
    newStock,
    change,
    reason,
    timestamp: Timestamp.now(),
  };

  if (userId) changeDoc.userId = userId;
  if (userEmail) changeDoc.userEmail = userEmail;

  await addDoc(collection(db, INVENTORY_CHANGES_COLLECTION), changeDoc);
};

// Get inventory history for a specific product
export const getProductInventoryHistory = async (
  productId: string | number,
  maxResults: number = 50
): Promise<InventoryChange[]> => {
  const q = query(
    collection(db, INVENTORY_CHANGES_COLLECTION),
    where('productId', '==', productId),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => docToInventoryChange(doc.id, doc.data() as FirestoreInventoryChange));
};

// Get all recent inventory changes (for admin dashboard)
export const getRecentInventoryChanges = async (maxResults: number = 100): Promise<InventoryChange[]> => {
  const q = query(
    collection(db, INVENTORY_CHANGES_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => docToInventoryChange(doc.id, doc.data() as FirestoreInventoryChange));
};

// Get low stock products (stock < threshold)
export const getLowStockAlerts = (
  products: Array<{ id: string | number; name: string; stock?: number }>,
  threshold: number = 10
): Array<{ id: string | number; name: string; stock: number }> => {
  return products
    .filter(p => p.stock != null && p.stock > 0 && p.stock < threshold)
    .map(p => ({ id: p.id, name: p.name, stock: p.stock! }))
    .sort((a, b) => a.stock - b.stock);
};

/**
 * Decrement stock for a product when sold
 * Call this function after an order is completed/paid
 *
 * @example
 * // In your order completion handler:
 * import { decrementProductStock } from './services/inventoryService';
 *
 * const handleOrderComplete = async (order) => {
 *   for (const item of order.items) {
 *     await decrementProductStock(item.id, item.quantity, `Order #${order.id}`);
 *   }
 * };
 */
/**
 * Increment stock for a product when an order is cancelled
 */
export const incrementProductStock = async (
  productId: string | number,
  quantity: number,
  orderId?: string
): Promise<boolean> => {
  try {
    const { doc, runTransaction, Timestamp } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    const docRef = doc(db, 'products', productId.toString());

    const result = await runTransaction(db, async (tx) => {
      const docSnap = await tx.get(docRef);
      if (!docSnap.exists()) {
        return { success: false, productName: '', previousStock: 0, newStock: 0 };
      }
      const productData = docSnap.data();
      const currentStock = productData.stock ?? 0;
      const newStock = currentStock + quantity;
      tx.update(docRef, { stock: newStock, updatedAt: Timestamp.now() });
      return { success: true, productName: productData.name, previousStock: currentStock, newStock };
    });

    if (!result.success) {
      if (import.meta.env.DEV) console.error(`Product ${productId} not found`);
      return false;
    }

    await logInventoryChange(
      productId,
      result.productName,
      result.previousStock,
      result.newStock,
      'adjustment',
      undefined,
      orderId ? `Cancelled order: ${orderId}` : undefined
    );

    return true;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error incrementing stock:', error);
    return false;
  }
};

export const decrementProductStock = async (
  productId: string | number,
  quantity: number,
  orderId?: string
): Promise<boolean> => {
  try {
    const { doc, runTransaction, Timestamp } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    const docRef = doc(db, 'products', productId.toString());

    const result = await runTransaction(db, async (tx) => {
      const docSnap = await tx.get(docRef);
      if (!docSnap.exists()) {
        return { success: false, productName: '', previousStock: 0, newStock: 0 };
      }
      const productData = docSnap.data();
      const currentStock = productData.stock ?? 0;
      const newStock = Math.max(0, currentStock - quantity);
      tx.update(docRef, { stock: newStock, updatedAt: Timestamp.now() });
      return { success: true, productName: productData.name, previousStock: currentStock, newStock };
    });

    if (!result.success) {
      if (import.meta.env.DEV) console.error(`Product ${productId} not found`);
      return false;
    }

    await logInventoryChange(
      productId,
      result.productName,
      result.previousStock,
      result.newStock,
      'sale',
      undefined,
      orderId ? `Order: ${orderId}` : undefined
    );

    return true;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error decrementing stock:', error);
    return false;
  }
};
