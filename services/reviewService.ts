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
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProductReview } from '../types';

const REVIEWS_COLLECTION = 'productReviews';
const PRODUCTS_COLLECTION = 'products';

/**
 * Recompute and write the aggregate rating fields on the product document.
 * Uses a transaction so concurrent review writes can't corrupt the average.
 *
 * Caller passes the delta (in stars added / removed) and count delta (+1/-1/0).
 */
async function updateProductRatingAggregate(
  productId: string,
  starsDelta: number,
  countDelta: number
): Promise<void> {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) {
      // Some reviews reference legacy / mock products that aren't in
      // Firestore — skip silently instead of failing the user's write.
      return;
    }
    const data = snap.data();
    const newSum = (data.ratingSum ?? 0) + starsDelta;
    const newCount = (data.ratingCount ?? 0) + countDelta;
    const newAvg = newCount > 0 ? Math.round((newSum / newCount) * 10) / 10 : 0;
    tx.update(productRef, {
      ratingSum: newSum,
      ratingCount: newCount,
      ratingAvg: newAvg,
    });
  });
}

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
  // Keep product aggregate in sync (best-effort — log on failure but don't
  // surface, since the review itself was written successfully).
  try {
    await updateProductRatingAggregate(review.productId, review.rating, 1);
  } catch (err) {
    console.warn('Could not update product rating aggregate', err);
  }
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
  const previousRating = current.rating ?? 0;
  const productId = current.productId as string | undefined;

  if (currentEditCount >= 2) {
    throw new Error('Maximum edit limit reached');
  }

  await updateDoc(docRef, {
    rating: data.rating,
    comment: data.comment,
    editCount: currentEditCount + 1,
    updatedAt: new Date().toISOString(),
  });

  // Sync aggregate: count unchanged, sum shifts by the rating delta.
  if (productId && data.rating !== previousRating) {
    try {
      await updateProductRatingAggregate(productId, data.rating - previousRating, 0);
    } catch (err) {
      console.warn('Could not update product rating aggregate', err);
    }
  }
};

// Eliminar una reseña (admin o propio usuario)
export const deleteReview = async (reviewId: string): Promise<void> => {
  // Read the review first to know which product / rating to subtract
  const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
  const snap = await getDoc(docRef);
  const productId = snap.exists() ? (snap.data().productId as string | undefined) : undefined;
  const rating = snap.exists() ? (snap.data().rating as number | undefined) ?? 0 : 0;

  await deleteDoc(docRef);

  if (productId) {
    try {
      await updateProductRatingAggregate(productId, -rating, -1);
    } catch (err) {
      console.warn('Could not update product rating aggregate', err);
    }
  }

  // Silence unused-import lint if increment becomes unused after a refactor
  void increment;
};

// Calcular media de valoraciones
export const getAverageRating = (reviews: ProductReview[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};
