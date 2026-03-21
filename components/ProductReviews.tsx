import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Send, Loader2, Trash2, User, Pencil, ShieldCheck, X } from 'lucide-react';
import { ProductReview } from '../types';
import {
  getProductReviews,
  addReview,
  deleteReview,
  updateReview,
  getAverageRating,
} from '../services/reviewService';
import { hasPurchasedProduct } from '../services/orderService';

interface ProductReviewsProps {
  productId: string | number;
  customerUid?: string | null;
  customerName?: string | null;
  isAdmin?: boolean;
}

const StarRating: React.FC<{
  rating: number;
  onRate?: (r: number) => void;
  size?: number;
}> = ({ rating, onRate, size = 18 }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={onRate ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={
              star <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-brand-border'
            }
          />
        </button>
      ))}
    </div>
  );
};

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  customerUid,
  customerName,
  isAdmin,
}) => {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (!customerUid) {
      setHasPurchased(false);
      return;
    }
    setCheckingPurchase(true);
    hasPurchasedProduct(customerUid, productId)
      .then(setHasPurchased)
      .catch(() => setHasPurchased(false))
      .finally(() => setCheckingPurchase(false));
  }, [customerUid, productId]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getProductReviews(String(productId));
      setReviews(data);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error cargando reseñas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const existingReview = reviews.find(r => r.customerUid === customerUid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUid || !customerName) return;
    if (newRating === 0) {
      setError(t('reviewSelectRating') || 'Selecciona una valoración');
      return;
    }
    if (!newComment.trim()) {
      setError(t('reviewWriteComment') || 'Escribe un comentario');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const review = await addReview({
        productId: String(productId),
        customerUid,
        customerName,
        rating: newRating,
        comment: newComment.trim(),
      });
      setReviews((prev) => [review, ...prev]);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
      setError(t('reviewErrorSubmit') || 'Error al enviar la reseña');
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (newRating === 0) {
      setError(t('reviewSelectRating') || 'Selecciona una valoración');
      return;
    }
    if (!newComment.trim()) {
      setError(t('reviewWriteComment') || 'Escribe un comentario');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await updateReview(editingReview.id, { rating: newRating, comment: newComment.trim() });
      setReviews(prev => prev.map(r =>
        r.id === editingReview.id
          ? { ...r, rating: newRating, comment: newComment.trim(), editCount: (r.editCount ?? 0) + 1, updatedAt: new Date().toISOString() }
          : r
      ));
      setEditingReview(null);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
      setError(t('reviewEditError') || 'Error al actualizar la reseña');
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (isAdmin && review && review.customerUid !== customerUid) {
      if (!window.confirm(t('reviewAdminDeleteConfirm'))) return;
    }
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error eliminando reseña:', err);
    }
  };

  const average = getAverageRating(reviews);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="mt-6">
      {/* Resumen */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-brand-dark">
          {t('reviewsTitle')}
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(average)} size={16} />
            <span className="text-sm font-semibold text-brand-dark">{average}</span>
            <span className="text-sm text-brand-muted">
              ({reviews.length} {reviews.length === 1
                ? (t('reviewSingular') || 'reseña')
                : (t('reviewPlural') || 'reseñas')})
            </span>
          </div>
        )}
      </div>

      {/* Formulario de edición */}
      {editingReview && (
        <form onSubmit={handleEditSubmit} className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-5 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-brand-dark">
              {t('reviewEditing')} ({t('reviewEditsRemaining', { count: 2 - (editingReview.editCount ?? 0) })})
            </p>
            <button type="button" onClick={() => { setEditingReview(null); setNewRating(0); setNewComment(''); setError(null); }} className="text-brand-text-tertiary hover:text-brand-muted">
              <X size={16} />
            </button>
          </div>
          <div className="mb-3">
            <StarRating rating={newRating} onRate={setNewRating} size={24} />
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('reviewPlaceholder') || 'Escribe tu comentario...'}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none mb-2"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
            <span>{t('reviewSaveEdit')}</span>
          </button>
        </form>
      )}

      {/* Formulario para nueva reseña (solo compradores) */}
      {!editingReview && customerUid && hasPurchased && !existingReview ? (
        <form onSubmit={handleSubmit} className="bg-brand-light rounded-xl p-4 mb-5 border">
          <p className="text-sm font-medium text-brand-dark mb-2">
            {t('reviewLeave') || 'Deja tu valoración'}
          </p>
          <div className="mb-3">
            <StarRating rating={newRating} onRate={setNewRating} size={24} />
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('reviewPlaceholder') || 'Escribe tu comentario sobre este producto...'}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none resize-none mb-2"
          />
          {error && (
            <p className="text-red-500 text-xs mb-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>{t('reviewSubmit') || 'Enviar reseña'}</span>
          </button>
        </form>
      ) : !editingReview && customerUid && !hasPurchased && !checkingPurchase ? (
        <p className="text-sm text-brand-muted bg-brand-light rounded-lg p-3 mb-4 border flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-text-tertiary flex-shrink-0" />
          {t('reviewPurchaseRequired')}
        </p>
      ) : !editingReview && !customerUid ? (
        <p className="text-sm text-brand-muted bg-brand-light rounded-lg p-3 mb-4 border">
          {t('reviewLoginRequired') || 'Inicia sesión para dejar una valoración'}
        </p>
      ) : null}

      {/* Lista de reseñas */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={24} className="animate-spin text-brand-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-brand-text-tertiary text-center py-4">
          {t('reviewEmpty') || 'Aún no hay valoraciones. ¡Sé el primero!'}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-brand-surface border rounded-xl p-4 flex gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-dark">
                      {review.customerName}
                    </span>
                    <StarRating rating={review.rating} size={14} />
                    {(review.editCount ?? 0) > 0 && (
                      <span className="text-[10px] text-brand-text-tertiary italic">{t('reviewEdited')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-brand-text-tertiary">
                      {formatDate(review.updatedAt || review.createdAt)}
                    </span>
                    {customerUid === review.customerUid && (review.editCount ?? 0) < 2 && !editingReview && (
                      <button
                        onClick={() => {
                          setEditingReview(review);
                          setNewRating(review.rating);
                          setNewComment(review.comment);
                          setError(null);
                        }}
                        className="p-1 text-brand-text-tertiary hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        title={t('reviewEditTitle')}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {(customerUid === review.customerUid || isAdmin) && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-1 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={t('reviewDeleteTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-brand-muted mt-1">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
