export type Language = 'EN' | 'CN' | 'ES' | 'FR' | 'DE';

export interface Product {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  category: string;
  image: string;
  images?: string[];
  description: string;
  stock?: number;
  isBundle?: boolean;
  compatibleModels?: string[];
  brands?: string[];
  isCustom?: boolean;
  customImage?: string;
  selectedModel?: string;
  colors?: string[];
  colorImages?: Record<string, number>;
  selectedColor?: string;
  // Aggregate review fields — maintained by reviewService write paths so the
  // Storefront / Hero3D / product card can show stars without N+1 lookups.
  ratingAvg?: number;
  ratingCount?: number;
  ratingSum?: number; // internal — used for incremental updates
}

export interface ProductReview {
  id: string;
  productId: string;
  customerUid: string;
  customerName: string;
  rating: number;        // 1-5 estrellas
  comment: string;
  createdAt: string;     // ISO timestamp
  editCount?: number;    // default 0, max 2
  updatedAt?: string;    // ISO timestamp última edición
}

export type OrderStatus = 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface OrderTakenBy {
  uid: string;
  email: string;
  takenAt: string;
}

export interface OrderItem {
  productId: string | number;
  productName: string;
  name?: string;
  productImage: string;
  image?: string;
  price: number;
  quantity: number;
  selectedModel?: string;
  selectedColor?: string;
  isCustom?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable order number (e.g., "ORD-2024-001")
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
  statusHistory: OrderStatusHistory[];
  paymentMethod: 'Stripe' | 'Card' | 'Cash';
  paymentId?: string;
  trackingNumber?: string;
  notes?: string;
  takenBy?: OrderTakenBy;
  createdAt: string;
  updatedAt: string;
}

export type PartType = 'original' | 'compatible';

export interface RepairPart {
  name: string;
  type: PartType;
}

export interface RepairJob {
  id: string;
  customerName: string;
  device: string;
  issue: string;
  status: 'Received' | 'Diagnosing' | 'Waiting for Parts' | 'Repaired' | 'Ready for Pickup' | 'Picked Up' | 'Finished';
  progress: number;
  estimatedCompletion: string;
  price?: number;
  technician?: string;
  tiendaId?: string;
  publico?: boolean;
  telefono?: string;
  fechaEntrada?: string;
  brand?: string;
  model?: string;
  parts?: RepairPart[];
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stores: {
    [key: string]: number;
  };
}

// Customer profile stored in Firestore customers/{uid}
export interface Customer {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  deletionRequestedAt?: string; // ISO timestamp — account scheduled for deletion 30 days after this date
  fcmToken?: string; // FCM push notification token
}

// Stored in Firestore customers/{uid}/addresses/{addressId}
export interface CustomerAddress {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

// Extends Order with customer linkage
export interface CustomerOrder extends Order {
  customerId: string;
  shippingAddressId?: string;
}

// Cart item for Firestore persistence
export interface FirestoreCartItem {
  productId: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedModel?: string;
  selectedColor?: string;
  isCustom?: boolean;
  addedAt: string;
}

// Favorites
export interface CustomerFavorite {
  productId: string | number;
  addedAt: string;
}

// Inventory change tracking
export interface InventoryChange {
  id: string;
  productId: string | number;
  productName: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: 'manual' | 'sale' | 'restock' | 'adjustment';
  userId?: string;
  userEmail?: string;
  timestamp: string;
}

// Audit log
export type AuditAction =
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.import'
  | 'order.statusChange'
  | 'order.take'
  | 'order.release'
  | 'promo.create'
  | 'promo.update'
  | 'promo.delete'
  | 'offer.create'
  | 'offer.update'
  | 'offer.delete'
  | 'settings.update'
  | 'user.roleChange';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}