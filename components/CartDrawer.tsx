import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Truck, Ban } from 'lucide-react';
import { ShopSettings, DEFAULT_SHOP_SETTINGS } from '../services/storeConfigService';

interface CartItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedModel?: string;
  selectedColor?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  onClose: () => void;
  updateCartQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  customer: { displayName: string; email: string } | null;
  onSignInClick: () => void;
  onCheckout: () => void;
  shopSettings?: ShopSettings;
  products?: Array<{ id: string | number; stock?: number }>;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  cartTotal,
  cartItemCount,
  onClose,
  updateCartQuantity,
  removeFromCart,
  customer,
  onSignInClick,
  onCheckout,
  shopSettings = DEFAULT_SHOP_SETTINGS,
  products = [],
}) => {
  const { t } = useTranslation();

  // Restore focus to the previously focused element when the drawer unmounts
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  if (!isOpen) return null;

  const freeShippingThreshold = shopSettings.freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const isFreeShipping = cartTotal >= freeShippingThreshold;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-brand-surface z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-label={t('cartTitle')}
      >
        {/* Header */}
        <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-light">
          <h3 className="text-lg font-bold flex items-center gap-2 text-brand-dark">
            <ShoppingBag size={22} className="text-brand-primary" />
            {t('cartTitle')}
            {cartItemCount > 0 && (
              <span className="bg-brand-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-border rounded-lg transition-colors"
            aria-label={t('ariaClose')}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {!customer && cart.length > 0 && (
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-brand-dark">{t('cartSignInToSave')}</span>
              <button
                onClick={onSignInClick}
                className="text-xs font-bold text-brand-primary hover:text-brand-primary-dark transition-colors"
              >
                {t('customerLogin')}
              </button>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag size={48} className="mx-auto mb-4 text-brand-muted opacity-30" />
              <p className="text-brand-muted font-semibold">{t('cartEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => {
                const productData = products.find(p => String(p.id) === String(item.id));
                const isOutOfStock = productData?.stock !== undefined && productData.stock <= 0;
                return (
                <div key={idx} className={`flex gap-3 p-3 bg-brand-surface rounded-xl border shadow-sm transition-shadow ${isOutOfStock ? 'border-red-200 dark:border-red-800 opacity-60' : 'border-brand-border hover:shadow-md'}`}>
                  <div className="relative flex-shrink-0">
                    <img src={item.image} loading="lazy" decoding="async" width={64} height={64} className={`w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl ${isOutOfStock ? 'grayscale-[50%]' : ''}`} alt={item.name} />
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                        <Ban size={18} className="text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-brand-dark truncate">{item.name}</div>
                    {(item.selectedModel || item.selectedColor) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-brand-muted font-bold uppercase tracking-wider">
                        {item.selectedColor && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-brand-border flex-shrink-0"
                            style={{ backgroundColor: item.selectedColor }}
                          />
                        )}
                        {item.selectedModel}
                      </div>
                    )}
                    {isOutOfStock ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Ban size={12} className="text-brand-critical" />
                        <span className="text-xs font-semibold text-brand-critical">{t('outOfStock')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-brand-primary font-bold text-sm mt-0.5">
                          {shopSettings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartQuantity(idx, -1)}
                            className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center hover:bg-brand-light active:bg-brand-border transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(idx, 1)}
                            disabled={(() => { const p = products.find(p => p.id === item.id); return p?.stock !== undefined && item.quantity >= p.stock; })()}
                            className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center hover:bg-brand-light active:bg-brand-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => removeFromCart(idx)} className="self-start p-2 -mr-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:bg-red-900/30 dark:active:bg-red-900/30 transition-colors">
                    <Trash2 size={16} className="text-brand-muted hover:text-brand-critical transition-colors" />
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with total and checkout button */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-brand-border space-y-3">
            {/* Free shipping progress */}
            {!isFreeShipping && (
              <div className="bg-brand-light rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs text-brand-muted mb-1.5">
                  <Truck size={14} className="text-brand-primary" />
                  <span>{t('checkoutFreeShippingAway', { amount: `${shopSettings.currencySymbol}${amountToFreeShipping.toFixed(2)}` })}</span>
                </div>
                <div className="w-full bg-brand-border rounded-full h-1.5">
                  <div
                    className="bg-brand-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {isFreeShipping && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5 flex items-center gap-2">
                <Truck size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-400 font-semibold">{t('checkoutFreeShippingUnlocked')}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-black text-brand-dark">
              <span>{t('cartSubtotal', 'Subtotal')}</span>
              <span>{shopSettings.currencySymbol}{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              {t('checkoutProceed')}
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
