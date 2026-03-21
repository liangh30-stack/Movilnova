import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock customerService
vi.mock('@/services/customerService', () => ({
  getFavorites: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn().mockResolvedValue(undefined),
  removeFavorite: vi.fn().mockResolvedValue(undefined),
}));

import { getFavorites, addFavorite, removeFavorite } from '@/services/customerService';
import { useFavorites } from '@/hooks/useFavorites';

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('anonymous user (no customerUid)', () => {
    it('initializes with empty favorites', () => {
      const { result } = renderHook(() => useFavorites(null));

      expect(result.current.favorites.size).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('adds a product to favorites via toggle', () => {
      const { result } = renderHook(() => useFavorites(null));

      act(() => {
        result.current.toggleFavorite('prod-1');
      });

      expect(result.current.favorites.has('prod-1')).toBe(true);
      expect(result.current.isFavorite('prod-1')).toBe(true);
    });

    it('removes a product from favorites via toggle', () => {
      const { result } = renderHook(() => useFavorites(null));

      act(() => {
        result.current.toggleFavorite('prod-1');
      });
      expect(result.current.isFavorite('prod-1')).toBe(true);

      act(() => {
        result.current.toggleFavorite('prod-1');
      });
      expect(result.current.isFavorite('prod-1')).toBe(false);
      expect(result.current.favorites.size).toBe(0);
    });

    it('saves favorites to localStorage when anonymous', () => {
      const { result } = renderHook(() => useFavorites(null));

      act(() => {
        result.current.toggleFavorite('prod-1');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'movilnova_favorites',
        expect.any(String)
      );

      const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(stored).toContain('prod-1');
    });

    it('loads favorites from localStorage on mount', () => {
      localStorageMock.setItem('movilnova_favorites', JSON.stringify(['prod-5', 'prod-9']));

      const { result } = renderHook(() => useFavorites(null));

      expect(result.current.favorites.size).toBe(2);
      expect(result.current.isFavorite('prod-5')).toBe(true);
      expect(result.current.isFavorite('prod-9')).toBe(true);
    });

    it('does not call customerService when anonymous', () => {
      const { result } = renderHook(() => useFavorites(null));

      act(() => {
        result.current.toggleFavorite('prod-1');
      });

      expect(getFavorites).not.toHaveBeenCalled();
      expect(addFavorite).not.toHaveBeenCalled();
      expect(removeFavorite).not.toHaveBeenCalled();
    });
  });

  describe('logged-in user (with customerUid)', () => {
    it('loads favorites from Firestore on mount', async () => {
      vi.mocked(getFavorites).mockResolvedValue(['prod-10', 'prod-20']);

      const { result } = renderHook(() => useFavorites('user-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getFavorites).toHaveBeenCalledWith('user-123');
      expect(result.current.favorites.size).toBe(2);
      expect(result.current.isFavorite('prod-10')).toBe(true);
      expect(result.current.isFavorite('prod-20')).toBe(true);
    });

    it('calls addFavorite on Firestore when toggling on', async () => {
      vi.mocked(getFavorites).mockResolvedValue([]);

      const { result } = renderHook(() => useFavorites('user-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('prod-99');
      });

      expect(addFavorite).toHaveBeenCalledWith('user-123', 'prod-99');
    });

    it('calls removeFavorite on Firestore when toggling off', async () => {
      vi.mocked(getFavorites).mockResolvedValue(['prod-99']);

      const { result } = renderHook(() => useFavorites('user-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFavorite('prod-99');
      });

      expect(removeFavorite).toHaveBeenCalledWith('user-123', 'prod-99');
    });

    it('merges localStorage favorites into Firestore on login', async () => {
      // Anonymous user had saved some favorites locally
      localStorageMock.setItem('movilnova_favorites', JSON.stringify(['local-1', 'local-2']));
      vi.mocked(getFavorites).mockResolvedValue(['remote-1']);

      const { result } = renderHook(() => useFavorites('user-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have merged: remote-1 + local-1 + local-2
      expect(result.current.favorites.size).toBe(3);
      expect(result.current.isFavorite('remote-1')).toBe(true);
      expect(result.current.isFavorite('local-1')).toBe(true);
      expect(result.current.isFavorite('local-2')).toBe(true);

      // Should have called addFavorite for the local ones not in Firestore
      expect(addFavorite).toHaveBeenCalledWith('user-123', 'local-1');
      expect(addFavorite).toHaveBeenCalledWith('user-123', 'local-2');
    });

    it('clears localStorage favorites after merge', async () => {
      localStorageMock.setItem('movilnova_favorites', JSON.stringify(['local-1']));
      vi.mocked(getFavorites).mockResolvedValue([]);

      renderHook(() => useFavorites('user-123'));

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('movilnova_favorites');
      });
    });
  });
});
