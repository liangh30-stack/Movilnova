import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { BRAND_MODELS, MOCK_PRODUCTS, HOT_BUNDLE } from '../constants';
import { CatalogConfig, getCatalog, getDefaultCatalog } from '../services/catalogService';
import {
  subscribeToProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  importMockProducts,
} from '../services/productService';
import { signOutUser, AppUser, hasAdminAccess } from '../services/authService';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Upload,
  Loader2,
  LogOut,
  ArrowLeft,
  Package,
  AlertCircle,
  Check,
  Database,
  Search,
  Filter,
  Star,
  ImagePlus,
  Images,
  Tag,
  TrendingDown,
  BarChart3,
  Grid,
  List,
  PackageX,
  AlertTriangle,
  History,
  ShoppingBag,
  Eye,
} from 'lucide-react';
import InventoryHistory from './InventoryHistory';

interface ProductManagerProps {
  user: AppUser;
  onLogout: () => void;
  onBack: () => void;
  editProductId?: string | null;
}

interface ProductFormData {
  name: string;
  price: string;
  originalPrice: string;
  costPrice: string;
  category: string;
  brands: string[];
  compatibleModels: string[];
  colors: string[];
  colorImages: Record<string, number>;
  images: string[];
  description: string;
  stock: string;
  isBundle: boolean;
}

const DEFAULT_CATEGORIES = [
  'Carcasa', 'Protector de pantalla', 'Cargador', 'Cable', 'Power Bank', 'Colgante', 'Audio', 'Bundle',
];

const initialFormData: ProductFormData = {
  name: '',
  price: '',
  originalPrice: '',
  costPrice: '',
  category: 'Carcasa',
  brands: [],
  compatibleModels: [],
  colors: [],
  colorImages: {},
  images: [],
  description: '',
  stock: '0',
  isBundle: false,
};

