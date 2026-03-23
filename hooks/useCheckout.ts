import { useState, useCallback, useEffect, useMemo } from 'react';
import { Order, OrderItem, CustomerAddress } from '../types';
import { clearFirestoreCart } from '../services/customerService';
import { createOrder } from '../services/orderService';
import { getProducts } from '../services/productService';
import { ShopSettings, DEFAULT_SHOP_SETTINGS } from '../services/storeConfigService';
import { PromoCode, validatePromoCode, calculateDiscount, incrementPromoUsage } from '../services/promoCodeService';
import { getActiveOffers, calculateOfferDiscounts, SpecialOffer, AppliedOffer, GiftSuggestion } from '../services/offerService';
import { captureException } from '../services/sentry';
import { trackContactComplete, trackShippingComplete, trackPaymentSelected, trackPurchase, trackCheckoutError } from '../services/analytics';

export type CheckoutSection = 'contact' | 'shipping' | 'payment';

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface CheckoutCartItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedModel?: string;
  selectedColor?: string;
  isCustom?: boolean;
  category: string;
  brands?: string[];
}

interface UseCheckoutOptions<TCartItem extends CheckoutCartItem> {
  cart: TCartItem[];
  cartTotal: number;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  setCart: (items: TCartItem[]) => void;
  customerUid?: string | null;
  shopSettings?: ShopSettings;
}

