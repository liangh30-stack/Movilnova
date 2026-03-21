import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Loader2,
  Mail,
  Package,
  Truck,
  Wallet,
} from 'lucide-react';
import { ShopSettings } from '../services/storeConfigService';
import { PromoCode } from '../services/promoCodeService';
import { AppliedOffer, GiftSuggestion } from '../services/offerService';
import { CustomerAddress, Product } from '../types';
import { CheckoutSection, ShippingInfo } from '../hooks/useCheckout';
import { createPaymentIntent } from '../services/paymentService';
import OrderSummary from './checkout/OrderSummary';
import TrustBadges from './checkout/TrustBadges';
import StripePaymentForm from './checkout/StripePaymentForm';
import { ErrorBoundary } from './ErrorBoundary';

interface CartItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedModel?: string;
  selectedColor?: string;
}

interface CheckoutPageProps {
  // Cart
  cart: CartItem[];
  updateCartQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  // Checkout state
  activeSection: CheckoutSection;
  setActiveSection: (s: CheckoutSection) => void;
  completedSections: Set<CheckoutSection>;
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo | ((prev: ShippingInfo) => ShippingInfo)) => void;
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  acceptPrivacy: boolean;
  setAcceptPrivacy: (v: boolean) => void;
  formErrors: Record<string, string>;
  // Section actions
  completeContact: () => boolean;
  completeShipping: () => boolean;
  fillFromAddress: (addr: CustomerAddress) => void;
  // Order
  handlePlaceOrder: (method: 'Stripe', paymentId: string) => void;
  lastOrderNumber: string;
  orderSuccess: boolean;
  orderError: string | null;
  isPlacingOrder: boolean;
  resetCheckout: () => void;
  // Prices
  subtotal: number;
  shippingCost: number;
  isFreeShipping: boolean;
  tax: number;
  total: number;
  discount: number;
  amountToFreeShipping: number;
  // Config
  shopSettings: ShopSettings;
  // Customer
  customer: { uid: string; displayName: string; email: string; phone?: string } | null;
  customerAddresses: CustomerAddress[];
  onSignInClick: () => void;
  onBack: () => void;
  // Promo code
  appliedPromo: PromoCode | null;
  promoError: string;
  isValidatingPromo: boolean;
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => void;
  // Special offers
  appliedOfferDetails?: AppliedOffer[];
  giftSuggestions?: GiftSuggestion[];
  products?: Product[];
  onAddToCart?: (product: Product) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  updateCartQuantity,
  removeFromCart,
  activeSection,
  setActiveSection,
  completedSections,
  shippingInfo,
  setShippingInfo,
  acceptTerms,
  setAcceptTerms,
  acceptPrivacy,
  setAcceptPrivacy,
  formErrors,
  completeContact,
  completeShipping,
  fillFromAddress,
  handlePlaceOrder,
  lastOrderNumber,
  orderSuccess,
  orderError,
  isPlacingOrder,
  resetCheckout,
  subtotal,
  shippingCost,
  isFreeShipping,
  tax,
  discount,
  total,
  amountToFreeShipping,
  shopSettings,
  customer,
  customerAddresses,
  onSignInClick,
  onBack,
  appliedPromo,
  promoError,
  isValidatingPromo,
  applyPromoCode,
  removePromoCode,
  appliedOfferDetails = [],
  giftSuggestions = [],
  products = [],
  onAddToCart,
}) => {
  const { t } = useTranslation();

  // Estimated delivery date (3-5 business days from now)
  const estimatedDelivery = useMemo(() => {
    const date = new Date();
    let businessDays = 0;
    while (businessDays < 4) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) businessDays++;
    }
    return date;
  }, []);

  // Gift products info for suggestions
  const giftProducts = useMemo(() => {
    return giftSuggestions
      .map(s => products.find(p => String(p.id) === s.giftProductId))
      .filter((p): p is Product => !!p)
      .map(p => ({ id: p.id, name: p.name, image: p.image, price: p.price }));
  }, [giftSuggestions, products]);

  const handleAddGift = (productId: string) => {
    const product = products.find(p => String(p.id) === productId);
    if (product && onAddToCart) onAddToCart(product);
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ==================== SUCCESS SCREEN ====================
  if (orderSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-brand-dark">{t('checkoutThankYou')}</h2>
          <p className="text-brand-muted">{t('checkoutConfirmationMsg')}</p>

          {lastOrderNumber && (
            <div className="bg-brand-light border border-brand-border rounded-xl p-4">
              <p className="text-xs text-brand-muted uppercase tracking-wider mb-1">{t('checkoutOrderNumber')}</p>
              <p className="text-lg font-mono font-bold text-brand-primary">{lastOrderNumber}</p>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-xs text-amber-800 dark:text-amber-400">{t('checkoutPendingNote')}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-brand-muted">
            <Mail size={14} />
            <span>{t('checkoutEmailConfirmation')}</span>
          </div>

          <button
            onClick={() => { resetCheckout(); onBack(); }}
            className="w-full bg-brand-emphasis text-white py-4 rounded-xl font-bold hover:bg-opacity-90 transition-colors"
          >
            {t('cartBackToShop')}
          </button>
        </div>
      </div>
    );
  }

  // ==================== SECTION HEADER COMPONENT ====================
  const SectionHeader: React.FC<{
    section: CheckoutSection;
    icon: React.ReactNode;
    title: string;
    summary?: string;
    stepNumber: number;
  }> = ({ section, icon, title, summary, stepNumber }) => {
    const isActive = activeSection === section;
    const isCompleted = completedSections.has(section);

    return (
      <button
        onClick={() => {
          if (isCompleted || isActive) setActiveSection(section);
        }}
        className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
          isActive ? 'bg-brand-surface' : isCompleted ? 'bg-brand-light hover:bg-brand-surface cursor-pointer' : 'bg-brand-light opacity-60 cursor-default'
        }`}
        disabled={!isCompleted && !isActive}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : isActive ? 'bg-brand-primary text-white' : 'bg-brand-border text-brand-muted'
        }`}>
          {isCompleted ? <CheckCircle2 size={18} /> : <span className="text-sm font-bold">{stepNumber}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <span className={`font-semibold ${isActive ? 'text-brand-dark' : 'text-brand-muted'}`}>{title}</span>
          </div>
          {isCompleted && !isActive && summary && (
            <p className="text-xs text-brand-muted mt-0.5 truncate">{summary}</p>
          )}
        </div>
        {isCompleted && !isActive && <ChevronDown size={18} className="text-brand-muted" />}
      </button>
    );
  };

  // ==================== MAIN CHECKOUT ====================
  return (
    <div className="min-h-[80vh] bg-brand-light">
      {/* Header */}
      <div className="bg-brand-surface border-b border-brand-border sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-dark transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">{t('checkoutBackToStore')}</span>
          </button>
          <h1 className="text-lg font-bold text-brand-dark">{t('checkoutTitle')}</h1>
          <div className="w-20" />
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-brand-border">
          <div
            className="h-full bg-brand-primary transition-all duration-500"
            style={{
              width: activeSection === 'contact' ? '33%' : activeSection === 'shipping' ? '66%' : '100%',
            }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Form */}
          <div className="flex-1 space-y-3">
            {/* Mobile order summary */}
            <div className="lg:hidden">
              <OrderSummary
                cart={cart}
                subtotal={subtotal}
                shippingCost={shippingCost}
                isFreeShipping={isFreeShipping}
                tax={tax}
                total={total}
                discount={discount}
                amountToFreeShipping={amountToFreeShipping}
                shopSettings={shopSettings}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                isMobile
                appliedPromo={appliedPromo}
                promoError={promoError}
                isValidatingPromo={isValidatingPromo}
                applyPromoCode={applyPromoCode}
                removePromoCode={removePromoCode}
                appliedOfferDetails={appliedOfferDetails}
                giftSuggestions={giftSuggestions}
                giftProducts={giftProducts}
                onAddGift={handleAddGift}
              />
            </div>

            {/* ====== SECTION 1: CONTACT ====== */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
              <SectionHeader
                section="contact"
                icon={<Mail size={16} />}
                title={t('checkoutContact')}
                summary={shippingInfo.email}
                stepNumber={1}
              />

              {activeSection === 'contact' && (
                <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {!customer && (
                    <div className="bg-brand-light rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs text-brand-muted">{t('checkoutHaveAccount')}</span>
                      <button
                        onClick={onSignInClick}
                        className="text-xs font-bold text-brand-primary hover:text-brand-primary-dark transition-colors"
                      >
                        {t('customerLogin')}
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutEmail')}</label>
                    <input
                      type="email"
                      value={shippingInfo.email}
                      onChange={e => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                        formErrors.email ? 'border-brand-critical' : 'border-brand-border'
                      }`}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                    {formErrors.email && (
                      <p className="text-brand-critical text-xs mt-1">{t(`checkoutError_${formErrors.email}`)}</p>
                    )}
                  </div>

                  <button
                    onClick={completeContact}
                    className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary-dark transition-colors"
                  >
                    {t('checkoutContinueShipping')}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* ====== SECTION 2: SHIPPING ====== */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
              <SectionHeader
                section="shipping"
                icon={<Truck size={16} />}
                title={t('checkoutShippingDetails')}
                summary={shippingInfo.street ? `${shippingInfo.street}, ${shippingInfo.city}` : ''}
                stepNumber={2}
              />

              {activeSection === 'shipping' && (
                <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Saved addresses */}
                  {customer && customerAddresses.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                        {t('checkoutSavedAddresses')}
                      </label>
                      <div className="grid gap-2 mt-1">
                        {customerAddresses.map(addr => (
                          <button
                            key={addr.id}
                            onClick={() => fillFromAddress(addr)}
                            className="text-left p-3 border border-brand-border rounded-xl hover:border-brand-primary hover:bg-brand-light transition-all text-xs"
                          >
                            <span className="font-semibold text-brand-dark">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="ml-2 text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-md font-bold">
                                {t('accountDefaultBadge')}
                              </span>
                            )}
                            <p className="text-brand-muted mt-0.5">{addr.street}, {addr.postalCode} {addr.city}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Name + Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutFullName')}</label>
                      <input
                        type="text"
                        value={shippingInfo.fullName}
                        onChange={e => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                        className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                          formErrors.fullName ? 'border-brand-critical' : 'border-brand-border'
                        }`}
                        placeholder={t('checkoutFullNamePlaceholder')}
                        autoComplete="name"
                      />
                      {formErrors.fullName && <p className="text-brand-critical text-xs mt-1">{t('checkoutError_required')}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutPhone')}</label>
                      <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={e => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                          formErrors.phone ? 'border-brand-critical' : 'border-brand-border'
                        }`}
                        placeholder="+34 612 345 678"
                        autoComplete="tel"
                      />
                      {formErrors.phone && <p className="text-brand-critical text-xs mt-1">{t('checkoutError_required')}</p>}
                    </div>
                  </div>

                  {/* Street */}
                  <div>
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutStreet')}</label>
                    <input
                      type="text"
                      value={shippingInfo.street}
                      onChange={e => setShippingInfo(prev => ({ ...prev, street: e.target.value }))}
                      className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                        formErrors.street ? 'border-brand-critical' : 'border-brand-border'
                      }`}
                      placeholder={t('checkoutStreetPlaceholder')}
                      autoComplete="street-address"
                    />
                    {formErrors.street && <p className="text-brand-critical text-xs mt-1">{t('checkoutError_required')}</p>}
                  </div>

                  {/* City + Postal Code + Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutCity')}</label>
                      <input
                        type="text"
                        value={shippingInfo.city}
                        onChange={e => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                          formErrors.city ? 'border-brand-critical' : 'border-brand-border'
                        }`}
                        autoComplete="address-level2"
                      />
                      {formErrors.city && <p className="text-brand-critical text-xs mt-1">{t('checkoutError_required')}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutPostalCode')}</label>
                      <input
                        type="text"
                        value={shippingInfo.postalCode}
                        onChange={e => setShippingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                        className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                          formErrors.postalCode ? 'border-brand-critical' : 'border-brand-border'
                        }`}
                        inputMode="numeric"
                        autoComplete="postal-code"
                      />
                      {formErrors.postalCode && <p className="text-brand-critical text-xs mt-1">{t('checkoutError_required')}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{t('checkoutCountry')}</label>
                      <input
                        type="text"
                        value={shippingInfo.country}
                        onChange={e => setShippingInfo(prev => ({ ...prev, country: e.target.value }))}
                        className={`w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all text-sm ${
                          formErrors.country ? 'border-brand-critical' : 'border-brand-border'
                        }`}
                        autoComplete="country-name"
                      />
                      {formErrors.country && <p className="text-brand-critical text-xs mt-1">{t('checkoutError_required')}</p>}
                    </div>
                  </div>

                  {/* Delivery estimate */}
                  <div className="bg-brand-light rounded-xl p-3 flex items-center gap-3">
                    <Package size={18} className="text-brand-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-brand-dark">{t('checkoutEstimatedDelivery')}</p>
                      <p className="text-xs text-brand-muted">
                        {estimatedDelivery.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Legal checkboxes */}
                  <div className="space-y-2.5 pt-2 border-t border-brand-border">
                    <label className="flex items-start gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={e => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-brand-border text-brand-primary focus:ring-brand-primary/20 flex-shrink-0"
                      />
                      <span className={`text-xs leading-relaxed ${formErrors.terms ? 'text-brand-critical' : 'text-brand-muted'}`}>
                        {t('checkoutAcceptTerms')} *
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={e => setAcceptPrivacy(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-brand-border text-brand-primary focus:ring-brand-primary/20 flex-shrink-0"
                      />
                      <span className={`text-xs leading-relaxed ${formErrors.privacy ? 'text-brand-critical' : 'text-brand-muted'}`}>
                        {t('checkoutAcceptPrivacy')} *
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={completeShipping}
                    className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary-dark transition-colors"
                  >
                    {t('checkoutContinuePayment')}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* ====== SECTION 3: PAYMENT ====== */}
            <ErrorBoundary>
            <PaymentSection
              activeSection={activeSection}
              completedSections={completedSections}
              setActiveSection={setActiveSection}
              shippingInfo={shippingInfo}
              formErrors={formErrors}
              orderError={orderError}
              cart={cart}
              appliedPromo={appliedPromo}
              discount={discount}
              shopSettings={shopSettings}
              total={total}
              isPlacingOrder={isPlacingOrder}
              handlePlaceOrder={handlePlaceOrder}
              t={t}
              SectionHeader={SectionHeader}
            />
            </ErrorBoundary>
          </div>

          {/* Right column - Desktop order summary (sticky) */}
          <div className="hidden lg:block w-96 flex-shrink-0">
            <div className="sticky top-36">
              <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
                <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                  <Package size={18} className="text-brand-primary" />
                  {t('checkoutOrderSummary')}
                </h3>
                <OrderSummary
                  cart={cart}
                  subtotal={subtotal}
                  shippingCost={shippingCost}
                  isFreeShipping={isFreeShipping}
                  tax={tax}
                  total={total}
                  discount={discount}
                  amountToFreeShipping={amountToFreeShipping}
                  shopSettings={shopSettings}
                  updateCartQuantity={updateCartQuantity}
                  removeFromCart={removeFromCart}
                  appliedPromo={appliedPromo}
                  promoError={promoError}
                  isValidatingPromo={isValidatingPromo}
                  applyPromoCode={applyPromoCode}
                  removePromoCode={removePromoCode}
                  appliedOfferDetails={appliedOfferDetails}
                  giftSuggestions={giftSuggestions}
                  giftProducts={giftProducts}
                  onAddGift={handleAddGift}
                />
              </div>
              <TrustBadges />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// ==================== PAYMENT SECTION (extracted for state management) ====================
const PaymentSection: React.FC<{
  activeSection: CheckoutSection;
  completedSections: Set<CheckoutSection>;
  setActiveSection: (s: CheckoutSection) => void;
  shippingInfo: ShippingInfo;
  formErrors: Record<string, string>;
  orderError: string | null;
  cart: Array<{ id: string | number; quantity: number }>;
  appliedPromo: PromoCode | null;
  discount: number;
  shopSettings: ShopSettings;
  total: number;
  isPlacingOrder: boolean;
  handlePlaceOrder: (method: 'Stripe', paymentId: string) => void;
  t: (key: string) => string;
  SectionHeader: React.FC<{
    section: CheckoutSection;
    icon: React.ReactNode;
    title: string;
    summary?: string;
    stepNumber: number;
  }>;
}> = ({
  activeSection,
  shippingInfo,
  formErrors,
  orderError,
  cart,
  appliedPromo,
  discount,
  shopSettings,
  total,
  isPlacingOrder,
  handlePlaceOrder,
  t,
  SectionHeader,
}) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Create PaymentIntent when entering payment section.
  // The Cloud Function fetches product prices from Firestore and validates
  // the total server-side — we only send product IDs, quantities, and the
  // promo code, never a client-calculated amount.
  useEffect(() => {
    if (activeSection === 'payment' && !stripeClientSecret && !stripeLoading) {
      setStripeLoading(true);
      setPaymentError(null);
      createPaymentIntent(
        cart.map(i => ({ productId: i.id, quantity: i.quantity })),
        appliedPromo?.code,
        'eur'
      )
        .then(({ clientSecret }) => {
          setStripeClientSecret(clientSecret);
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.error('Failed to create PaymentIntent:', err);
          setPaymentError(t('paymentErrorNetwork'));
        })
        .finally(() => setStripeLoading(false));
    }
  }, [activeSection, total]);

  const handleStripeSuccess = (paymentId: string) => {
    handlePlaceOrder('Stripe', paymentId);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
      <SectionHeader
        section="payment"
        icon={<Wallet size={16} />}
        title={t('checkoutPayment')}
        summary=""
        stepNumber={3}
      />

      {activeSection === 'payment' && (
        <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Order/Payment errors */}
          {(formErrors.order || orderError || paymentError) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
              {orderError || paymentError || t('checkoutOrderError')}
            </div>
          )}

          {/* Payment summary */}
          <div className="bg-brand-light rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">{t('checkoutShipTo')}</span>
              <span className="text-brand-dark font-medium text-right text-xs">{shippingInfo.street}, {shippingInfo.city}</span>
            </div>
            {appliedPromo && discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span className="font-medium">{t('promoDiscount')} ({appliedPromo.code})</span>
                <span className="font-semibold">-{shopSettings.currencySymbol}{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-brand-border pt-2">
              <span className="font-bold text-brand-dark">{t('checkoutTotal')}</span>
              <span className="font-black text-brand-primary text-lg">{shopSettings.currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment form — Stripe */}
          <div className="min-h-[200px]">
            {stripeLoading ? (
              <div className="flex items-center justify-center py-10 text-brand-muted">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-sm">{t('paymentStripeLoading')}</span>
              </div>
            ) : stripeClientSecret ? (
              <StripePaymentForm
                clientSecret={stripeClientSecret}
                total={total}
                currencySymbol={shopSettings.currencySymbol}
                onPaymentSuccess={handleStripeSuccess}
                onPaymentError={handlePaymentError}
              />
            ) : (
              <div className="flex items-center justify-center py-10 text-brand-muted">
                <span className="text-sm">{paymentError || t('paymentErrorNetwork')}</span>
              </div>
            )}
          </div>

          {isPlacingOrder && (
            <div className="flex items-center justify-center py-3 text-brand-muted">
              <Loader2 size={16} className="animate-spin mr-2" />
              <span className="text-sm">{t('paymentProcessing')}</span>
            </div>
          )}

          <TrustBadges />
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