const ProductManager: React.FC<ProductManagerProps> = ({ user, onLogout, onBack, editProductId }) => {
  const { t } = useTranslation();

  if (!user || !hasAdminAccess(user.role)) return null;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogConfig>(getDefaultCatalog());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load catalog config
  useEffect(() => {
    getCatalog().then(setCatalog).catch((err) => { if (import.meta.env.DEV) console.error(err); });
  }, []);

  // Subscribe to real-time product updates
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToProducts(
      (firestoreProducts) => {
        setProducts(firestoreProducts);
        setIsLoading(false);
      },
      (err) => {
        setError(t('pmLoadError'));
        if (import.meta.env.DEV) console.error(err);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Open edit form when editProductId is provided (from product page)
  useEffect(() => {
    if (editProductId && products.length > 0 && !isFormOpen) {
      const product = products.find(p => String(p.id) === editProductId);
      if (product) openEditForm(product);
    }
  }, [editProductId, products.length]);

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.brands && p.brands.some(b => b.toLowerCase().includes(q)));
        if (!match) return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterBrand && !p.brands?.includes(filterBrand)) return false;
      return true;
    });
  }, [products, searchQuery, filterCategory, filterBrand]);

  // Unique brands from products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => { p.brands?.forEach(b => brands.add(b)); });
    return Array.from(brands).sort();
  }, [products]);

  // Stats
  const stats = useMemo(() => ({
    total: products.length,
    categories: new Set(products.map(p => p.category)).size,
    brands: availableBrands.length,
    onSale: products.filter(p => p.originalPrice && p.originalPrice > p.price).length,
    lowStock: products.filter(p => p.stock != null && p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock != null && p.stock === 0).length,
  }), [products, availableBrands]);

  const handleLogout = async () => {
    try { await signOutUser(); onLogout(); } catch (err) { if (import.meta.env.DEV) console.error('Error logging out:', err); }
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    // In Firestore: price = what customer pays, originalPrice = higher regular price (crossed out).
    // In admin form: "Precio" = regular price, "Precio rebajado" = sale price (lower).
    // When on sale (originalPrice > price): swap so admin sees regular in "Precio", sale in "Precio rebajado".
    const isOnSale = product.originalPrice != null && product.originalPrice > product.price;
    setFormData({
      name: product.name,
      price: isOnSale ? product.originalPrice!.toString() : product.price.toString(),
      originalPrice: isOnSale ? product.price.toString() : '',
      costPrice: product.costPrice?.toString() || '',
      category: product.category,
      brands: product.brands || [],
      compatibleModels: product.compatibleModels || [],
      colors: product.colors || [],
      colorImages: product.colorImages ? { ...product.colorImages } : {},
      images: product.images?.length ? [...product.images] : (product.image ? [product.image] : []),
      description: product.description,
      stock: product.stock?.toString() || '0',
      isBundle: product.isBundle || false,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  // Multi-image upload
  const processImageFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const currentCount = formData.images.length;
    const remaining = 10 - currentCount;
    if (remaining <= 0) {
      setError(t('pmMaxImages'));
      return;
    }

    const toProcess = fileArray.slice(0, remaining);
    if (fileArray.length > remaining) {
      setError(t('pmMaxImagesRemaining', { count: remaining }));
    }

    setIsUploading(true);
    try {
      const uploaded = await Promise.all(toProcess.map(f => uploadProductImage(f)));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
    } catch (err) {
      setError(t('pmImageUploadError'));
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) processImageFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newColorImages: Record<string, number> = {};
      for (const [color, idx] of Object.entries(prev.colorImages)) {
        if (idx === index) continue;
        newColorImages[color] = idx > index ? idx - 1 : idx;
      }
      return { ...prev, images: prev.images.filter((_, i) => i !== index), colorImages: newColorImages };
    });
  };

  const makePrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const newImages = [...prev.images];
      const [moved] = newImages.splice(index, 1);
      newImages.unshift(moved);
      const newColorImages: Record<string, number> = {};
      for (const [color, idx] of Object.entries(prev.colorImages)) {
        if (idx === index) newColorImages[color] = 0;
        else if (idx < index) newColorImages[color] = idx + 1;
        else newColorImages[color] = idx;
      }
      return { ...prev, images: newImages, colorImages: newColorImages };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || formData.images.length === 0 || !formData.description.trim()) {
      setError(t('pmFillRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Admin form: "Precio" = regular price, "Precio rebajado" = optional sale price (lower).
      // Firestore: price = what customer pays, originalPrice = higher regular price (shown crossed out).
      const regularPrice = parseFloat(formData.price);
      const salePrice = formData.originalPrice ? parseFloat(formData.originalPrice) : undefined;
      const hasValidSale = salePrice != null && salePrice > 0 && salePrice < regularPrice;

      const productData = {
        name: formData.name.trim(),
        price: hasValidSale ? salePrice : regularPrice,
        originalPrice: hasValidSale ? regularPrice : undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        category: formData.category,
        brands: formData.brands.length > 0 ? formData.brands : undefined,
        compatibleModels: formData.compatibleModels.length > 0 ? formData.compatibleModels : undefined,
        colors: formData.colors.length > 0 ? formData.colors : undefined,
        colorImages: Object.keys(formData.colorImages).length > 0 ? formData.colorImages : undefined,
        image: formData.images[0],
        images: formData.images,
        description: formData.description.trim(),
        stock: formData.stock ? parseInt(formData.stock, 10) : 0,
        isBundle: formData.isBundle,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id as string, productData, user.email ?? undefined, user.uid);
        setSuccessMessage(t('pmProductUpdated'));
      } else {
        await createProduct(productData, user.uid, user.email ?? undefined);
        setSuccessMessage(t('pmProductCreated'));
      }

      closeForm();
    } catch (err) {
      setError(t('pmSaveError'));
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(productToDelete.id as string, user.uid, user.email ?? undefined, productToDelete.name);
      setSuccessMessage(t('pmProductDeleted'));
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setError(t('pmDeleteError'));
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMigrateData = async () => {
    if (products.length > 0) {
      if (!window.confirm(t('pmConfirmImport'))) return;
    }
    setIsMigrating(true);
    setError(null);
    try {
      const allMockProducts = [HOT_BUNDLE, ...MOCK_PRODUCTS];
      await importMockProducts(allMockProducts, user.uid, user.email ?? undefined);
      setSuccessMessage(t('pmImportSuccess', { count: allMockProducts.length }));
    } catch (err) {
      setError(t('pmImportError'));
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setIsMigrating(false);
    }
  };

  const toggleCompatibleModel = (model: string) => {
    setFormData(prev => ({
      ...prev,
      compatibleModels: prev.compatibleModels.includes(model)
        ? prev.compatibleModels.filter(m => m !== model)
        : [...prev.compatibleModels, model],
    }));
  };

  const CATEGORIES = catalog.categories.length > 0 ? catalog.categories : DEFAULT_CATEGORIES;
  const availableModels = formData.brands.length > 0
    ? formData.brands.flatMap(b => catalog.brands[b] || [])
    : [];

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <header className="bg-brand-surface border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-brand-light rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-brand-pink to-pink-600 text-white p-2.5 rounded-xl shadow-md">
                <Package size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg text-brand-dark">{t('pmTitle')}</h1>
                <p className="text-xs text-brand-muted">{t('pmProductCount', { count: products.length })} · {user.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-brand-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium hidden sm:inline">{t('pmLogout')}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Toast: Success */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-3.5 shadow-2xl">
              <Check size={18} />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Toast: Error */}
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-3.5 shadow-2xl">
              <AlertCircle size={18} />
              <span className="text-sm flex-1">{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-brand-surface rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <Package size={18} className="text-brand-pink" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.total}</p>
                <p className="text-xs text-brand-muted">{t('pmStatProducts')}</p>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Tag size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.categories}</p>
                <p className="text-xs text-brand-muted">{t('pmStatCategories')}</p>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <BarChart3 size={18} className="text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.brands}</p>
                <p className="text-xs text-brand-muted">{t('pmStatBrands')}</p>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingDown size={18} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.onSale}</p>
                <p className="text-xs text-brand-muted">{t('pmStatOnSale')}</p>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.lowStock}</p>
                <p className="text-xs text-brand-muted">{t('pmStatLowStock')}</p>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <PackageX size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.outOfStock}</p>
                <p className="text-xs text-brand-muted">{t('pmStatOutOfStock')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-brand-pink text-white px-5 py-2.5 rounded-xl font-medium hover:bg-pink-600 transition-colors shadow-lg shadow-brand-pink/20"
          >
            <Plus size={18} />
            <span>{t('pmNewProduct')}</span>
          </button>
          <button
            onClick={handleMigrateData}
            disabled={isMigrating}
            className="flex items-center gap-2 bg-brand-muted text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-muted/80 transition-colors disabled:opacity-50"
          >
            {isMigrating ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            <span>{isMigrating ? t('pmImporting') : t('pmImportDemo')}</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-brand-surface rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('pmSearchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-tertiary hover:text-brand-muted">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-brand-text-tertiary hidden md:block" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none bg-brand-surface min-w-[140px]"
              >
                <option value="">{t('pmAllCategories')}</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none bg-brand-surface min-w-[140px]"
            >
              <option value="">{t('pmAllBrands')}</option>
              {availableBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            {(searchQuery || filterCategory || filterBrand) && (
              <button
                onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterBrand(''); }}
                className="px-4 py-2.5 text-brand-pink font-medium text-sm hover:bg-pink-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {t('pmClearFilters')}
              </button>
            )}
            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-brand-pink text-white' : 'text-brand-text-tertiary hover:text-brand-muted'}`}
                title={t('pmGridView')}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-brand-pink text-white' : 'text-brand-text-tertiary hover:text-brand-muted'}`}
                title={t('pmListView')}
              >
                <List size={16} />
              </button>
            </div>
          </div>
          {(searchQuery || filterCategory || filterBrand) && (
            <p className="text-xs text-brand-muted mt-2 ml-1">
              {t('pmFilteredCount', { filtered: filteredProducts.length, total: products.length })}
            </p>
          )}
        </div>

        {/* Product Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-pink" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-brand-surface rounded-xl border shadow-sm text-center py-20">
            <Package size={48} className="mx-auto text-brand-text-tertiary mb-4" />
            <p className="text-brand-muted mb-2 font-medium">
              {products.length === 0 ? t('pmNoProducts') : t('pmNoProductsFound')}
            </p>
            <p className="text-brand-text-tertiary text-sm">
              {products.length === 0
                ? t('pmNoProductsHint')
                : t('pmNoProductsFoundHint')}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-brand-surface rounded-xl border shadow-sm overflow-hidden group hover:shadow-md transition-all">
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-brand-light overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Stock badge */}
                  {product.stock != null && (
                    <span className={`absolute top-2 left-2 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                      product.stock === 0 ? 'bg-red-500 text-white' : product.stock < 10 ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      <Package size={12} />
                      {product.stock}
                    </span>
                  )}
                  {/* Image count badge */}
                  {(product.images?.length || 0) > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <Images size={12} />
                      {product.images!.length}
                    </span>
                  )}
                  {/* Bundle badge */}
                  {product.isBundle && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2.5 py-1 rounded-lg font-semibold">
                      {t('pmBundle')}
                    </span>
                  )}
                  {/* Discount badge */}
                  {product.originalPrice && product.originalPrice > product.price && !product.isBundle && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-semibold">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-brand-dark text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-brand-text-tertiary truncate mt-0.5">{product.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-light text-brand-muted">
                      {product.category}
                    </span>
                    <span className="text-[11px] text-brand-text-tertiary">{product.brands?.join(' · ') || t('pmUniversal')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-border-subtle">
                    <div>
                      <span className="font-bold text-brand-dark text-base">{'\u20AC'}{product.price.toFixed(2)}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="ml-1.5 text-xs text-brand-text-tertiary line-through">
                          {'\u20AC'}{product.originalPrice.toFixed(2)}
                        </span>
                      )}
                      {product.costPrice != null && (
                        <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          {t('pmMargin')}: {((1 - product.costPrice / product.price) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHistoryProduct(product)}
                        className="p-2 text-brand-text-tertiary hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                        title={t('pmViewHistory')}
                      >
                        <History size={15} />
                      </button>
                      <button
                        onClick={() => openEditForm(product)}
                        className="p-2 text-brand-text-tertiary hover:text-brand-pink hover:bg-pink-50 rounded-lg transition-colors"
                        title={t('pmEdit')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => { setProductToDelete(product); setIsDeleteDialogOpen(true); }}
                        className="p-2 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t('pmDelete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-brand-surface rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-brand-light">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    {(product.images?.length || 0) > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Images size={10} />
                        {product.images!.length}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-brand-dark text-base truncate">{product.name}</h3>
                        <p className="text-sm text-brand-muted line-clamp-1 mt-0.5">{product.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setHistoryProduct(product)}
                          className="p-2 text-brand-text-tertiary hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                          title={t('pmViewHistory')}
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => openEditForm(product)}
                          className="p-2 text-brand-text-tertiary hover:text-brand-pink hover:bg-pink-50 rounded-lg transition-colors"
                          title={t('pmEdit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setProductToDelete(product); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('pmDelete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-brand-light text-brand-muted">
                        {product.category}
                      </span>
                      <span className="text-xs text-brand-text-tertiary">{product.brands?.join(' · ') || t('pmUniversal')}</span>
                      {product.isBundle && (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          {t('pmBundle')}
                        </span>
                      )}
                      {product.stock != null && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : product.stock < 10 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          <Package size={12} />
                          {t('pmStock')}: {product.stock}
                        </span>
                      )}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700">
                          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-border-subtle">
                      <div>
                        <span className="font-bold text-brand-dark text-lg">€{product.price.toFixed(2)}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="ml-2 text-sm text-brand-text-tertiary line-through">
                            €{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ──── Product Form Modal ──── */}
      {isFormOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={closeForm} />
          <div className="fixed inset-3 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-6xl md:max-h-[92vh] bg-brand-surface z-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-brand-light">
              <h2 className="text-lg font-bold text-brand-dark">
                {editingProduct ? t('pmEditProduct') : t('pmNewProduct')}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-brand-border rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form Body + Preview */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                  {t('pmLabelName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('pmPlaceholderName')}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none text-sm"
                />
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('pmLabelPrice')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="15.99"
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('pmLabelOriginalPrice')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.originalPrice}
                    onChange={e => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="12.99"
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('pmLabelCostPrice')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={e => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                    placeholder="8.50"
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('pmLabelStock')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none text-sm"
                  />
                </div>
              </div>

              {/* Profit Margin Calculator */}
              {formData.price && formData.costPrice && parseFloat(formData.price) > 0 && parseFloat(formData.costPrice) >= 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-6">
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">{t('pmProfit')}</p>
                    <p className={`text-lg font-bold ${(parseFloat(formData.price) - parseFloat(formData.costPrice)) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {'\u20AC'}{(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">{t('pmProfitMargin')}</p>
                    <p className={`text-lg font-bold ${(parseFloat(formData.price) - parseFloat(formData.costPrice)) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {((1 - parseFloat(formData.costPrice) / parseFloat(formData.price)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Category & Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('pmLabelCategory')} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      category: e.target.value,
                      isBundle: e.target.value === 'Bundle',
                    }))}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none bg-brand-surface text-sm"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('pmLabelBrand')}
                  </label>
                  <div className="border rounded-lg p-3 max-h-36 overflow-y-auto space-y-0.5">
                    {Object.keys(catalog.brands).map(brand => (
                      <label key={brand} className="flex items-center gap-2 p-1.5 hover:bg-brand-light rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.brands.includes(brand)}
                          onChange={() => {
                            setFormData(prev => {
                              const isRemoving = prev.brands.includes(brand);
                              const newBrands = isRemoving
                                ? prev.brands.filter(b => b !== brand)
                                : [...prev.brands, brand];
                              // When removing a brand, remove models that belonged only to that brand
                              let newModels = prev.compatibleModels;
                              if (isRemoving) {
                                const removedModels = new Set(catalog.brands[brand] || []);
                                const keptModels = new Set(
                                  newBrands.flatMap(b => catalog.brands[b] || [])
                                );
                                newModels = prev.compatibleModels.filter(
                                  m => !removedModels.has(m) || keptModels.has(m)
                                );
                              }
                              return { ...prev, brands: newBrands, compatibleModels: newModels };
                            });
                          }}
                          className="w-4 h-4 rounded border-brand-border text-brand-pink focus:ring-brand-pink"
                        />
                        <span className="text-sm text-brand-dark">{brand}</span>
                      </label>
                    ))}
                  </div>
                  {formData.brands.length > 0 && (
                    <p className="text-xs text-brand-muted mt-1.5">
                      {formData.brands.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Compatible Models (grouped by brand) */}
              {formData.brands.length > 0 && availableModels.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">
                      {t('pmLabelCompatibleModels')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = availableModels.every(m => formData.compatibleModels.includes(m));
                        setFormData(prev => ({
                          ...prev,
                          compatibleModels: allSelected ? [] : [...availableModels],
                        }));
                      }}
                      className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors"
                    >
                      {availableModels.every(m => formData.compatibleModels.includes(m))
                        ? t('pmDeselectAll', 'Deseleccionar todo')
                        : t('pmSelectAll', 'Seleccionar todo')}
                    </button>
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-3">
                    {formData.brands.map(brand => {
                      const models = catalog.brands[brand] || [];
                      if (models.length === 0) return null;
                      return (
                        <div key={brand}>
                          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">{brand}</p>
                          <div className="space-y-0.5">
                            {models.map(model => (
                              <label key={model} className="flex items-center gap-2 p-1.5 hover:bg-brand-light rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.compatibleModels.includes(model)}
                                  onChange={() => toggleCompatibleModel(model)}
                                  className="w-4 h-4 rounded border-brand-border text-brand-pink focus:ring-brand-pink"
                                />
                                <span className="text-sm text-brand-dark">{model}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formData.compatibleModels.length > 0 && (
                    <p className="text-xs text-brand-muted mt-1.5">
                      {t('pmModelsSelected', { count: formData.compatibleModels.length })}
                    </p>
                  )}
                </div>
              )}

              {/* ──── Colors ──── */}
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                  {t('productColors')}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    id="colorPickerInput"
                    defaultValue="#000000"
                    className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('colorPickerInput') as HTMLInputElement;
                      const hex = input.value.toUpperCase();
                      if (!formData.colors.includes(hex)) {
                        setFormData(prev => ({ ...prev, colors: [...prev.colors, hex] }));
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-light hover:bg-brand-border text-brand-dark rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus size={14} />
                    {t('addColor')}
                  </button>
                </div>
                {formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color) => (
                      <div key={color} className="flex items-center gap-1.5 bg-brand-light border border-brand-border rounded-lg px-2 py-1.5">
                        <span
                          className="w-5 h-5 rounded-full border border-brand-border flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-brand-muted font-mono">{color}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => {
                            const { [color]: _, ...restColorImages } = prev.colorImages;
                            return { ...prev, colors: prev.colors.filter(c => c !== color), colorImages: restColorImages };
                          })}
                          className="p-0.5 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title={t('removeColor')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ──── Multi-Image Upload Section ──── */}
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                  {t('pmLabelImages')} * <span className="font-normal text-brand-text-tertiary">({formData.images.length}/10)</span>
                </label>

                {/* Image Gallery */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group/img aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-pink transition-colors">
                        <img src={img} alt={t('pmImageAlt', { number: i + 1 })} className="w-full h-full object-cover" />
                        {/* Primary badge */}
                        {i === 0 && (
                          <div className="absolute top-1 left-1 bg-brand-pink text-white p-0.5 rounded" title={t('pmPrimaryImage')}>
                            <Star size={10} fill="currentColor" />
                          </div>
                        )}
                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {i !== 0 && (
                            <button
                              type="button"
                              onClick={() => makePrimaryImage(i)}
                              className="p-1.5 bg-brand-surface rounded-lg text-brand-pink hover:bg-pink-50 transition-colors"
                              title={t('pmMakePrimary')}
                            >
                              <Star size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="p-1.5 bg-brand-surface rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={t('pmDelete')}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop Zone */}
                {formData.images.length < 10 && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-brand-pink bg-pink-50'
                        : 'border-brand-border hover:border-brand-pink hover:bg-pink-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={28} className="animate-spin text-brand-pink" />
                        <p className="text-sm text-brand-muted">{t('pmProcessingImages')}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                          <ImagePlus size={22} className="text-brand-pink" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-dark">
                            {t('pmDragImages')} <span className="text-brand-pink">{t('pmClickToUpload')}</span>
                          </p>
                          <p className="text-xs text-brand-text-tertiary mt-1">
                            {t('pmUploadHint', { remaining: 10 - formData.images.length })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ──── Color → Image Assignment ──── */}
              {formData.colors.length > 0 && formData.images.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                    {t('colorImageAssignment')}
                  </label>
                  <p className="text-xs text-brand-text-tertiary mb-3">{t('colorImageAssignmentDesc')}</p>
                  <div className="space-y-2">
                    {formData.colors.map((color) => (
                      <div key={color} className="flex items-center gap-3 bg-brand-light border border-brand-border rounded-lg px-3 py-2">
                        <span
                          className="w-6 h-6 rounded-full border border-brand-border flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-brand-muted font-mono w-16 flex-shrink-0">{color}</span>
                        <select
                          value={formData.colorImages[color] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const next = { ...prev.colorImages };
                              if (val === '') {
                                delete next[color];
                              } else {
                                next[color] = parseInt(val, 10);
                              }
                              return { ...prev, colorImages: next };
                            });
                          }}
                          className="flex-1 border border-brand-border rounded-lg px-2 py-1.5 text-sm bg-brand-surface text-brand-dark focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none"
                        >
                          <option value="">{t('colorImageUnassigned')}</option>
                          {formData.images.map((_, i) => (
                            <option key={i} value={i}>
                              {t('colorImageN', { n: i + 1 })}{i === 0 ? ` (${t('pmPrimaryImage')})` : ''}
                            </option>
                          ))}
                        </select>
                        {formData.colorImages[color] != null && formData.images[formData.colorImages[color]] && (
                          <img
                            src={formData.images[formData.colorImages[color]]}
                            alt={color}
                            className="w-10 h-10 rounded-lg object-cover border border-brand-border flex-shrink-0"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                  {t('pmLabelDescription')} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('pmPlaceholderDescription')}
                  rows={3}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none resize-none text-sm"
                />
              </div>

              {/* Bundle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBundle}
                  onChange={e => setFormData(prev => ({ ...prev, isBundle: e.target.checked }))}
                  className="w-4 h-4 rounded border-brand-border text-brand-pink focus:ring-brand-pink"
                />
                <span className="text-sm text-brand-dark">{t('pmMarkAsBundle')}</span>
              </label>
            </form>

            {/* Live Preview Panel */}
            <div className="lg:w-[380px] flex-shrink-0 overflow-y-auto border-t lg:border-t-0 lg:border-l border-brand-border bg-brand-light/50">
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-brand-text-tertiary" />
                  <h3 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">{t('pmPreview')}</h3>
                </div>

                {/* Store Card Preview */}
                <div>
                  <p className="text-[11px] font-medium text-brand-muted mb-2">{t('pmPreviewStoreCard')}</p>
                  <div className="bg-brand-surface rounded-lg border border-brand-border overflow-hidden shadow-sm">
                    <div className="aspect-square bg-brand-light overflow-hidden relative">
                      {formData.images.length > 0 ? (
                        <img src={formData.images[0]} alt={t('pmPreview')} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-brand-text-tertiary gap-2">
                          <ImagePlus size={32} />
                          <span className="text-xs">{t('pmNoImage')}</span>
                        </div>
                      )}
                      {formData.isBundle && (
                        <div className="absolute top-2.5 left-2.5 bg-brand-accent text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm">
                          {t('pmBundle')}
                        </div>
                      )}
                      {formData.originalPrice && parseFloat(formData.originalPrice) > 0 && parseFloat(formData.originalPrice) < parseFloat(formData.price || '0') && !formData.isBundle && (
                        <div className="absolute top-2.5 right-2.5 bg-green-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                          -{Math.round((1 - parseFloat(formData.originalPrice) / parseFloat(formData.price || '1')) * 100)}%
                        </div>
                      )}
                      {formData.images.length > 1 && (
                        <span className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Images size={10} />
                          1/{formData.images.length}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-semibold text-brand-primary uppercase tracking-wider">
                        {formData.brands.length > 0 ? formData.brands.join(' · ') : t('pmUniversal')}
                      </span>
                      <h4 className="text-sm font-semibold text-brand-dark mt-1 mb-3 line-clamp-2 min-h-[36px]">
                        {formData.name || t('pmProductNamePlaceholder')}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-base font-bold text-brand-dark">
                            €{formData.originalPrice && parseFloat(formData.originalPrice) > 0 && parseFloat(formData.originalPrice) < parseFloat(formData.price || '0')
                              ? parseFloat(formData.originalPrice).toFixed(2)
                              : formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}
                          </span>
                          {formData.originalPrice && parseFloat(formData.originalPrice) > 0 && parseFloat(formData.originalPrice) < parseFloat(formData.price || '0') && (
                            <span className="text-[11px] text-brand-text-tertiary line-through ml-1.5">
                              €{parseFloat(formData.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="w-9 h-9 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                          <ShoppingBag size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cart Item Preview */}
                <div>
                  <p className="text-[11px] font-medium text-brand-muted mb-2">{t('pmPreviewInCart')}</p>
                  <div className="flex gap-3 p-3 bg-brand-surface rounded-lg border border-brand-border shadow-sm">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-light flex-shrink-0">
                      {formData.images.length > 0 ? (
                        <img src={formData.images[0]} alt={t('pmPreview')} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-text-tertiary">
                          <ImagePlus size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-brand-dark truncate">
                        {formData.name || t('pmProductNamePlaceholder')}
                      </p>
                      {formData.compatibleModels.length > 0 && (
                        <p className="text-[10px] text-brand-text-tertiary font-bold uppercase tracking-widest truncate">
                          {formData.compatibleModels[0]}
                        </p>
                      )}
                      <p className="text-brand-primary font-bold text-sm mt-0.5">
                        €{formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-6 h-6 rounded border border-brand-border flex items-center justify-center text-brand-text-tertiary text-xs">−</div>
                        <span className="w-6 text-center text-xs font-bold">1</span>
                        <div className="w-6 h-6 rounded border border-brand-border flex items-center justify-center text-brand-text-tertiary text-xs">+</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout Summary Preview */}
                <div>
                  <p className="text-[11px] font-medium text-brand-muted mb-2">{t('pmPreviewCheckout')}</p>
                  <div className="bg-brand-surface rounded-lg border border-brand-border p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-brand-light flex-shrink-0">
                        {formData.images.length > 0 ? (
                          <img src={formData.images[0]} alt={t('pmPreview')} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-text-tertiary">
                            <ImagePlus size={12} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-brand-dark truncate">{formData.name || t('pmProductNamePlaceholder')}</p>
                        <p className="text-[11px] text-brand-text-tertiary">1x €{formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}</p>
                      </div>
                      <p className="text-sm font-bold text-brand-dark">
                        €{formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-brand-border-subtle space-y-1.5">
                      <div className="flex justify-between text-[11px] text-brand-muted">
                        <span>{t('pmSubtotal')}</span>
                        <span>€{formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-brand-muted">
                        <span>{t('pmShipping')}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{t('pmFree')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-brand-muted">
                        <span>{t('pmVAT')}</span>
                        <span>€{formData.price ? (parseFloat(formData.price) * 0.21).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-brand-dark pt-1.5 border-t border-brand-border-subtle">
                        <span>{t('pmTotal')}</span>
                        <span className="text-brand-primary">
                          €{formData.price ? (parseFloat(formData.price) * 1.21).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock indicator */}
                {formData.stock && parseInt(formData.stock) > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-brand-text-tertiary">
                    <Package size={12} />
                    <span>{(t as (key: string, opts?: Record<string, unknown>) => string)('pmUnitsInStock', { count: formData.stock })}</span>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-brand-light">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 text-brand-muted hover:bg-brand-border rounded-xl font-medium transition-colors text-sm"
              >
                {t('pmCancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-pink text-white rounded-xl font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 text-sm"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{editingProduct ? t('pmSaveChanges') : t('pmCreateProduct')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ──── Delete Confirmation Dialog ──── */}
      {isDeleteDialogOpen && productToDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsDeleteDialogOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-brand-surface z-50 rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">{t('pmDeleteProduct')}</h3>
              <p className="text-brand-muted mb-6">
                {t('pmDeleteConfirm', { name: productToDelete.name })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1 px-4 py-3 border rounded-xl font-medium hover:bg-brand-light transition-colors"
                >
                  {t('pmCancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  <span>{t('pmDelete')}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Inventory History Modal */}
      {historyProduct && (
        <InventoryHistory
          productId={historyProduct.id}
          productName={historyProduct.name}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductManager;
