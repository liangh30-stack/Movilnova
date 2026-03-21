import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProductReview } from '../types';

const REVIEWS_COLLECTION = 'productReviews';

// Obtener todas las reseñas de un producto (ordenadas por fecha desc en cliente)
export const getProductReviews = async (productId: string): Promise<ProductReview[]> => {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('productId', '==', productId)
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as ProductReview[];
  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// Crear una nueva reseña
export const addReview = async (
  review: Omit<ProductReview, 'id' | 'createdAt' | 'editCount' | 'updatedAt'>
): Promise<ProductReview> => {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
    ...review,
    editCount: 0,
    createdAt: now,
  });
  return {
    id: docRef.id,
    ...review,
    editCount: 0,
    createdAt: now,
  };
};

// Actualizar una reseña existente (máximo 2 ediciones)
export const updateReview = async (
  reviewId: string,
  data: { rating: number; comment: string }
): Promise<void> => {
  const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) throw new Error('Review not found');

  const current = snap.data();
  const currentEditCount = current.editCount ?? 0;

  if (currentEditCount >= 2) {
    throw new Error('Maximum edit limit reached');
  }

  await updateDoc(docRef, {
    rating: data.rating,
    comment: data.comment,
    editCount: currentEditCount + 1,
    updatedAt: new Date().toISOString(),
  });
};

// Eliminar una reseña (admin o propio usuario)
export const deleteReview = async (reviewId: string): Promise<void> => {
  await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
};

// Calcular media de valoraciones
export const getAverageRating = (reviews: ProductReview[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};
