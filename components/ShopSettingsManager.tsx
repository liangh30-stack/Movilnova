import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save, RotateCcw, CheckCircle2, AlertCircle, Loader2, Percent, Truck,
  CreditCard, DollarSign, Tag, Plus, X, Pencil, Trash2, GripVertical,
  ChevronDown, ChevronRight, Smartphone, Package, Ticket, Calendar, Hash,
  ToggleLeft, ToggleRight, Wrench, AlertTriangle, Star, Search, Megaphone,
} from 'lucide-react';
import { ShopSettings, DEFAULT_SHOP_SETTINGS, getShopSettings, saveShopSettings } from '../services/storeConfigService';
import { CatalogConfig, getCatalog, saveCatalog, getDefaultCatalog } from '../services/catalogService';
import { PromoCode, PromoCodeInput, getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '../services/promoCodeService';
import { SpecialOffer, SpecialOfferInput, getOffers, createOffer, updateOffer, deleteOffer } from '../services/offerService';
import { Product } from '../types';
import { subscribeToProducts } from '../services/productService';
import { AppUser } from '../services/authService';

interface ShopSettingsManagerProps {
  user: AppUser;
}

type SettingsTab = 'general' | 'promotions' | 'catalog';

const ShopSettingsManager: React.FC<ShopSettingsManagerProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [catalog, setCatalog] = useState<CatalogConfig>(getDefaultCatalog());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [catalogStatus, setCatalogStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Category editing
  const [newCategory, setNewCategory] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  // Brand editing
  const [newBrand, setNewBrand] = useState('');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [newModel, setNewModel] = useState('');
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editingBrandValue, setEditingBrandValue] = useState('');

  // Promo codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoForm, setPromoForm] = useState<PromoCodeInput | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [savingPromo, setSavingPromo] = useState(false);

  // Special offers
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [offerForm, setOfferForm] = useState<SpecialOfferInput | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerProductSearch, setOfferProductSearch] = useState('');

  // Products (for featured product selector)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredSearch, setFeaturedSearch] = useState('');

  useEffect(() => {
    const unsub = subscribeToProducts(setAllProducts);
    return unsub;
  }, []);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, c, p, o] = await Promise.all([getShopSettings(), getCatalog(), getPromoCodes(), getOffers()]);
      setSettings(s);
      setCatalog(c);
      setPromoCodes(p);
      setOffers(o);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Shop Settings ──
  const handleSaveSettings = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      await saveShopSettings({
        ivaRate: settings.ivaRate,
        showIva: settings.showIva,
        shippingCost: settings.shippingCost,
        freeShippingThreshold: settings.freeShippingThreshold,
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        maintenanceMode: settings.maintenanceMode,
        featuredProductId: settings.featuredProductId,
        bannerEnabled: settings.bannerEnabled,
        bannerText: settings.bannerText,
        bannerSubtext: settings.bannerSubtext,
      }, user.uid, user.email ?? undefined);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SHOP_SETTINGS);
    setStatus('idle');
  };

  const updateField = (field: keyof ShopSettings, value: number | string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setStatus('idle');
  };

  // ── Catalog ──
  const handleSaveCatalog = async () => {
    setSavingCatalog(true);
    setCatalogStatus('idle');
    try {
      await saveCatalog(catalog);
      setCatalogStatus('saved');
      setTimeout(() => setCatalogStatus('idle'), 3000);
    } catch {
      setCatalogStatus('error');
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleResetCatalog = () => {
    setCatalog(getDefaultCatalog());
    setCatalogStatus('idle');
  };

  // ── Category helpers ──
  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || catalog.categories.includes(trimmed)) return;
    setCatalog(prev => ({ ...prev, categories: [...prev.categories, trimmed] }));
    setNewCategory('');
    setCatalogStatus('idle');
  };

  const removeCategory = (index: number) => {
    setCatalog(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
    setCatalogStatus('idle');
  };

  const startEditCategory = (index: number) => {
    setEditingCatIndex(index);
    setEditingCatValue(catalog.categories[index]);
  };

  const confirmEditCategory = () => {
    if (editingCatIndex === null) return;
    const trimmed = editingCatValue.trim();
    if (!trimmed) return;
    setCatalog(prev => ({
      ...prev,
      categories: prev.categories.map((c, i) => i === editingCatIndex ? trimmed : c),
    }));
    setEditingCatIndex(null);
    setEditingCatValue('');
    setCatalogStatus('idle');
  };

  // ── Brand helpers ──
  const addBrand = () => {
    const trimmed = newBrand.trim();
    if (!trimmed || catalog.brands[trimmed]) return;
    setCatalog(prev => ({ ...prev, brands: { ...prev.brands, [trimmed]: [] } }));
    setNewBrand('');
    setExpandedBrand(trimmed);
    setCatalogStatus('idle');
  };

  const removeBrand = (brand: string) => {
    if (!window.confirm(t('settingsConfirmDeleteBrand', { brand }))) return;
    setCatalog(prev => {
      const newBrands = { ...prev.brands };
      delete newBrands[brand];
      return { ...prev, brands: newBrands };
    });
    if (expandedBrand === brand) setExpandedBrand(null);
    setCatalogStatus('idle');
  };

  const startEditBrand = (brand: string) => {
    setEditingBrand(brand);
    setEditingBrandValue(brand);
  };

  const confirmEditBrand = () => {
    if (!editingBrand) return;
    const trimmed = editingBrandValue.trim();
    if (!trimmed || (trimmed !== editingBrand && catalog.brands[trimmed])) return;
    if (trimmed !== editingBrand) {
      setCatalog(prev => {
        const newBrands = { ...prev.brands };
        newBrands[trimmed] = newBrands[editingBrand!];
        delete newBrands[editingBrand!];
        return { ...prev, brands: newBrands };
      });
      if (expandedBrand === editingBrand) setExpandedBrand(trimmed);
    }
    setEditingBrand(null);
    setEditingBrandValue('');
    setCatalogStatus('idle');
  };

  const addModel = (brand: string) => {
    const trimmed = newModel.trim();
    if (!trimmed || catalog.brands[brand]?.includes(trimmed)) return;
    setCatalog(prev => ({
      ...prev,
      brands: { ...prev.brands, [brand]: [...(prev.brands[brand] || []), trimmed] },
    }));
    setNewModel('');
    setCatalogStatus('idle');
  };

  const removeModel = (brand: string, modelIndex: number) => {
    setCatalog(prev => ({
      ...prev,
      brands: { ...prev.brands, [brand]: prev.brands[brand].filter((_, i) => i !== modelIndex) },
    }));
    setCatalogStatus('idle');
  };

  // ── Promo Code helpers ──
  const defaultPromoForm: PromoCodeInput = {
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 0,
    maxUses: 0,
    maxUsesPerUser: 0,
    isActive: true,
    expiresAt: null,
  };

  const handleSavePromo = async () => {
    if (!promoForm || !promoForm.code.trim()) return;
    setSavingPromo(true);
    try {
      if (editingPromoId) {
        await updatePromoCode(editingPromoId, promoForm, user.uid, user.email ?? undefined);
        setPromoCodes(prev => prev.map(p => p.id === editingPromoId ? { ...p, ...promoForm, code: promoForm.code.toUpperCase().trim() } : p));
      } else {
        const created = await createPromoCode(promoForm, user.uid, user.email ?? undefined);
        setPromoCodes(prev => [...prev, created]);
      }
      setPromoForm(null);
      setEditingPromoId(null);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving promo:', error);
    } finally {
      setSavingPromo(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm(t('promoDeleteConfirm'))) return;
    try {
      await deletePromoCode(id, user.uid, user.email ?? undefined);
      setPromoCodes(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting promo:', error);
    }
  };

  const handleTogglePromoActive = async (promo: PromoCode) => {
    try {
      await updatePromoCode(promo.id, { isActive: !promo.isActive }, user.uid, user.email ?? undefined);
      setPromoCodes(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error toggling promo:', error);
    }
  };

  // ── Special Offers ──
  const newOfferDefaults: SpecialOfferInput = {
    name: '',
    type: 'buy_x_pay_y',
    isActive: true,
    buyQuantity: 3,
    payQuantity: 2,
    scope: 'all',
    scopeValue: '',
    triggerProductId: '',
    giftProductId: '',
    requiredQuantity: 2,
    extraProductId: '',
    extraPrice: 0,
    discountType: 'percentage',
    discountValue: 10,
    expiresAt: null,
  };

  const handleSaveOffer = async () => {
    if (!offerForm || !offerForm.name.trim()) return;
    setSavingOffer(true);
    try {
      if (editingOfferId) {
        await updateOffer(editingOfferId, offerForm, user.uid, user.email ?? undefined);
        setOffers(prev => prev.map(o => o.id === editingOfferId ? { ...o, ...offerForm } : o));
      } else {
        const created = await createOffer(offerForm, user.uid, user.email ?? undefined);
        setOffers(prev => [...prev, created]);
      }
      setOfferForm(null);
      setEditingOfferId(null);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving offer:', error);
    } finally {
      setSavingOffer(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm(t('offerConfirmDelete'))) return;
    try {
      await deleteOffer(id, user.uid, user.email ?? undefined);
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting offer:', error);
    }
  };

  const handleToggleOfferActive = async (offer: SpecialOffer) => {
    try {
      await updateOffer(offer.id, { isActive: !offer.isActive }, user.uid, user.email ?? undefined);
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error toggling offer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-brand-text-tertiary">{t('settingsLoading')}</p>
        </div>
      </div>
    );
  }

  const previewShipping = 100 >= settings.freeShippingThreshold ? 0 : settings.shippingCost;
  const previewTax = 100 * settings.ivaRate;
  const previewTotal = 100 + previewShipping + previewTax;
  const brandEntries = Object.entries(catalog.brands).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1000px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-brand-dark tracking-tight">{t('settingsTitle')}</h2>
        <p className="text-sm text-brand-text-tertiary mt-0.5">{t('settingsSubtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-light rounded-xl p-1 border border-brand-border">
        {([
          { id: 'general' as SettingsTab, icon: <DollarSign size={15} />, label: t('settingsTabGeneral', 'General') },
          { id: 'promotions' as SettingsTab, icon: <Ticket size={15} />, label: t('settingsTabPromotions', 'Promociones') },
          { id: 'catalog' as SettingsTab, icon: <Package size={15} />, label: t('settingsTabCatalog', 'Catálogo') },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeSettingsTab === tab.id
                ? 'bg-brand-surface text-brand-primary shadow-sm border border-brand-border'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB: GENERAL
          ═══════════════════════════════════════════ */}
      {activeSettingsTab === 'general' && (<div className="space-y-8">

      {/* ═══════════════════════════════════════════
          BANNER PROMOCIONAL
          ═══════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Megaphone size={16} className="text-brand-text-tertiary" />
          {t('settingsBannerTitle')}
        </h3>

        <div className={`rounded-xl border-2 p-5 ${settings.bannerEnabled ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border bg-brand-surface'}`}>
          {/* Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${settings.bannerEnabled ? 'bg-brand-primary/10' : 'bg-brand-light'}`}>
                <Megaphone size={18} className={settings.bannerEnabled ? 'text-brand-primary' : 'text-brand-text-tertiary'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-dark">{t('settingsBannerEnabled')}</p>
                <p className="text-xs text-brand-muted">{t('settingsBannerEnabledDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateField('bannerEnabled', !settings.bannerEnabled)}
              className="flex-shrink-0"
            >
              {settings.bannerEnabled
                ? <ToggleRight size={32} className="text-brand-primary" />
                : <ToggleLeft size={32} className="text-brand-text-tertiary" />
              }
            </button>
          </div>

          {/* Text inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">{t('settingsBannerText')}</label>
              <input
                type="text"
                value={settings.bannerText}
                onChange={e => updateField('bannerText', e.target.value)}
                placeholder={t('settingsBannerPlaceholder')}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5">{t('settingsBannerSubtext')}</label>
              <input
                type="text"
                value={settings.bannerSubtext}
                onChange={e => updateField('bannerSubtext', e.target.value)}
                placeholder={t('settingsBannerSubtextPlaceholder')}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Preview */}
          {settings.bannerEnabled && settings.bannerText && (
            <div className="mt-4 bg-brand-primary rounded-lg py-2 px-4 text-white text-xs flex items-center justify-center gap-2">
              <span className="font-medium">{settings.bannerText}</span>
              {settings.bannerSubtext && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80">{settings.bannerSubtext}</span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 1: Shop Settings (IVA, shipping, currency)
          ═══════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-brand-text-tertiary" />
          {t('settingsTaxShippingCurrency')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IVA */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Percent size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-dark">{t('settingsIVA')}</h4>
                <p className="text-[11px] text-brand-text-tertiary">{t('settingsIVADescription')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} step={0.1}
                value={parseFloat((settings.ivaRate * 100).toFixed(2))}
                onChange={e => updateField('ivaRate', parseFloat(e.target.value) / 100 || 0)}
                className="w-28 px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-lg font-bold text-center transition-all"
              />
              <span className="text-lg font-bold text-brand-text-tertiary">%</span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border-subtle">
              <div>
                <p className="text-xs font-semibold text-brand-dark">{t('settingsShowIva')}</p>
                <p className="text-[11px] text-brand-text-tertiary mt-0.5">{t('settingsShowIvaDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => updateField('showIva', !settings.showIva)}
                className="flex-shrink-0 ml-4"
                aria-label={t('settingsShowIva')}
              >
                {settings.showIva
                  ? <ToggleRight size={32} className="text-brand-primary" />
                  : <ToggleLeft size={32} className="text-brand-text-tertiary" />
                }
              </button>
            </div>
          </div>

          {/* Shipping Cost */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Truck size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-dark">{t('settingsShippingCost')}</h4>
                <p className="text-[11px] text-brand-text-tertiary">{t('settingsShippingCostDescription')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-text-tertiary">{settings.currencySymbol}</span>
              <input
                type="number" min={0} step={0.01}
                value={settings.shippingCost}
                onChange={e => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-lg font-bold text-center transition-all"
              />
            </div>
          </div>

          {/* Free Shipping Threshold */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CreditCard size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-dark">{t('settingsFreeShipping')}</h4>
                <p className="text-[11px] text-brand-text-tertiary">{t('settingsFreeShippingDescription')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-text-tertiary">{settings.currencySymbol}</span>
              <input
                type="number" min={0} step={1}
                value={settings.freeShippingThreshold}
                onChange={e => updateField('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-lg font-bold text-center transition-all"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <DollarSign size={18} className="text-violet-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-dark">{t('settingsCurrency')}</h4>
                <p className="text-[11px] text-brand-text-tertiary">{t('settingsCurrencyDescription')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('settingsCurrencyCode')}</label>
                <input
                  type="text" maxLength={3}
                  value={settings.currency}
                  onChange={e => updateField('currency', e.target.value.toUpperCase())}
                  className="w-20 px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-lg font-bold text-center uppercase transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('settingsCurrencySymbol')}</label>
                <input
                  type="text" maxLength={3}
                  value={settings.currencySymbol}
                  onChange={e => updateField('currencySymbol', e.target.value)}
                  className="w-20 px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-lg font-bold text-center transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5 mt-4">
          <h4 className="text-xs font-semibold text-brand-text-tertiary uppercase tracking-wide mb-4">{t('settingsPreviewTitle')}</h4>
          <div className="bg-brand-light rounded-lg p-4 max-w-xs">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-brand-muted">
                <span>{t('settingsPreviewSubtotal')}</span>
                <span>{settings.currencySymbol}100.00</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>{t('settingsPreviewShipping')}</span>
                <span>{previewShipping === 0 ? t('settingsPreviewFree') : `${settings.currencySymbol}${previewShipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>{t('settingsPreviewIVA', { rate: (settings.ivaRate * 100).toFixed(1) })}</span>
                <span>{settings.currencySymbol}{previewTax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-brand-border flex justify-between items-center">
              <span className="text-sm font-semibold text-brand-dark">{t('settingsPreviewTotal')}</span>
              <span className="text-lg font-bold text-brand-primary">{settings.currencySymbol}{previewTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className={`rounded-xl border-2 p-4 mt-4 ${settings.maintenanceMode ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-brand-border bg-brand-surface'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${settings.maintenanceMode ? 'bg-amber-100' : 'bg-brand-light'}`}>
                <Wrench size={18} className={settings.maintenanceMode ? 'text-amber-600 dark:text-amber-400' : 'text-brand-text-tertiary'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-dark">{t('settingsMaintenanceMode', 'Modo mantenimiento')}</p>
                <p className="text-xs text-brand-muted">{t('settingsMaintenanceModeDesc', 'Los visitantes verán una página de mantenimiento')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const action = settings.maintenanceMode
                  ? t('settingsMaintenanceDisable', 'desactivar')
                  : t('settingsMaintenanceEnable', 'activar');
                const confirm1 = window.confirm(
                  t('settingsMaintenanceConfirm1', `¿Estás seguro de que quieres ${action} el modo mantenimiento?`)
                );
                if (!confirm1) return;
                const confirm2 = window.confirm(
                  t('settingsMaintenanceConfirm2', `Confirma: ¿${action} el modo mantenimiento?`)
                );
                if (!confirm2) return;
                updateField('maintenanceMode', !settings.maintenanceMode);
              }}
              className="flex-shrink-0"
            >
              {settings.maintenanceMode
                ? <ToggleRight size={32} className="text-amber-500" />
                : <ToggleLeft size={32} className="text-brand-text-tertiary" />
              }
            </button>
          </div>
          {settings.maintenanceMode && (
            <div className="mt-3 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              {t('settingsMaintenanceActive', 'La tienda está en modo mantenimiento. Los visitantes no pueden acceder.')}
            </div>
          )}
        </div>

        {/* Featured Product */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
              <Star size={18} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-dark">{t('settingsFeaturedProduct', 'Producto destacado')}</h4>
              <p className="text-[11px] text-brand-text-tertiary">{t('settingsFeaturedProductDesc', 'Se mostrará como banner principal en la tienda')}</p>
            </div>
          </div>

          {/* Current selection */}
          {settings.featuredProductId && (() => {
            const selected = allProducts.find(p => String(p.id) === settings.featuredProductId);
            if (!selected) return null;
            return (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-3">
                <img src={selected.image} alt={selected.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-dark truncate">{selected.name}</p>
                  <p className="text-xs text-brand-muted">{selected.category} · {settings.currencySymbol}{selected.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => { updateField('featuredProductId', ''); setFeaturedSearch(''); }}
                  className="p-1.5 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0"
                  title={t('settingsRemoveFeatured', 'Quitar destacado')}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })()}

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
            <input
              type="text"
              value={featuredSearch}
              onChange={e => setFeaturedSearch(e.target.value)}
              placeholder={t('settingsFeaturedSearchPlaceholder', 'Buscar producto por nombre...')}
              className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          {/* Results dropdown */}
          {featuredSearch.trim() && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border-subtle">
              {allProducts
                .filter(p => p.name.toLowerCase().includes(featuredSearch.toLowerCase()))
                .slice(0, 8)
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => { updateField('featuredProductId', String(p.id)); setFeaturedSearch(''); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-brand-light transition-colors ${String(p.id) === settings.featuredProductId ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                  >
                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-dark truncate">{p.name}</p>
                      <p className="text-[10px] text-brand-text-tertiary">{p.category} · {settings.currencySymbol}{p.price.toFixed(2)}</p>
                    </div>
                    {String(p.id) === settings.featuredProductId && (
                      <Star size={14} className="text-yellow-500 flex-shrink-0" fill="currentColor" />
                    )}
                  </button>
                ))}
              {allProducts.filter(p => p.name.toLowerCase().includes(featuredSearch.toLowerCase())).length === 0 && (
                <p className="text-sm text-brand-text-tertiary text-center py-3">{t('noProductsFound', 'No se encontraron productos')}</p>
              )}
            </div>
          )}
        </div>

        {/* Save Settings */}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleSaveSettings} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? t('settingsSaving') : t('settingsSave')}
          </button>
          <button onClick={handleResetSettings}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-surface text-brand-muted border border-brand-border rounded-lg text-sm font-medium hover:bg-brand-light transition-colors">
            <RotateCcw size={16} />
            {t('settingsReset')}
          </button>
          {status === 'saved' && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium ml-2">
              <CheckCircle2 size={16} /> {t('settingsSaved')}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-medium ml-2">
              <AlertCircle size={16} /> {t('settingsErrorSaving')}
            </div>
          )}
        </div>
      </section>

      {/* Last updates */}
      <div className="space-y-1">
        {settings.updatedAt && (
          <p className="text-[11px] text-brand-text-tertiary">
            {t('settingsShopUpdated')}: {new Date(settings.updatedAt).toLocaleString(i18n.language)}
          </p>
        )}
      </div>

      </div>)}

      {/* ═══════════════════════════════════════════
          TAB: PROMOCIONES
          ═══════════════════════════════════════════ */}
      {activeSettingsTab === 'promotions' && (<div className="space-y-8">

      {/* ═══════════════════════════════════════════
          SECTION 2: Promo Codes
          ═══════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Ticket size={16} className="text-brand-text-tertiary" />
          {t('promoTitle')}
          <span className="text-xs font-normal text-brand-text-tertiary ml-1">({promoCodes.length})</span>
        </h3>

        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          {/* Add new promo button */}
          {!promoForm && (
            <button
              onClick={() => { setPromoForm({ ...defaultPromoForm }); setEditingPromoId(null); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors mb-4"
            >
              <Plus size={14} />
              {t('promoAdd')}
            </button>
          )}

          {/* Promo form (create/edit) */}
          {promoForm && (
            <div className="bg-brand-light rounded-xl p-4 mb-4 border border-brand-border space-y-3">
              <h4 className="text-sm font-semibold text-brand-dark">
                {editingPromoId ? t('promoEdit') : t('promoAdd')}
              </h4>

              {/* Code */}
              <div>
                <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoCode')}</label>
                <input
                  type="text"
                  value={promoForm.code}
                  onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoType')}</label>
                  <select
                    value={promoForm.discountType}
                    onChange={e => setPromoForm({ ...promoForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  >
                    <option value="percentage">{t('promoTypePercent')}</option>
                    <option value="fixed">{t('promoTypeFixed')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoValue')}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={promoForm.discountType === 'percentage' ? 1 : 0.01}
                      max={promoForm.discountType === 'percentage' ? 100 : undefined}
                      value={promoForm.discountValue}
                      onChange={e => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                    />
                    <span className="text-sm font-bold text-brand-text-tertiary">
                      {promoForm.discountType === 'percentage' ? '%' : settings.currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min purchase + max uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoMinPurchase')}</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-brand-text-tertiary">{settings.currencySymbol}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={promoForm.minPurchase}
                      onChange={e => setPromoForm({ ...promoForm, minPurchase: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-brand-text-tertiary mt-0.5">{t('promoMinPurchaseHint')}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoMaxUses')}</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={promoForm.maxUses}
                    onChange={e => setPromoForm({ ...promoForm, maxUses: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  />
                  <p className="text-[10px] text-brand-text-tertiary mt-0.5">{t('promoMaxUsesHint')}</p>
                </div>

                {/* Max uses per user */}
                <div>
                  <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoMaxUsesPerUser', 'Uso máx. por cuenta')}</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={(promoForm as { maxUsesPerUser?: number }).maxUsesPerUser ?? 0}
                    onChange={e => setPromoForm({ ...promoForm, maxUsesPerUser: parseInt(e.target.value) || 0 } as typeof promoForm)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  />
                  <p className="text-[10px] text-brand-text-tertiary mt-0.5">{t('promoMaxUsesPerUserHint', '0 = ilimitado, 1 = una vez por usuario')}</p>
                </div>
              </div>

              {/* Expiry date */}
              <div>
                <label className="text-[10px] font-semibold text-brand-text-tertiary uppercase tracking-wide block mb-1">{t('promoExpiry')}</label>
                <input
                  type="date"
                  value={promoForm.expiresAt ? promoForm.expiresAt.split('T')[0] : ''}
                  onChange={e => setPromoForm({ ...promoForm, expiresAt: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : null })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                />
                <p className="text-[10px] text-brand-text-tertiary mt-0.5">{t('promoExpiryHint')}</p>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoForm.isActive}
                  onChange={e => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-brand-dark">{t('promoActive')}</span>
              </label>

              {/* Form buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSavePromo}
                  disabled={savingPromo || !promoForm.code.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                >
                  {savingPromo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingPromoId ? t('settingsSave') : t('promoCreate')}
                </button>
                <button
                  onClick={() => { setPromoForm(null); setEditingPromoId(null); }}
                  className="px-4 py-2 bg-brand-surface text-brand-muted border border-brand-border rounded-lg text-sm font-medium hover:bg-brand-light transition-colors"
                >
                  {t('pmCancel')}
                </button>
              </div>
            </div>
          )}

          {/* Promo codes list */}
          <div className="space-y-1">
            {promoCodes.map(promo => (
              <div key={promo.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-light transition-colors group border border-brand-border-subtle">
                {/* Active indicator */}
                <button
                  onClick={() => handleTogglePromoActive(promo)}
                  className={`flex-shrink-0 ${promo.isActive ? 'text-emerald-500' : 'text-brand-text-tertiary'}`}
                  title={promo.isActive ? t('promoActive') : t('promoInactive')}
                >
                  {promo.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>

                {/* Code + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-brand-dark">{promo.code}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-semibold">
                      {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `${settings.currencySymbol}${promo.discountValue}`}
                    </span>
                    {!promo.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-light text-brand-text-tertiary font-medium">{t('promoInactive')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-brand-text-tertiary mt-0.5">
                    {promo.minPurchase > 0 && <span>{t('promoMinLabel')}: {settings.currencySymbol}{promo.minPurchase}</span>}
                    <span>{t('promoUsedLabel')}: {promo.usedCount}{promo.maxUses > 0 ? `/${promo.maxUses}` : ''}</span>
                    {promo.expiresAt && (
                      <span className={new Date(promo.expiresAt) < new Date() ? 'text-red-400' : ''}>
                        {t('promoExpiresLabel')}: {new Date(promo.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    setEditingPromoId(promo.id);
                    setPromoForm({
                      code: promo.code,
                      discountType: promo.discountType,
                      discountValue: promo.discountValue,
                      minPurchase: promo.minPurchase,
                      maxUses: promo.maxUses,
                      maxUsesPerUser: (promo as { maxUsesPerUser?: number }).maxUsesPerUser ?? 0,
                      isActive: promo.isActive,
                      expiresAt: promo.expiresAt,
                    });
                  }}
                  className="p-1 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title={t('settingsEdit')}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDeletePromo(promo.id)}
                  className="p-1 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title={t('settingsDelete')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {promoCodes.length === 0 && !promoForm && (
              <p className="text-sm text-brand-text-tertiary text-center py-4">{t('promoEmpty')}</p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION: Special Offers
          ═══════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Tag size={16} className="text-brand-text-tertiary" />
          {t('settingsOffersTitle')}
          <span className="text-xs font-normal text-brand-text-tertiary ml-1">({offers.length})</span>
        </h3>

        {/* New / Edit Offer Form */}
        {offerForm ? (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5 mb-4 space-y-4">
            <h4 className="text-sm font-bold text-brand-dark">
              {editingOfferId ? t('offerEdit') : t('offerCreate')}
            </h4>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerName')}</label>
              <input
                type="text"
                value={offerForm.name}
                onChange={e => setOfferForm({ ...offerForm, name: e.target.value })}
                placeholder={t('offerNamePlaceholder')}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerType')}</label>
              <select
                value={offerForm.type}
                onChange={e => setOfferForm({ ...offerForm, type: e.target.value as SpecialOfferInput['type'] })}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
              >
                <option value="buy_x_pay_y">{t('offerTypeBuyXPayY')}</option>
                <option value="gift_with_purchase">{t('offerTypeGift')}</option>
                <option value="buy_x_get_extra">{t('offerTypeBuyXGetExtra', 'Compra X y llévate otro por Y€')}</option>
                <option value="first_purchase_discount">{t('offerTypeFirstPurchase', 'Descuento primera compra')}</option>
              </select>
            </div>

            {/* First purchase discount fields */}
            {offerForm.type === 'first_purchase_discount' && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
                  {t('offerFirstPurchaseDesc', 'Este descuento se aplicara automaticamente a los clientes que realicen su primera compra.')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerDiscountType', 'Tipo de descuento')}</label>
                    <select
                      value={offerForm.discountType ?? 'percentage'}
                      onChange={e => setOfferForm({ ...offerForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                    >
                      <option value="percentage">{t('offerDiscountPercentage', 'Porcentaje (%)')}</option>
                      <option value="fixed">{t('offerDiscountFixed', 'Cantidad fija (€)')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerDiscountValue', 'Valor')}</label>
                    <input
                      type="number" min={1} max={offerForm.discountType === 'percentage' ? 100 : 999}
                      value={offerForm.discountValue ?? 10}
                      onChange={e => setOfferForm({ ...offerForm, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-center font-bold"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Type-specific fields */}
            {offerForm.type === 'buy_x_pay_y' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerBuyQty')}</label>
                    <input
                      type="number" min={2} max={20}
                      value={offerForm.buyQuantity ?? 3}
                      onChange={e => setOfferForm({ ...offerForm, buyQuantity: parseInt(e.target.value) || 2 })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerPayQty')}</label>
                    <input
                      type="number" min={1} max={(offerForm.buyQuantity ?? 3) - 1}
                      value={offerForm.payQuantity ?? 2}
                      onChange={e => setOfferForm({ ...offerForm, payQuantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-center font-bold"
                    />
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerScope')}</label>
                  <select
                    value={offerForm.scope ?? 'all'}
                    onChange={e => setOfferForm({ ...offerForm, scope: e.target.value as 'all' | 'category' | 'brand', scopeValue: '' })}
                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                  >
                    <option value="all">{t('offerScopeAll')}</option>
                    <option value="category">{t('offerScopeCategory')}</option>
                    <option value="brand">{t('offerScopeBrand')}</option>
                  </select>
                </div>

                {offerForm.scope === 'category' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerScopeCategory')}</label>
                    <select
                      value={offerForm.scopeValue ?? ''}
                      onChange={e => setOfferForm({ ...offerForm, scopeValue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                    >
                      <option value="">{t('offerSelectCategory')}</option>
                      {catalog.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {offerForm.scope === 'brand' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerScopeBrand')}</label>
                    <select
                      value={offerForm.scopeValue ?? ''}
                      onChange={e => setOfferForm({ ...offerForm, scopeValue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                    >
                      <option value="">{t('offerSelectBrand')}</option>
                      {Object.keys(catalog.brands).sort().map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {offerForm.type === 'gift_with_purchase' && (
              <>
                {/* Trigger product */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerTriggerProduct')}</label>
                  <input
                    type="text"
                    value={offerProductSearch}
                    onChange={e => setOfferProductSearch(e.target.value)}
                    placeholder={t('offerSearchProduct')}
                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm mb-2"
                  />
                  <div className="max-h-32 overflow-y-auto border border-brand-border-subtle rounded-lg">
                    {allProducts
                      .filter(p => !offerProductSearch || p.name.toLowerCase().includes(offerProductSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => setOfferForm({ ...offerForm, triggerProductId: String(p.id) })}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-brand-light ${String(p.id) === offerForm.triggerProductId ? 'bg-brand-primary/10 font-bold' : ''}`}
                        >
                          <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Gift product */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerGiftProduct')}</label>
                  <div className="max-h-32 overflow-y-auto border border-brand-border-subtle rounded-lg">
                    {allProducts
                      .filter(p => String(p.id) !== offerForm.triggerProductId)
                      .filter(p => !offerProductSearch || p.name.toLowerCase().includes(offerProductSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => setOfferForm({ ...offerForm, giftProductId: String(p.id) })}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-brand-light ${String(p.id) === offerForm.giftProductId ? 'bg-green-50 dark:bg-green-900/20 font-bold' : ''}`}
                        >
                          <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}

            {offerForm.type === 'buy_x_get_extra' && (
              <>
                {/* Required quantity */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerRequiredQty', 'Productos requeridos')}</label>
                  <input
                    type="number" min={1} max={20}
                    value={offerForm.requiredQuantity ?? 2}
                    onChange={e => setOfferForm({ ...offerForm, requiredQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-center font-bold"
                  />
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerScope')}</label>
                  <select
                    value={offerForm.scope ?? 'all'}
                    onChange={e => setOfferForm({ ...offerForm, scope: e.target.value as 'all' | 'category' | 'brand', scopeValue: '' })}
                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                  >
                    <option value="all">{t('offerScopeAll')}</option>
                    <option value="category">{t('offerScopeCategory')}</option>
                    <option value="brand">{t('offerScopeBrand')}</option>
                  </select>
                </div>

                {offerForm.scope === 'category' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerScopeCategory')}</label>
                    <select
                      value={offerForm.scopeValue ?? ''}
                      onChange={e => setOfferForm({ ...offerForm, scopeValue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                    >
                      <option value="">{t('offerSelectCategory')}</option>
                      {catalog.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {offerForm.scope === 'brand' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerScopeBrand')}</label>
                    <select
                      value={offerForm.scopeValue ?? ''}
                      onChange={e => setOfferForm({ ...offerForm, scopeValue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
                    >
                      <option value="">{t('offerSelectBrand')}</option>
                      {Object.keys(catalog.brands).sort().map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Extra product */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerExtraProduct', 'Producto extra')}</label>
                  <input
                    type="text"
                    value={offerProductSearch}
                    onChange={e => setOfferProductSearch(e.target.value)}
                    placeholder={t('offerSearchProduct')}
                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm mb-2"
                  />
                  <div className="max-h-32 overflow-y-auto border border-brand-border-subtle rounded-lg">
                    {allProducts
                      .filter(p => !offerProductSearch || p.name.toLowerCase().includes(offerProductSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => setOfferForm({ ...offerForm, extraProductId: String(p.id) })}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-brand-light ${String(p.id) === offerForm.extraProductId ? 'bg-orange-50 dark:bg-orange-900/20 font-bold' : ''}`}
                        >
                          <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="truncate">{p.name}</span>
                          <span className="text-brand-muted ml-auto">{'\u20AC'}{p.price.toFixed(2)}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Extra price */}
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerExtraPrice', 'Precio especial (€)')}</label>
                  <input
                    type="number" min={0} step={0.01}
                    value={offerForm.extraPrice ?? 0}
                    onChange={e => setOfferForm({ ...offerForm, extraPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-center font-bold"
                  />
                </div>
              </>
            )}

            {/* Expiry date */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">{t('offerExpires')}</label>
              <input
                type="date"
                value={offerForm.expiresAt ? new Date(offerForm.expiresAt).toISOString().split('T')[0] : ''}
                onChange={e => setOfferForm({ ...offerForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm"
              />
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={offerForm.isActive}
                onChange={e => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/20"
              />
              <span className="text-xs font-semibold text-brand-dark">{t('offerActive')}</span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveOffer}
                disabled={savingOffer || !offerForm.name.trim()}
                className="flex-1 bg-brand-primary text-white py-2.5 rounded-lg font-bold text-xs hover:bg-brand-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingOffer ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('offerSave')}
              </button>
              <button
                onClick={() => { setOfferForm(null); setEditingOfferId(null); setOfferProductSearch(''); }}
                className="px-4 py-2.5 border border-brand-border rounded-lg text-xs font-semibold text-brand-muted hover:bg-brand-light transition-colors"
              >
                {t('offerCancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOfferForm({ ...newOfferDefaults })}
            className="w-full border-2 border-dashed border-brand-border rounded-xl py-3 text-xs font-semibold text-brand-text-tertiary hover:text-brand-primary hover:border-brand-primary transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <Plus size={14} />
            {t('offerCreate')}
          </button>
        )}

        {/* Offers list */}
        <div className="space-y-2">
          {offers.map(offer => (
            <div key={offer.id} className={`bg-brand-surface rounded-xl border p-4 flex items-center gap-3 ${offer.isActive ? 'border-brand-border' : 'border-brand-border-subtle opacity-60'}`}>
              <button onClick={() => handleToggleOfferActive(offer)} className="flex-shrink-0">
                {offer.isActive
                  ? <ToggleRight size={24} className="text-brand-primary" />
                  : <ToggleLeft size={24} className="text-brand-text-tertiary" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    offer.type === 'buy_x_pay_y' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : offer.type === 'buy_x_get_extra' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : offer.type === 'first_purchase_discount' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {offer.type === 'buy_x_pay_y' ? `${offer.buyQuantity}x${offer.payQuantity}` : offer.type === 'buy_x_get_extra' ? `${offer.requiredQuantity}+1` : offer.type === 'first_purchase_discount' ? `${offer.discountValue}${offer.discountType === 'percentage' ? '%' : '€'}` : t('offerTypeGiftShort')}
                  </span>
                  <span className="text-sm font-bold text-brand-dark truncate">{offer.name}</span>
                </div>
                <div className="text-[11px] text-brand-text-tertiary mt-0.5">
                  {offer.type === 'buy_x_pay_y' && (
                    <span>{offer.scope === 'all' ? t('offerScopeAll') : `${offer.scope}: ${offer.scopeValue}`}</span>
                  )}
                  {offer.type === 'gift_with_purchase' && (
                    <span>{t('offerTypeGift')}</span>
                  )}
                  {offer.type === 'buy_x_get_extra' && (
                    <span>{t('offerExtraPrice', 'Precio especial')}: {'\u20AC'}{(offer.extraPrice ?? 0).toFixed(2)} · {offer.scope === 'all' ? t('offerScopeAll') : `${offer.scope}: ${offer.scopeValue}`}</span>
                  )}
                  {offer.type === 'first_purchase_discount' && (
                    <span>{t('offerFirstPurchaseLabel', '1ª compra')}: {offer.discountValue}{offer.discountType === 'percentage' ? '%' : '€'} {t('offerDiscountLabel', 'descuento')}</span>
                  )}
                  {offer.expiresAt && (
                    <span className="ml-2">· {t('offerExpires')}: {new Date(offer.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingOfferId(offer.id);
                  setOfferForm({
                    name: offer.name,
                    type: offer.type,
                    isActive: offer.isActive,
                    buyQuantity: offer.buyQuantity,
                    payQuantity: offer.payQuantity,
                    scope: offer.scope,
                    scopeValue: offer.scopeValue,
                    triggerProductId: offer.triggerProductId,
                    giftProductId: offer.giftProductId,
                    requiredQuantity: offer.requiredQuantity,
                    extraProductId: offer.extraProductId,
                    extraPrice: offer.extraPrice,
                    discountType: offer.discountType,
                    discountValue: offer.discountValue,
                    expiresAt: offer.expiresAt,
                  });
                }}
                className="p-2 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDeleteOffer(offer.id)}
                className="p-2 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      </div>)}

      {/* ═══════════════════════════════════════════
          TAB: CATÁLOGO
          ═══════════════════════════════════════════ */}
      {activeSettingsTab === 'catalog' && (<div className="space-y-8">

      {/* ═══════════════════════════════════════════
          SECTION 3: Categories
          ═══════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Tag size={16} className="text-brand-text-tertiary" />
          {t('settingsProductCategories')}
          <span className="text-xs font-normal text-brand-text-tertiary ml-1">({catalog.categories.length})</span>
        </h3>

        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          {/* Add category */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder={t('settingsNewCategoryPlaceholder')}
              className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
            <button
              onClick={addCategory}
              disabled={!newCategory.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-40"
            >
              <Plus size={14} />
              {t('settingsAdd')}
            </button>
          </div>

          {/* Category list */}
          <div className="space-y-1">
            {catalog.categories.map((cat, index) => (
              <div key={index} className="flex items-center gap-2 group px-3 py-2 rounded-lg hover:bg-brand-light transition-colors">
                {editingCatIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingCatValue}
                      onChange={e => setEditingCatValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmEditCategory(); if (e.key === 'Escape') setEditingCatIndex(null); }}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-brand-primary rounded text-sm outline-none"
                    />
                    <button onClick={confirmEditCategory} className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded">
                      <CheckCircle2 size={14} />
                    </button>
                    <button onClick={() => setEditingCatIndex(null)} className="p-1 text-brand-text-tertiary hover:bg-brand-light rounded">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Tag size={14} className="text-brand-text-tertiary flex-shrink-0" />
                    <span className="flex-1 text-sm text-brand-dark">{cat}</span>
                    <button
                      onClick={() => startEditCategory(index)}
                      className="p-1 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title={t('settingsEdit')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeCategory(index)}
                      className="p-1 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title={t('settingsDelete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {catalog.categories.length === 0 && (
              <p className="text-sm text-brand-text-tertiary text-center py-4">{t('settingsNoCategories')}</p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: Brands & Models
          ═══════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Smartphone size={16} className="text-brand-text-tertiary" />
          {t('settingsBrandsAndModels')}
          <span className="text-xs font-normal text-brand-text-tertiary ml-1">({brandEntries.length} {t('settingsBrandsCount')})</span>
        </h3>

        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          {/* Add brand */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newBrand}
              onChange={e => setNewBrand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBrand()}
              placeholder={t('settingsNewBrandPlaceholder')}
              className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
            <button
              onClick={addBrand}
              disabled={!newBrand.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-40"
            >
              <Plus size={14} />
              {t('settingsAdd')}
            </button>
          </div>

          {/* Brands list */}
          <div className="space-y-1">
            {brandEntries.map(([brand, models]) => (
              <div key={brand} className="border border-brand-border-subtle rounded-lg overflow-hidden">
                {/* Brand header */}
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-brand-light transition-colors group">
                  <button
                    onClick={() => setExpandedBrand(expandedBrand === brand ? null : brand)}
                    className="p-0.5 text-brand-text-tertiary"
                  >
                    {expandedBrand === brand ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {editingBrand === brand ? (
                    <>
                      <input
                        type="text"
                        value={editingBrandValue}
                        onChange={e => setEditingBrandValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEditBrand(); if (e.key === 'Escape') setEditingBrand(null); }}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-brand-primary rounded text-sm outline-none"
                      />
                      <button onClick={confirmEditBrand} className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded">
                        <CheckCircle2 size={14} />
                      </button>
                      <button onClick={() => setEditingBrand(null)} className="p-1 text-brand-text-tertiary hover:bg-brand-light rounded">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-brand-dark">{brand}</span>
                      <span className="text-[11px] text-brand-text-tertiary mr-1">{models.length} {t('settingsModelsCount')}</span>
                      <button
                        onClick={() => startEditBrand(brand)}
                        className="p-1 text-brand-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title={t('settingsRename')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => removeBrand(brand)}
                        className="p-1 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title={t('settingsDeleteBrand')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>

                {/* Models (expanded) */}
                {expandedBrand === brand && (
                  <div className="px-3 pb-3 pt-1 bg-brand-light/50 border-t border-brand-border-subtle">
                    {/* Add model */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newModel}
                        onChange={e => setNewModel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addModel(brand)}
                        placeholder={t('settingsNewModelPlaceholder', { brand })}
                        className="flex-1 px-2.5 py-1.5 border border-brand-border rounded text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface"
                      />
                      <button
                        onClick={() => addModel(brand)}
                        disabled={!newModel.trim()}
                        className="px-3 py-1.5 bg-brand-primary text-white rounded text-xs font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Model list */}
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {models.map((model, mi) => (
                        <div key={mi} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-brand-surface transition-colors group/model">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-text-tertiary flex-shrink-0" />
                          <span className="flex-1 text-xs text-brand-muted">{model}</span>
                          <button
                            onClick={() => removeModel(brand, mi)}
                            className="p-0.5 text-brand-text-tertiary hover:text-red-500 dark:hover:text-red-400 rounded opacity-0 group-hover/model:opacity-100 transition-all"
                            title={t('settingsDeleteModel')}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {models.length === 0 && (
                        <p className="text-xs text-brand-text-tertiary text-center py-2">{t('settingsNoModels')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {brandEntries.length === 0 && (
              <p className="text-sm text-brand-text-tertiary text-center py-4">{t('settingsNoBrands')}</p>
            )}
          </div>
        </div>
      </section>

      {/* Save Catalog */}
      <div className="flex items-center gap-3">
        <button onClick={handleSaveCatalog} disabled={savingCatalog}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50">
          {savingCatalog ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {savingCatalog ? t('settingsSaving') : t('settingsSaveCatalog')}
        </button>
        <button onClick={handleResetCatalog}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-surface text-brand-muted border border-brand-border rounded-lg text-sm font-medium hover:bg-brand-light transition-colors">
          <RotateCcw size={16} />
          {t('settingsReset')}
        </button>
        {catalogStatus === 'saved' && (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium ml-2">
            <CheckCircle2 size={16} /> {t('settingsCatalogSaved')}
          </div>
        )}
        {catalogStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-medium ml-2">
            <AlertCircle size={16} /> {t('settingsErrorSaving')}
          </div>
        )}
      </div>

      {/* Last update */}
      {catalog.updatedAt && (
        <p className="text-[11px] text-brand-text-tertiary">
          {t('settingsCatalogUpdated')}: {new Date(catalog.updatedAt).toLocaleString(i18n.language)}
        </p>
      )}

      </div>)}
    </div>
  );
};

export default ShopSettingsManager;
