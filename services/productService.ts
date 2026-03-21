import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';
import { logInventoryChange } from './inventoryService';
import { logAuditEvent } from './auditService';

const PRODUCTS_COLLECTION = 'products';

// Map old English category keys → Spanish
const CATEGORY_MIGRATION: Record<string, string> = {
  'Case': 'Carcasa',
  'Screen Protector': 'Protector de pantalla',
  'Charger': 'Cargador',
  'Strap': 'Colgante',
};

const normalizeCategory = (cat: string): string => CATEGORY_MIGRATION[cat] ?? cat;

export interface FirestoreProduct {
  name: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  category: string;
  brands?: string[];
  brand?: string; // legacy single-brand field (backward compat)
  compatibleModels?: string[];
  image: string;
  images?: string[];
  description: string;
  stock?: number;
  isBundle?: boolean;
  colors?: string[];
  colorImages?: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Convert Firestore document to Product type
const docToProduct = (id: string, data: FirestoreProduct): Product => ({
  id,
  name: data.name,
  price: data.price,
  originalPrice: data.originalPrice,
  costPrice: data.costPrice,
  category: normalizeCategory(data.category),
  brands: data.brands ?? (data.brand ? [data.brand] : undefined),
  compatibleModels: data.compatibleModels,
  image: data.image,
  images: data.images?.length ? data.images : [data.image],
  description: data.description,
  stock: data.stock,
  isBundle: data.isBundle,
  colors: data.colors,
  colorImages: data.colorImages,
});

// Get all products (one-time fetch)
export const getProducts = async (maxResults: number = 200): Promise<Product[]> => {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => docToProduct(doc.id, doc.data() as FirestoreProduct));
};

// Subscribe to real-time product updates
export const subscribeToProducts = (
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(d => docToProduct(d.id, d.data() as FirestoreProduct));
    onUpdate(products);
  }, (err) => {
    onError?.(err);
  });
};

// Get a single product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docToProduct(docSnap.id, docSnap.data() as FirestoreProduct);
};

// Create a new product
export const createProduct = async (
  product: Omit<Product, 'id'>,
  userId?: string,
  userEmail?: string,
): Promise<Product> => {
  const now = Timestamp.now();
  const firestoreProduct: FirestoreProduct = {
    name: product.name,
    price: product.price,
    category: product.category,
    image: product.image,
    description: product.description,
    createdAt: now,
    updatedAt: now,
  };

  if (product.originalPrice != null) firestoreProduct.originalPrice = product.originalPrice;
  if (product.brands != null && product.brands.length > 0) firestoreProduct.brands = product.brands;
  if (product.compatibleModels != null) firestoreProduct.compatibleModels = product.compatibleModels;
  if (product.isBundle != null) firestoreProduct.isBundle = product.isBundle;
  if (product.images != null && product.images.length > 0) firestoreProduct.images = product.images;
  if (product.stock != null) firestoreProduct.stock = product.stock;
  if (product.colors != null && product.colors.length > 0) firestoreProduct.colors = product.colors;
  if (product.colorImages != null && Object.keys(product.colorImages).length > 0) firestoreProduct.colorImages = product.colorImages;

  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), firestoreProduct);
  if (userId && userEmail) {
    logAuditEvent('product.create', userId, userEmail, docRef.id, product.name);
  }
  return docToProduct(docRef.id, firestoreProduct);
};

// Update an existing product (filtra undefined para Firestore)
export const updateProduct = async (
  id: string,
  data: Partial<Omit<Product, 'id'>>,
  userEmail?: string,
  userId?: string,
): Promise<void> => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const clean: Record<string, unknown> = { updatedAt: Timestamp.now() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      clean[k] = v;
    } else {
      // Remove the field from Firestore when explicitly set to undefined
      clean[k] = deleteField();
    }
  }

  // Log stock change if stock is being updated
  if (data.stock !== undefined && data.name) {
    try {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as FirestoreProduct;
        const previousStock = currentData.stock ?? 0;
        if (previousStock !== data.stock) {
          await logInventoryChange(
            id,
            data.name,
            previousStock,
            data.stock,
            'manual',
            undefined,
            userEmail
          );
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error logging inventory change:', err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(docRef, clean as any);

  if (userId && userEmail) {
    logAuditEvent('product.update', userId, userEmail, id, data.name as string | undefined);
  }
};

// Delete a product
export const deleteProduct = async (
  id: string,
  userId?: string,
  userEmail?: string,
  productName?: string,
): Promise<void> => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
  if (userId && userEmail) {
    logAuditEvent('product.delete', userId, userEmail, id, productName);
  }
};

// Convierte imagen local a base64 comprimida (sin Firebase Storage, sin límite de tamaño)
export const uploadProductImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No se pudo crear contexto canvas')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

// Import mock products to Firestore (migration helper)
export const importMockProducts = async (
  products: Omit<Product, 'id'>[],
  userId?: string,
  userEmail?: string,
): Promise<void> => {
  const batch = products.map(product => createProduct(product));
  await Promise.all(batch);
  if (userId && userEmail) {
    logAuditEvent('product.import', userId, userEmail, undefined, undefined, { count: products.length });
  }
};
