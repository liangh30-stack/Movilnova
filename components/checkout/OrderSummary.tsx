import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Minus, Plus, Trash2, Truck, Ticket, X, Loader2, Gift, Tag } from 'lucide-react';
import { ShopSettings } from '../../services/storeConfigService';
import { PromoCode } from '../../services/promoCodeService';
import { AppliedOffer, GiftSuggestion } from '../../services/offerService';

interface CartItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedModel?: string;
  selectedColor?: string;
}

interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  shippingCost: number;
  isFreeShipping: boolean;
  tax: number;
  total: number;
  discount: number;
  amountToFreeShipping: number;
  shopSettings: ShopSettings;
  updateCartQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  isMobile?: boolean;
  appliedPromo: PromoCode | null;
  promoError: string;
  isValidatingPromo: boolean;
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => void;
  appliedOfferDetails?: AppliedOffer[];
  giftSuggestions?: GiftSuggestion[];
  giftProducts?: Array<{ id: string | number; name: string; image: string; price: number }>;
  onAddGift?: (productId: string) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cart,
  subtotal,
  shippingCost,
  isFreeShipping,
  tax,
  total,
  discount,
  amountToFreeShipping,
  shopSettings,
  updateCartQuantity,
  removeFromCart,
  isMobile = false,
  appliedPromo,
  promoError,
  isValidatingPromo,
  applyPromoCode,
  removePromoCode,
  appliedOfferDetails = [],
  giftSuggestions = [],
  giftProducts = [],
  onAddGift,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [promoInput, setPromoInput] = useState('');
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    await applyPromoCode(promoInput);
    if (!promoError) setPromoInput('');
  };

  return (
    <div className={isMobile ? 'bg-brand-surface border border-brand-border rounded-2xl overflow-hidden' : ''}>
      {/* Mobile toggle header */}
      {isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="text-sm font-semibold text-brand-dark flex items-center gap-2">
            {t('checkoutOrderSummary')}
            <span className="bg-brand-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-brand-dark">{shopSettings.currencySymbol}{total.toFixed(2)}</span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>
      )}

      {(!isMobile || isExpanded) && (
        <div className={isMobile ? 'px-4 pb-4 border-t border-brand-border' : ''}>
          {/* Cart items */}
          <div className="space-y-3 mb-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-3 py-3 border-b border-brand-border/50 last:border-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-light flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-dark truncate">{item.name}</p>
                  {item.selectedModel && (
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">
                      {item.selectedColor && (
                        <span
                          className="w-3 h-3 rounded-full inline-block mr-1 align-middle border border-brand-border/50"
                          style={{ backgroundColor: item.selectedColor }}
                        />
                      )}
                      {item.selectedModel}
                    </p>
                  )}
                  {!item.selectedModel && item.selectedColor && (
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">
                      <span
                        className="w-3 h-3 rounded-full inline-block mr-1 align-middle border border-brand-border/50"
                        style={{ backgroundColor: item.selectedColor }}
                      />
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(idx, -1)}
                        className="w-6 h-6 rounded-md border border-brand-border flex items-center justify-center hover:bg-brand-light transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(idx, 1)}
                        className="w-6 h-6 rounded-md border border-brand-border flex items-center justify-center hover:bg-brand-light transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="ml-1 w-6 h-6 rounded-md flex items-center justify-center text-brand-muted hover:text-brand-critical transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-brand-dark">
                      {shopSettings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo code input */}
          <div className="mb-4">
            {appliedPromo ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Ticket size={14} className="text-green-600 dark:text-green-400" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-400 font-mono">{appliedPromo.code}</span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    (-{appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}%` : `${shopSettings.currencySymbol}${appliedPromo.discountValue}`})
                  </span>
                </div>
                <button
                  onClick={removePromoCode}
                  className="p-1 text-green-600 dark:text-green-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                  aria-label={t('promoRemove')}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                      placeholder={t('promoPlaceholder')}
                      className="w-full pl-9 pr-3 py-2.5 border border-brand-border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoInput.trim()}
                    className="px-4 py-2.5 bg-brand-emphasis text-white rounded-xl text-xs font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  >
                    {isValidatingPromo ? <Loader2 size={14} className="animate-spin" /> : t('promoApply')}
                  </button>
                </div>
                {promoError && (
                  <p className="text-brand-critical text-xs mt-1.5 pl-1">{t(promoError)}</p>
                )}
              </div>
            )}
          </div>

          {/* Applied offers */}
          {appliedOfferDetails.length > 0 && (
            <div className="mb-4 space-y-2">
              {appliedOfferDetails.map((offer, idx) => (
                <div key={idx} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-purple-600" />
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">{offer.offerName}</span>
                  </div>
                  <span className="text-xs font-bold text-purple-600">-{shopSettings.currencySymbol}{offer.discount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gift suggestions */}
          {giftSuggestions.length > 0 && onAddGift && (
            <div className="mb-4 space-y-2">
              {giftSuggestions.map((suggestion, idx) => {
                const giftProduct = giftProducts.find(p => String(p.id) === suggestion.giftProductId);
                if (!giftProduct) return null;
                return (
                  <div key={idx} className={`flex items-center gap-3 ${suggestion.extraPrice != null ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'} rounded-xl px-3 py-2.5`}>
                    <Gift size={14} className={suggestion.extraPrice != null ? 'text-orange-600 dark:text-orange-400 flex-shrink-0' : 'text-green-600 dark:text-green-400 flex-shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${suggestion.extraPrice != null ? 'text-orange-700 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>{suggestion.offerName}</p>
                      <p className={`text-[10px] ${suggestion.extraPrice != null ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        {suggestion.extraPrice != null
                          ? t('checkoutAddExtraFor', { product: giftProduct.name, price: `${shopSettings.currencySymbol}${suggestion.extraPrice.toFixed(2)}` })
                          : t('checkoutAddGiftFree', { product: giftProduct.name })}
                      </p>
                    </div>
                    <button
                      onClick={() => onAddGift(suggestion.giftProductId)}
                      className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 ${suggestion.extraPrice != null ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {suggestion.extraPrice != null ? `${shopSettings.currencySymbol}${suggestion.extraPrice.toFixed(2)}` : t('checkoutAddFree')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Free shipping progress bar */}
          {!isFreeShipping && (
            <div className="bg-brand-light rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
                <Truck size={14} className="text-brand-primary" />
                <span>
                  {t('checkoutFreeShippingAway', {
                    amount: `${shopSettings.currencySymbol}${amountToFreeShipping.toFixed(2)}`,
                  })}
                </span>
              </div>
              <div className="w-full bg-brand-border rounded-full h-1.5">
                <div
                  className="bg-brand-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / shopSettings.freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {isFreeShipping && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Truck size={14} className="text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-700 dark:text-green-400 font-semibold">{t('checkoutFreeShippingUnlocked')}</span>
            </div>
          )}

          {/* Price breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-brand-muted">
              <span>{t('cartSubtotal', 'Subtotal')}</span>
              <span>{shopSettings.currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span className="font-medium">{t('checkoutTotalDiscount')}</span>
                <span className="font-semibold">-{shopSettings.currencySymbol}{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-muted">
              <span>{t('checkoutShipping')}</span>
              <span className={isFreeShipping ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                {isFreeShipping ? t('checkoutFree') : `${shopSettings.currencySymbol}${shippingCost.toFixed(2)}`}
              </span>
            </div>
            {shopSettings.showIva !== false && (
              <div className="flex justify-between text-brand-muted">
                <span>{t('cartTaxIncluded', 'IVA incluido')} ({(shopSettings.ivaRate * 100).toFixed(0)}%)</span>
                <span>{shopSettings.currencySymbol}{tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-brand-border">
              <span className="text-base font-bold text-brand-dark">{t('checkoutTotal')}</span>
              <span className="text-lg font-black text-brand-primary">{shopSettings.currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OrderSummary);
