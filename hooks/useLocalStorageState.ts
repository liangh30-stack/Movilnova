import { useEffect, useState } from 'react';

const safeJsonParse = <T,>(str: string | null, fallback: T): T => {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
};

interface LocalStorageOptions<T> {
  key: string;
  fallback: T;
  removeOnNull?: boolean;
}

export const useLocalStorageState = <T,>({ key, fallback, removeOnNull }: LocalStorageOptions<T>) => {
  const [value, setValue] = useState<T>(() => safeJsonParse(localStorage.getItem(key), fallback));

  useEffect(() => {
    if (removeOnNull && (value === null || value === undefined)) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, removeOnNull, value]);

  return [value, setValue] as const;
};
