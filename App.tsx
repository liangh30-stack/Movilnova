import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Product, Language, Order, CustomerAddress, CustomerOrder } from './types';
import { ROUTES } from './routes';
import { MOCK_PRODUCTS, HOT_BUNDLE } from './constants';
import { toLegacyLang, toI18nLang, loadLocale, LegacyLanguage } from './i18n';
import { subscribeToProducts } from './services/productService';
import { onAuthChange, signOutUser, type AdminUser } from './services/authService';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from './services/customerService';
import { getCustomerOrders as getFirestoreCustomerOrders } from './services/orderService';
import NavBar from './components/NavBar';
import MobileMenu from './components/MobileMenu';
import CartDrawer from './components/CartDrawer';
import HomeCarousel from './components/HomeCarousel';
import SiteFooter from './components/SiteFooter';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import { useCustomerAuth } from './hooks/useCustomerAuth';
import { useFavorites } from './hooks/useFavorites';
import { useShopSettings } from './hooks/useShopSettings';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useTheme } from './hooks/useTheme';
import { Loader2, Wrench, AlertTriangle } from 'lucide-react';
import { captureException } from './services/sentry';
import { trackPageView, trackAddToCart } from './services/analytics';

// Lazy load customer components
const CustomerAuthModal = lazy(() => import('./components/CustomerAuthModal'));
const MyAccountPage = lazy(() => import('./components/MyAccountPage'));

// Lazy load heavy components for better performance
const Hero3D = lazy(() => import('./components/Hero3D'));
const Storefront = lazy(() => import('./components/Storefront'));
const NotFound = lazy(() => import('./components/NotFound'));
const RepairLookup = lazy(() => import('./components/RepairLookup'));

