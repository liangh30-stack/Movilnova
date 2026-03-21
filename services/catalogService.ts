import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BRAND_MODELS } from '../constants';

const CATALOG_DOC = 'shopSettings/catalog';

const DEFAULT_CATEGORIES = [
  'Carcasa', 'Protector de pantalla', 'Cargador', 'Cable', 'Power Bank', 'Colgante', 'Audio', 'Bundle',
];

export interface CatalogConfig {
  categories: string[];
  brands: Record<string, string[]>;
  updatedAt?: string;
}

export const getDefaultCatalog = (): CatalogConfig => ({
  categories: [...DEFAULT_CATEGORIES],
  brands: { ...BRAND_MODELS },
});

export const getCatalog = async (): Promise<CatalogConfig> => {
  try {
    const snap = await getDoc(doc(db, CATALOG_DOC));
    if (snap.exists()) {
      const data = snap.data();
      return {
        categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES,
        brands: data.brands && Object.keys(data.brands).length > 0 ? data.brands : BRAND_MODELS,
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error loading catalog config:', err);
  }
  return getDefaultCatalog();
};

export const saveCatalog = async (catalog: CatalogConfig): Promise<void> => {
  await setDoc(doc(db, CATALOG_DOC), {
    categories: catalog.categories,
    brands: catalog.brands,
    updatedAt: new Date().toISOString(),
  });
};
