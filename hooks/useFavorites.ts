import { useState, useEffect, useCallback } from 'react';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../services/customerService';

export const useFavorites = (customerUid: string | null) => {
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load favorites from localStorage (anonymous) or Firestore (logged in)
  useEffect(() => {
    if (customerUid) {
      setIsLoading(true);
      getFavorites(customerUid)
        .then((ids) => {
          // Merge localStorage favorites into Firestore on login
          const localFavs = getLocalFavorites();
          const merged = new Set<string | number>([...ids, ...localFavs]);
          setFavorites(merged);
          // Save merged favorites to Firestore
          localFavs.forEach((id) => {
            if (!ids.includes(id)) {
              addFavorite(customerUid, id).catch(() => {});
            }
          });
          // Clear localStorage favorites after merge
          localStorage.removeItem('movilnova_favorites');
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // Load from localStorage
      setFavorites(new Set(getLocalFavorites()));
    }
  }, [customerUid]);

  const getLocalFavorites = (): (string | number)[] => {
    try {
      const stored = localStorage.getItem('movilnova_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalFavorites = (favs: Set<string | number>) => {
    localStorage.setItem('movilnova_favorites', JSON.stringify([...favs]));
  };

  const toggleFavorite = useCallback(
    (productId: string | number) => {
      setFavorites((prev) => {
        const next = new Set<string | number>(prev);
        if (next.has(productId)) {
          next.delete(productId);
          if (customerUid) {
            removeFavorite(customerUid, productId).catch(() => {});
          }
        } else {
          next.add(productId);
          if (customerUid) {
            addFavorite(customerUid, productId).catch(() => {});
          }
        }
        if (!customerUid) {
          saveLocalFavorites(next);
        }
        return next;
      });
    },
    [customerUid]
  );

  const isFavorite = useCallback(
    (productId: string | number) => favorites.has(productId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite, isLoading };
};