export const useCheckout = <TCartItem extends CheckoutCartItem>({
  cart,
  cartTotal,
  orders,
  setOrders,
  setCart,
  customerUid,
  shopSettings = DEFAULT_SHOP_SETTINGS,
}: UseCheckoutOptions<TCartItem>) => {
  // Accordion state - which section is active
  const [activeSection, setActiveSection] = useState<CheckoutSection>('contact');
  const [completedSections, setCompletedSections] = useState<Set<CheckoutSection>>(new Set());

  // Shipping info (structured address)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'España',
  });

  // Legal consent
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Order state
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Special offers state
  const [activeOffers, setActiveOffers] = useState<SpecialOffer[]>([]);

  useEffect(() => {
    getActiveOffers().then(setActiveOffers).catch(() => {});
  }, []);

  // Detect first purchase (no previous completed orders)
  const isFirstPurchase = orders.length === 0;

  // Calculate offer discounts based on current cart
  const offerResult = useMemo(
    () => calculateOfferDiscounts(cart, activeOffers, isFirstPurchase),
    [cart, activeOffers, isFirstPurchase]
  );
  const offerDiscount = offerResult.totalDiscount;
  const appliedOfferDetails: AppliedOffer[] = offerResult.appliedOffers;
  const giftSuggestions: GiftSuggestion[] = offerResult.giftSuggestions;

  // Price calculations (IVA-inclusive: prices in DB already include VAT)
  // cartTotal is already the IVA-inclusive sum
  const subtotal = parseFloat(cartTotal.toFixed(2));
  const promoDiscount = appliedPromo ? calculateDiscount(appliedPromo, subtotal) : 0;
  const discount = parseFloat((promoDiscount + offerDiscount).toFixed(2));
  const discountedSubtotal = parseFloat(Math.max(0, subtotal - discount).toFixed(2));
  const isFreeShipping = discountedSubtotal >= shopSettings.freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : shopSettings.shippingCost;
  // Tax is extracted from the IVA-inclusive price (informational, not an additional charge)
  const tax = parseFloat((discountedSubtotal * shopSettings.ivaRate / (1 + shopSettings.ivaRate)).toFixed(2));
  // Total = IVA-inclusive product cost + shipping (no additional tax added)
  const total = parseFloat((discountedSubtotal + shippingCost).toFixed(2));
  const amountToFreeShipping = Math.max(0, shopSettings.freeShippingThreshold - discountedSubtotal);

  // Validate contact section (email)
  const validateContact = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!shippingInfo.email.trim()) {
      errors.email = 'required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      errors.email = 'invalid';
    }
    setFormErrors(prev => ({ ...prev, ...errors, ...(errors.email ? {} : { email: '' }) }));
    return !errors.email;
  }, [shippingInfo.email]);

  // Validate shipping section
  const validateShipping = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!shippingInfo.fullName.trim()) errors.fullName = 'required';
    if (!shippingInfo.email.trim()) {
      errors.email = 'required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      errors.email = 'invalid';
    }
    if (!shippingInfo.phone.trim()) errors.phone = 'required';
    if (!shippingInfo.street.trim()) errors.street = 'required';
    if (!shippingInfo.city.trim()) errors.city = 'required';
    if (!shippingInfo.postalCode.trim()) errors.postalCode = 'required';
    if (!shippingInfo.country.trim()) errors.country = 'required';
    if (!acceptTerms) errors.terms = 'required';
    if (!acceptPrivacy) errors.privacy = 'required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [shippingInfo, acceptTerms, acceptPrivacy]);

  // Complete contact section and move to shipping
  const completeContact = useCallback(() => {
    if (validateContact()) {
      setCompletedSections(prev => new Set([...prev, 'contact']));
      setActiveSection('shipping');
      trackContactComplete();
      return true;
    }
    return false;
  }, [validateContact]);

  // Complete shipping section and move to payment
  const completeShipping = useCallback(() => {
    if (validateShipping()) {
      setCompletedSections(prev => new Set([...prev, 'contact', 'shipping']));
      setActiveSection('payment');
      trackShippingComplete();
      return true;
    }
    return false;
  }, [validateShipping]);

  // Fill shipping from saved address
  const fillFromAddress = useCallback((address: CustomerAddress) => {
    setShippingInfo(prev => ({
      ...prev,
      fullName: address.fullName || prev.fullName,
      phone: address.phone || prev.phone,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
    }));
  }, []);

  // Fill from customer profile
  const fillFromCustomer = useCallback((customer: { displayName: string; email: string; phone?: string }) => {
    setShippingInfo(prev => ({
      ...prev,
      fullName: prev.fullName || customer.displayName || '',
      email: prev.email || customer.email || '',
      phone: prev.phone || customer.phone || '',
    }));
  }, []);

  // Apply promo code
  const applyPromoCode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setPromoError('');
    setIsValidatingPromo(true);
    try {
      const promo = await validatePromoCode(code, subtotal, customerUid ?? undefined);
      setAppliedPromo(promo);
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : 'promoInvalid');
      setAppliedPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  }, [subtotal, customerUid]);

  // Remove applied promo code
  const removePromoCode = useCallback(() => {
    setAppliedPromo(null);
    setPromoError('');
  }, []);

  // Order error
  const [orderError, setOrderError] = useState<string | null>(null);

  // Place order
  const handlePlaceOrder = async (paymentMethod: 'Stripe', paymentId: string) => {
    if (!validateShipping()) {
      setActiveSection('shipping');
      return;
    }

    setIsPlacingOrder(true);
    trackPaymentSelected(paymentMethod);
    try {
      // Validate stock before placing order
      const currentProducts = await getProducts();
      for (const item of cart) {
        const product = currentProducts.find((p) => String(p.id) === String(item.id));
        if (product && product.stock !== undefined && item.quantity > product.stock) {
          setOrderError(`"${item.name}" — stock insuficiente (disponible: ${product.stock})`);
          setIsPlacingOrder(false);
          return;
        }
      }

      const orderItems: OrderItem[] = cart.map((item) => {
        const orderItem: OrderItem = {
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          quantity: item.quantity,
        };
        if (item.selectedModel) {
          orderItem.selectedModel = item.selectedModel;
        }
        if (item.selectedColor) {
          orderItem.selectedColor = item.selectedColor;
        }
        if (item.isCustom) {
          orderItem.isCustom = item.isCustom;
        }
        return orderItem;
      });

      // Compose full address string for backward compatibility
      const addressStr = `${shippingInfo.street}, ${shippingInfo.postalCode} ${shippingInfo.city}, ${shippingInfo.country}`;

      const orderData: Record<string, unknown> = {
        customerName: shippingInfo.fullName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        address: addressStr,
        items: orderItems,
        subtotal,
        discount,
        shipping: shippingCost,
        tax,
        total,
        status: 'Pending',
        paymentMethod,
        paymentId,
      };

      if (appliedPromo) {
        orderData.promoCode = appliedPromo.code;
        orderData.promoDiscount = promoDiscount;
      }

      if (appliedOfferDetails.length > 0) {
        orderData.appliedOffers = appliedOfferDetails;
        orderData.offerDiscount = offerDiscount;
      }

      if (customerUid) orderData.customerId = customerUid;

      const newOrder = await createOrder(orderData as Parameters<typeof createOrder>[0]);

      // Increment promo usage after successful order
      if (appliedPromo) {
        incrementPromoUsage(appliedPromo.id, customerUid ?? undefined).catch(() => {});
      }
      setLastOrderNumber(newOrder.orderNumber);
      trackPurchase(newOrder.orderNumber, total, cart.length);

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);

      if (customerUid) {
        clearFirestoreCart(customerUid).catch(() => {});
      }

      setCart([] as TCartItem[]);
      setOrderSuccess(true);
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { source: 'useCheckout.placeOrder' });
      trackCheckoutError('payment', error instanceof Error ? error.message : String(error));
      setFormErrors({ order: 'failed' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Reset checkout state
  const resetCheckout = useCallback(() => {
    setActiveSection('contact');
    setCompletedSections(new Set());
    setShippingInfo({
      fullName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'España',
    });
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setFormErrors({});
    setOrderSuccess(false);
    setOrderError(null);
    setLastOrderNumber('');
    setAppliedPromo(null);
    setPromoError('');
  }, []);

  return {
    // Accordion
    activeSection,
    setActiveSection,
    completedSections,
    // Shipping info
    shippingInfo,
    setShippingInfo,
    // Legal
    acceptTerms,
    setAcceptTerms,
    acceptPrivacy,
    setAcceptPrivacy,
    // Validation
    formErrors,
    setFormErrors,
    // Section actions
    completeContact,
    completeShipping,
    fillFromAddress,
    fillFromCustomer,
    // Order
    handlePlaceOrder,
    lastOrderNumber,
    orderSuccess,
    orderError,
    isPlacingOrder,
    resetCheckout,
    // Promo code
    appliedPromo,
    promoError,
    isValidatingPromo,
    applyPromoCode,
    removePromoCode,
    discount,
    // Special offers
    offerDiscount,
    appliedOfferDetails,
    giftSuggestions,
    // Calculated prices
    subtotal,
    shippingCost,
    isFreeShipping,
    tax,
    total,
    amountToFreeShipping,
  };
};