const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const LegalPage = lazy(() => import('./components/LegalPage'));
const CookieConsentBanner = lazy(() => import('./components/CookieConsentBanner'));
const LocalPage = lazy(() => import('./components/LocalPage'));
const StoresSection = lazy(() => import('./components/StoresSection'));
const FeaturedProducts = lazy(() => import('./components/FeaturedProducts'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 size={32} className="animate-spin text-brand-primary" />
  </div>
);

// Legal page route map for inter-page navigation
const LEGAL_ROUTE_MAP: Record<string, string> = {
  privacy: ROUTES.LEGAL_PRIVACY,
  terms: ROUTES.LEGAL_TERMS,
  legal: ROUTES.LEGAL_NOTICE,
  cookies: ROUTES.LEGAL_COOKIES,
  returns: ROUTES.LEGAL_RETURNS,
};

// Paths where footer should be hidden
const HIDE_FOOTER_PATHS = new Set<string>([ROUTES.ADMIN, ROUTES.CUSTOMER_ACCOUNT, ROUTES.CHECKOUT]);

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Customer Auth
  const { customer, login: customerLogin, register: customerRegister, logout: customerLogout, resetPassword: customerResetPassword, updateProfile: customerUpdateProfile, updateDeletionStatus } = useCustomerAuth();
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [pendingAccount, setPendingAccount] = useState(false);

  // Cart with customer sync
  const { cart, setCart, addToCart, removeFromCart, updateCartQuantity, cartTotal, cartItemCount } = useCart(customer?.uid ?? null);

  // Favorites with customer sync
  const { favorites, toggleFavorite } = useFavorites(customer?.uid ?? null);

  // Shop settings (IVA, shipping, currency) from Firestore
  const { settings: shopSettings } = useShopSettings();

  // Theme (light/dark/system)
  const { mode: themeMode, setMode: setThemeMode, isDark } = useTheme();

  // Customer addresses & orders
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);

  // Keep legacy lang state for backwards compatibility with child components
  const [lang, setLang] = useState<Language>(() => toLegacyLang(i18n.language));
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Sync i18next language changes to legacy lang state
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLang(toLegacyLang(lng));
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Language change handler — pre-loads locale then switches
  const handleLanguageChange = async (legacyLang: LegacyLanguage) => {
    const i18nLang = toI18nLang(legacyLang);
    await loadLocale(i18nLang);
    i18n.changeLanguage(i18nLang);
    setLang(legacyLang);
    setIsLangMenuOpen(false);
  };
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [repairSearchTerm, setRepairSearchTerm] = useState('');

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Order State
  // Orders kept in memory only — no localStorage to avoid persisting PII
  const [orders, setOrders] = useState<Order[]>([]);

  // Firebase Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 5-second Carousel Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time product updates from Firestore
  useEffect(() => {
    setIsLoadingProducts(true);
    const unsubscribe = subscribeToProducts(
      (firestoreProducts) => {
        if (firestoreProducts.length > 0) {
          setProducts(firestoreProducts);
        } else {
          setProducts([HOT_BUNDLE, ...MOCK_PRODUCTS]);
        }
        setIsLoadingProducts(false);
      },
      () => {
        setProducts([HOT_BUNDLE, ...MOCK_PRODUCTS]);
        setIsLoadingProducts(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen for admin auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Customer address CRUD callbacks
  const handleAddAddress = useCallback(async (address: Omit<CustomerAddress, 'id'>) => {
    if (!customer) return;
    const newAddr = await addAddress(customer.uid, address);
    setCustomerAddresses(prev => [...prev, newAddr]);
  }, [customer]);

  const handleUpdateAddress = useCallback(async (id: string, data: Partial<CustomerAddress>) => {
    if (!customer) return;
    await updateAddress(customer.uid, id, data);
    setCustomerAddresses(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, [customer]);

  const handleDeleteAddress = useCallback(async (id: string) => {
    if (!customer) return;
    await deleteAddress(customer.uid, id);
    setCustomerAddresses(prev => prev.filter(a => a.id !== id));
  }, [customer]);

  const handleSetDefaultAddress = useCallback(async (id: string) => {
    if (!customer) return;
    await setDefaultAddress(customer.uid, id);
    setCustomerAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  }, [customer]);

  const handleAdminLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)), { context: 'adminLogout' });
    }
    setAdminUser(null);
    navigate(ROUTES.HOME);
  };

  const checkout = useCheckout({
    cart,
    cartTotal,
    orders,
    setOrders,
    setCart,
    customerUid: customer?.uid ?? null,
    shopSettings,
  });

  // Auto-fill checkout with customer data when entering checkout
  useEffect(() => {
    if (location.pathname === ROUTES.CHECKOUT && customer) {
      checkout.fillFromCustomer(customer);
      // Auto-fill default address if available
      const defaultAddr = customerAddresses.find(a => a.isDefault);
      if (defaultAddr) checkout.fillFromAddress(defaultAddr);
    }
  }, [location.pathname, customer?.uid]);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  // Load customer addresses & orders when customer logs in or places a new order
  useEffect(() => {
    if (customer?.uid) {
      getAddresses(customer.uid).then(setCustomerAddresses).catch((err) => {
        captureException(err instanceof Error ? err : new Error(String(err)), { context: 'loadAddresses' });
      });
      getFirestoreCustomerOrders(customer.uid, customer.email).then(orders => {
        setCustomerOrders(orders as CustomerOrder[]);
      }).catch((err) => {
        captureException(err instanceof Error ? err : new Error(String(err)), { context: 'loadOrders' });
      });
    } else {
      setCustomerAddresses([]);
      setCustomerOrders([]);
    }
  }, [customer?.uid, checkout.lastOrderNumber]);

  const handleAddToCart = (product: Product) => {
    if (!product.isCustom && product.stock !== undefined && product.stock <= 0) return;
    const inCartQty = cart.filter(item => item.id === product.id && item.selectedModel === product.selectedModel).reduce((sum, item) => sum + item.quantity, 0);
    if (!product.isCustom && product.stock !== undefined && inCartQty >= product.stock) return;
    addToCart(product);
    trackAddToCart(product.id, product.name, product.price, 1);
    setIsCartOpen(true);
  };

  // Offers filter (triggered by "View Offers" button in Hero)
  const [showOffersOnly, setShowOffersOnly] = useState(false);

  // Maintenance mode — block non-admin/employee visitors
  const isStaff = !!adminUser;
  if (shopSettings.maintenanceMode && !isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-light to-brand-surface p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
          <Wrench size={40} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mb-3">
          {t('maintenanceTitle', 'Estamos en mantenimiento')}
        </h1>
        <p className="text-brand-muted max-w-md mb-6">
          {t('maintenanceMessage', 'Estamos realizando mejoras en nuestra tienda. Volveremos en breve. ¡Gracias por tu paciencia!')}
        </p>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Loader2 size={16} className="animate-spin" />
          {t('maintenanceWorking', 'Trabajando en ello...')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-light overflow-x-hidden">
      <ScrollToTop />

      {/* Admin maintenance badge */}
      {shopSettings.maintenanceMode && isStaff && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg animate-pulse">
          <AlertTriangle size={14} />
          {t('maintenanceBadge', 'MANTENIMIENTO ACTIVO')}
        </div>
      )}

      {/* Navigation */}
      <NavBar
        lang={lang}
        onLanguageChange={handleLanguageChange}
        isLangMenuOpen={isLangMenuOpen}
        setIsLangMenuOpen={setIsLangMenuOpen}
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onUserClick={() => {
          if (customer) {
            navigate(ROUTES.CUSTOMER_ACCOUNT);
          } else {
            setIsCustomerAuthOpen(true);
          }
        }}
        onMobileMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        adminUser={adminUser}
        customer={customer}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        isDark={isDark}
      />

      {/* Customer Auth Modal */}
      <Suspense fallback={null}>
        <CustomerAuthModal
          isOpen={isCustomerAuthOpen}
          onClose={() => { setIsCustomerAuthOpen(false); setPendingCheckout(false); setPendingAccount(false); }}
          onLoginSuccess={() => {
            setIsCustomerAuthOpen(false);
            if (pendingCheckout) {
              setPendingCheckout(false);
              navigate(ROUTES.CHECKOUT);
            } else if (pendingAccount) {
              setPendingAccount(false);
              navigate(ROUTES.CUSTOMER_ACCOUNT);
            }
          }}
          login={customerLogin}
          register={customerRegister}
          resetPassword={customerResetPassword}
        />
      </Suspense>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        customer={customer}
        onCustomerAccountClick={() => navigate(ROUTES.CUSTOMER_ACCOUNT)}
        onSignInClick={() => setIsCustomerAuthOpen(true)}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        isDark={isDark}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        cartTotal={cartTotal}
        cartItemCount={cartItemCount}
        onClose={() => setIsCartOpen(false)}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        customer={customer}
        onSignInClick={() => { setIsCartOpen(false); setIsCustomerAuthOpen(true); }}
        onCheckout={() => {
          setIsCartOpen(false);
          if (customer) {
            navigate(ROUTES.CHECKOUT);
          } else {
            setPendingCheckout(true);
            setIsCustomerAuthOpen(true);
          }
        }}
        shopSettings={shopSettings}
        products={products}
      />

      {/* Main Content */}
      <main className="pt-20 flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path={ROUTES.HOME} element={
              <>
                <HomeCarousel
                  carouselIndex={carouselIndex}
                  setCarouselIndex={setCarouselIndex}
                  layerOne={<Hero3D products={products} onViewOffers={() => { setShowOffersOnly(true); setTimeout(() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' }), 100); }} />}
                />
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-brand-primary" />
                  </div>
                ) : (
                  <>
                  <StoresSection />
                  <FeaturedProducts
                    products={products}
                    onAddToCart={handleAddToCart}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />
                  </>
                )}
              </>
            } />

            <Route path={ROUTES.PRODUCT} element={
              <ProductPage
                products={products}
                isLoadingProducts={isLoadingProducts}
                onAddToCart={handleAddToCart}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                customerUid={customer?.uid ?? null}
                customerName={customer?.displayName ?? null}
                isAdmin={!!adminUser}
              />
            } />

            <Route path={ROUTES.CATALOG} element={
              <Storefront
                products={products}
                onAddToCart={handleAddToCart}
                lang={lang}
                onTrackOrderClick={(searchTerm) => {
                  if (searchTerm) setRepairSearchTerm(searchTerm);
                  navigate(ROUTES.REPAIR_LOOKUP);
                }}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                featuredProductId={shopSettings.featuredProductId}
                bannerEnabled={shopSettings.bannerEnabled}
                bannerText={shopSettings.bannerText}
                bannerSubtext={shopSettings.bannerSubtext}
                showOffersOnly={showOffersOnly}
                onClearOffersFilter={() => setShowOffersOnly(false)}
              />
            } />

            <Route path={ROUTES.REPAIR_LOOKUP} element={
              <RepairLookup
                onBrowseShop={() => navigate(ROUTES.HOME)}
                lang={lang}
                initialSearchTerm={repairSearchTerm}
                onClearSearch={() => setRepairSearchTerm('')}
              />
            } />

            {/* Checkout — requires authenticated customer */}
            <Route path={ROUTES.CHECKOUT} element={
              <ProtectedRoute isAllowed={!!customer} fallback={
                <NotFound onBack={() => navigate(ROUTES.HOME)} title={t('notFoundSignInTitle')} message={t('notFoundSignInMessage')} />
              }>
                <ProtectedRoute isAllowed={cart.length > 0 || checkout.orderSuccess} fallback={
                  <NotFound onBack={() => navigate(ROUTES.HOME)} title={t('notFoundCartEmptyTitle')} message={t('notFoundCartEmptyMessage')} />
                }>
                  <CheckoutPage
                    cart={cart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    activeSection={checkout.activeSection}
                    setActiveSection={checkout.setActiveSection}
                    completedSections={checkout.completedSections}
                    shippingInfo={checkout.shippingInfo}
                    setShippingInfo={checkout.setShippingInfo}
                    acceptTerms={checkout.acceptTerms}
                    setAcceptTerms={checkout.setAcceptTerms}
                    acceptPrivacy={checkout.acceptPrivacy}
                    setAcceptPrivacy={checkout.setAcceptPrivacy}
                    formErrors={checkout.formErrors}
                    completeContact={checkout.completeContact}
                    completeShipping={checkout.completeShipping}
                    fillFromAddress={checkout.fillFromAddress}
                    handlePlaceOrder={checkout.handlePlaceOrder}
                    lastOrderNumber={checkout.lastOrderNumber}
                    orderSuccess={checkout.orderSuccess}
                    orderError={checkout.orderError}
                    isPlacingOrder={checkout.isPlacingOrder}
                    resetCheckout={checkout.resetCheckout}
                    subtotal={checkout.subtotal}
                    shippingCost={checkout.shippingCost}
                    isFreeShipping={checkout.isFreeShipping}
                    tax={checkout.tax}
                    total={checkout.total}
                    discount={checkout.discount}
                    amountToFreeShipping={checkout.amountToFreeShipping}
                    shopSettings={shopSettings}
                    customer={customer!}
                    customerAddresses={customerAddresses}
                    onSignInClick={() => setIsCustomerAuthOpen(true)}
                    onBack={() => navigate(ROUTES.HOME)}
                    appliedPromo={checkout.appliedPromo}
                    promoError={checkout.promoError}
                    isValidatingPromo={checkout.isValidatingPromo}
                    applyPromoCode={checkout.applyPromoCode}
                    removePromoCode={checkout.removePromoCode}
                    appliedOfferDetails={checkout.appliedOfferDetails}
                    giftSuggestions={checkout.giftSuggestions}
                    products={products}
                    onAddToCart={handleAddToCart}
                  />
                </ProtectedRoute>
              </ProtectedRoute>
            } />

            {/* Customer Account */}
            <Route path={ROUTES.CUSTOMER_ACCOUNT} element={
              <ProtectedRoute isAllowed={!!customer} fallback={
                <NotFound onBack={() => navigate(ROUTES.HOME)} title={t('notFoundSignInTitle')} message={t('notFoundSignInMessage')} />
              }>
                <MyAccountPage
                  customer={customer!}
                  onLogout={async () => { await customerLogout(); navigate(ROUTES.HOME); }}
                  onBack={() => navigate(ROUTES.HOME)}
                  orders={customerOrders}
                  addresses={customerAddresses}
                  favorites={favorites}
                  products={products}
                  onUpdateProfile={customerUpdateProfile}
                  onAddAddress={handleAddAddress}
                  onUpdateAddress={handleUpdateAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onSetDefaultAddress={handleSetDefaultAddress}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={handleAddToCart}
                  onDeletionStatusChange={updateDeletionStatus}
                />
              </ProtectedRoute>
            } />

            {/* Admin Panel */}
            <Route path={ROUTES.ADMIN} element={
              adminUser ? (
                <AdminPanel
                  user={adminUser}
                  onLogout={handleAdminLogout}
                  onBack={() => navigate(ROUTES.HOME)}
                />
              ) : (
                <Navigate to={ROUTES.HOME} replace />
              )
            } />

            {/* Legal Pages */}
            <Route path={ROUTES.LEGAL_PRIVACY} element={
              <LegalPage page="privacy" onBack={() => navigate(ROUTES.HOME)} onNavigate={(p) => navigate(LEGAL_ROUTE_MAP[p] ?? ROUTES.HOME)} />
            } />
            <Route path={ROUTES.LEGAL_TERMS} element={
              <LegalPage page="terms" onBack={() => navigate(ROUTES.HOME)} onNavigate={(p) => navigate(LEGAL_ROUTE_MAP[p] ?? ROUTES.HOME)} />
            } />
            <Route path={ROUTES.LEGAL_NOTICE} element={
              <LegalPage page="legal" onBack={() => navigate(ROUTES.HOME)} onNavigate={(p) => navigate(LEGAL_ROUTE_MAP[p] ?? ROUTES.HOME)} />
            } />
            <Route path={ROUTES.LEGAL_COOKIES} element={
              <LegalPage page="cookies" onBack={() => navigate(ROUTES.HOME)} onNavigate={(p) => navigate(LEGAL_ROUTE_MAP[p] ?? ROUTES.HOME)} />
            } />
            <Route path={ROUTES.LEGAL_RETURNS} element={
              <LegalPage page="returns" onBack={() => navigate(ROUTES.HOME)} onNavigate={(p) => navigate(LEGAL_ROUTE_MAP[p] ?? ROUTES.HOME)} />
            } />

            {/* Catch-all 404 */}
            {/* Local SEO landing pages */}
            <Route path={ROUTES.LOCAL_PORRINO} element={<LocalPage city="porrino" />} />
            <Route path={ROUTES.LOCAL_BAIONA} element={<LocalPage city="baiona" />} />
            <Route path={ROUTES.LOCAL_LALIN} element={<LocalPage city="lalin" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>


      {!HIDE_FOOTER_PATHS.has(location.pathname) && (
        <SiteFooter
          customer={!!customer}
          onCustomerAccountClick={() => navigate(ROUTES.CUSTOMER_ACCOUNT)}
          onOpenCustomerAuth={() => { setPendingAccount(true); setIsCustomerAuthOpen(true); }}
        />
      )}

      {/* Cookie Consent Banner */}
      <Suspense fallback={null}>
        <CookieConsentBanner onViewCookiePolicy={() => navigate(ROUTES.LEGAL_COOKIES)} />
      </Suspense>
    </div>
  );
};

export default App;
