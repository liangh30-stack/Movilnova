# MovilNova - Documentación Técnica

## Arquitectura del sistema

MovilNova sigue una arquitectura **serverless SPA** (Single Page Application) con backend BaaS (Backend as a Service) sobre Firebase:

```
┌──────────────────────────────────────────────────────┐
│                     CLIENTE (SPA)                     │
│  React 19 + TypeScript + Tailwind CSS + Vite         │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────┐    │
│  │Components│ │  Hooks    │ │    Services       │    │
│  │  (34)    │ │   (9)     │ │     (19)          │    │
│  └──────────┘ └───────────┘ └──────────────────┘    │
└───────────────────┬──────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼──────────────────────────────────┐
│                   FIREBASE                            │
│  ┌────────────┐ ┌───────────┐ ┌────────────────┐    │
│  │  Firestore │ │   Auth    │ │ Cloud Functions │    │
│  │  (NoSQL)   │ │(Email+G)  │ │   (Node 20)    │    │
│  └────────────┘ └───────────┘ └───────┬────────┘    │
│  ┌────────────┐ ┌───────────┐         │             │
│  │  Hosting   │ │ App Check │         │             │
│  │  (CDN)     │ │(reCAPTCHA)│         │             │
│  └────────────┘ └───────────┘         │             │
└───────────────────────────────────────┼──────────────┘
                                        │
┌───────────────────────────────────────▼──────────────┐
│               SERVICIOS EXTERNOS                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐  │
│  │ Stripe │ │ Resend │ │ Gemini │ │   Sentry     │  │
│  │(Pagos) │ │(Email) │ │  (IA)  │ │  (Errores)   │  │
│  └────────┘ └────────┘ └────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Flujo de datos

1. **Lectura**: El cliente se suscribe en tiempo real a Firestore (`onSnapshot`). Los productos, pedidos y configuración se sincronizan automáticamente.
2. **Escritura**: Las operaciones sensibles (pagos, precios) pasan por Cloud Functions. Las operaciones CRUD de administración van directo a Firestore, protegidas por Security Rules.
3. **Autenticación**: Firebase Auth gestiona tokens JWT. El frontend los envía automáticamente en cada petición a Cloud Functions.
4. **Pagos**: El cliente solicita un `PaymentIntent` vía Cloud Function (que valida precios server-side), y Stripe confirma el pago vía webhook.

---

## Tecnologías utilizadas

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | React | 19.2.3 | UI reactiva basada en componentes |
| Lenguaje | TypeScript | 5.8.2 | Tipado estático |
| Bundler | Vite | 6.4.1 | Build y dev server |
| Estilos | Tailwind CSS | 4.2.0 | Utility-first CSS |
| Routing | react-router-dom | 7.13.0 | SPA routing |
| Backend | Firebase | 10.8.0 | Auth, Firestore, Hosting, Functions |
| Functions | Node.js | 20 | Cloud Functions runtime |
| Pagos | Stripe | 8.7.0 | Procesamiento de pagos |
| IA | Google Gemini | 1.34.0 | Diagnóstico de dispositivos |
| Email | Resend | - | Notificaciones transaccionales |
| i18n | i18next | 25.8.1 | Internacionalización (5 idiomas) |
| Gráficos | Recharts | 3.6.0 | Analíticas y dashboards |
| Iconos | Lucide React | 0.562.0 | Iconografía SVG |
| Errores | Sentry | 10.38.0 | Error tracking y performance |
| PWA | vite-plugin-pwa | 1.2.0 | Service worker y manifest |
| Tests | Vitest | 4.0.18 | Unit/integration testing |
| Linting | ESLint | 9.39.3 | Análisis estático de código |
| Formato | Prettier | 3.8.1 | Formateo automático |

---

## Estructura del proyecto

```
movilnova/
│
├── index.html                    # HTML raíz (meta SEO, JSON-LD, GA4)
├── index.tsx                     # Entry point (Sentry, i18n, ErrorBoundary)
├── App.tsx                       # Componente raíz (rutas, auth, estado global)
├── app.css                       # Estilos globales + variables Tailwind
├── types.ts                      # Interfaces TypeScript del dominio
├── constants.ts                  # Datos mock, mapeo marca→modelos
├── routes.ts                     # Constantes de rutas (ROUTES)
│
├── components/                   # 34 componentes React
│   ├── AdminPanel.tsx            # Dashboard admin (lazy)
│   ├── AdminLogin.tsx            # Login por PIN
│   ├── ProductManager.tsx        # CRUD de productos
│   ├── OrdersManager.tsx         # Gestión de pedidos
│   ├── UsersManager.tsx          # Gestión de usuarios/roles
│   ├── SalesAnalyticsManager.tsx # Gráficos y métricas
│   ├── ShopSettingsManager.tsx   # Config tienda (IVA, envío, ofertas)
│   ├── AuditLogViewer.tsx        # Log de auditoría (superadmin)
│   ├── InventoryHistory.tsx      # Historial de inventario
│   ├── Storefront.tsx            # Catálogo público (lazy)
│   ├── ProductPage.tsx           # Detalle de producto (lazy)
│   ├── CartDrawer.tsx            # Carrito lateral
│   ├── CheckoutPage.tsx          # Checkout 3 pasos (lazy)
│   ├── MyAccountPage.tsx         # Perfil del cliente (lazy)
│   ├── CustomerAuthModal.tsx     # Modal login/registro (lazy)
│   ├── RepairLookup.tsx          # Consulta de reparaciones (lazy)
│   ├── Hero3D.tsx                # Banner hero animado (lazy)
│   ├── NavBar.tsx                # Navegación superior
│   ├── SiteFooter.tsx            # Footer
│   ├── HomeCarousel.tsx           # Carrusel rotativo de inicio
│   ├── ProductReviews.tsx         # Reseñas con estrellas (1-5)
│   ├── MobileMenu.tsx             # Menú de navegación móvil
│   ├── OptimizedImage.tsx         # Imagen lazy-loaded con placeholder
│   ├── SyncSettings.tsx           # Configuración de sincronización
│   ├── UserRolesManager.tsx       # Asignación de permisos
│   ├── ProtectedRoute.tsx         # Guard de rutas autenticadas
│   ├── ErrorBoundary.tsx          # Boundary de errores React
│   ├── NotFound.tsx               # Página 404 (lazy)
│   ├── ScrollToTop.tsx            # Auto-scroll en cambio de ruta
│   ├── CookieConsentBanner.tsx    # Banner RGPD (lazy)
│   ├── LegalPage.tsx              # Privacidad, términos, cookies (lazy)
│   └── checkout/
│       ├── OrderSummary.tsx      # Resumen de pedido
│       ├── StripePaymentForm.tsx # Formulario Stripe Elements
│       └── TrustBadges.tsx       # Badges de confianza
│
├── services/                     # 19 módulos de lógica de negocio
│   ├── firebase.ts               # Inicialización SDK + App Check
│   ├── authService.ts            # Auth admin (email/password)
│   ├── customerService.ts        # Auth cliente + perfil + carrito + favoritos
│   ├── productService.ts         # CRUD productos + normalización categorías
│   ├── orderService.ts           # Creación/actualización de pedidos
│   ├── paymentService.ts         # Proxy para createPaymentIntent
│   ├── emailService.ts           # Notificaciones vía Resend
│   ├── geminiService.ts          # Proxy IA Gemini
│   ├── promoCodeService.ts       # CRUD códigos promocionales
│   ├── offerService.ts           # Ofertas especiales (buy X pay Y, regalos)
│   ├── storeConfigService.ts     # Configuración de tienda
│   ├── catalogService.ts         # Catálogo (categorías, marcas)
│   ├── inventoryService.ts       # Cambios de stock
│   ├── auditService.ts           # Registro de auditoría
│   ├── reviewService.ts          # Reseñas de productos
│   ├── analytics.ts              # Google Analytics 4
│   ├── sentry.ts                 # Sentry error tracking
│   ├── pushNotifications.ts      # FCM push notifications
│   └── stripeProxy.ts            # Carga lazy de Stripe.js
│
├── hooks/                        # 9 hooks personalizados
│   ├── useCart.ts                # Carrito (localStorage + Firestore sync)
│   ├── useCheckout.ts            # Máquina de estados checkout
│   ├── useCustomerAuth.ts        # Estado auth del cliente
│   ├── useFavorites.ts           # Favoritos (localStorage + Firestore merge)
│   ├── useShopSettings.ts        # Suscripción tiempo real a config
│   ├── useTheme.ts               # Dark/light mode
│   ├── useCookieConsent.ts       # Consentimiento RGPD
│   ├── useLocalStorageState.ts   # Hook genérico localStorage
│   └── useDocumentHead.ts        # Meta tags dinámicos (SEO)
│
├── i18n/
│   ├── index.ts                  # Configuración i18next + lazy loading
│   └── locales/
│       ├── es.json               # Español (bundled, ~5KB)
│       ├── en.json               # Inglés (lazy)
│       ├── zh.json               # Chino (lazy)
│       ├── fr.json               # Francés (lazy)
│       └── de.json               # Alemán (lazy)
│
├── config/
│   └── company.ts                # Info empresa desde env vars
│
├── functions/                    # Cloud Functions (Node.js 20)
│   ├── src/
│   │   └── index.ts              # 9 funciones exportadas (~37KB)
│   ├── package.json
│   └── tsconfig.json
│
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.svg
│   ├── manifest.webmanifest      # PWA manifest
│   ├── firebase-messaging-sw.js  # Service worker FCM
│   ├── offline.html              # Fallback offline
│   ├── robots.txt
│   └── sitemap.xml
│
├── utils/
│   └── errorHandler.ts           # Utilidad centralizada de manejo de errores
│
├── scripts/
│   ├── initFirestore.ts          # Script de inicialización de Firestore
│   └── checkAdminUser.js         # Verificar usuario admin existente
│
├── tests/                        # Tests unitarios e integración
│   ├── components/
│   │   ├── CheckoutPage.test.tsx
│   │   ├── OrdersManager.test.tsx
│   │   ├── StripePaymentForm.test.tsx
│   │   └── NavBar.test.tsx
│   ├── hooks/
│   │   ├── useCart.test.ts
│   │   ├── useCheckout.test.ts
│   │   ├── useCustomerAuth.test.ts
│   │   └── useFavorites.test.ts
│   └── services/
│       ├── productService.test.ts
│       ├── orderService.test.ts
│       ├── promoCodeService.test.ts
│       └── analytics.test.ts
│
├── firebase.json                 # Config hosting, rewrites, headers, CSP
├── firestore.rules               # Reglas de seguridad Firestore
├── firestore.indexes.json        # Índices compuestos
├── storage.rules                 # Reglas de Cloud Storage
├── vite.config.ts                # Vite + PWA + code splitting
├── tsconfig.json                 # TypeScript strict mode
├── vitest.config.ts              # Config tests
├── eslint.config.js              # Reglas ESLint
├── .prettierrc                   # Config Prettier
├── .env.example                  # Template de variables de entorno
└── .github/workflows/ci.yml      # CI: lint + test + build
```

---

## Instalación y configuración

### Prerrequisitos

- **Node.js** >= 20
- **npm** >= 9
- **Firebase CLI**: `npm install -g firebase-tools`
- Cuenta de **Firebase** con proyecto creado
- Cuenta de **Stripe** (para pagos)
- (Opcional) API Key de **Google Gemini** (para IA)
- (Opcional) Cuenta de **Resend** (para emails)
- (Opcional) DSN de **Sentry** (para error tracking)

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd movilnova

# Frontend
npm install

# Cloud Functions
cd functions && npm install && cd ..
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con los valores del proyecto Firebase:

```env
# Obligatorias (Firebase)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Pagos (Stripe)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Opcionales
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ENABLED=false        # Habilitar en desarrollo
VITE_FIREBASE_VAPID_KEY=BL...   # Para push notifications

# Datos de empresa (todos opcionales, tienen valores por defecto)
VITE_COMPANY_NAME=MovilNova S.L.
VITE_COMPANY_NIF=B-12345678
VITE_COMPANY_ADDRESS=C/ Principal 123, 36400 Porriño, Pontevedra
VITE_COMPANY_EMAIL=info@movilnova.es
VITE_COMPANY_PHONE=+34 986 123 456
VITE_COMPANY_DPO_EMAIL=info@movilnova.es
VITE_COMPANY_REGISTRY=Registro Mercantil de Pontevedra, Tomo XXX, Folio XXX
VITE_COMPANY_CITY=Pontevedra
```

Para Cloud Functions, crear `functions/.env`:

```env
STRIPE_SECRET_KEY=sk_live_...
GEMINI_API_KEY=AI...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=pedidos@movilnova.es  # Opcional, default: onboarding@resend.dev
```

### 3. Inicializar Firestore

Crear los siguientes documentos en Firestore:

```
shopSettings/general
├── ivaRate: 0.21
├── shippingCost: 4.99
├── freeShippingThreshold: 30
├── currency: "EUR"
└── maintenanceMode: false

shopSettings/catalog
├── categories: ["Carcasa", "Protector de pantalla", "Cargador", "Cable", "Power Bank", "Colgante", "Audio", "Bundle"]
└── brands: { "Apple": [...], "Samsung": [...], ... }
```

### 4. Configurar roles de usuario

Crear un documento en la colección `users` con el UID del primer admin:

```
users/{uid}
├── email: "admin@ejemplo.com"
├── role: "admin"  // o "superadmin"
└── createdAt: Timestamp
```

### 5. Desarrollo local

```bash
# Servidor de desarrollo (puerto 3000)
npm run dev

# Ejecutar tests
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### 6. Despliegue

```bash
# Build de producción
npm run build

# Compilar Cloud Functions
cd functions && npm run build && cd ..

# Desplegar todo
firebase deploy

# O por partes
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## Modelo de datos (Firestore)

### Colecciones principales

```
products/
├── {productId}
│   ├── name: string
│   ├── price: number              # Precio con IVA incluido
│   ├── originalPrice?: number     # Precio antes del descuento
│   ├── costPrice?: number         # Precio de coste (solo admin)
│   ├── category: string           # "Carcasa", "Cable", etc.
│   ├── brands?: string[]          # ["Apple", "Samsung"]
│   ├── compatibleModels?: string[]
│   ├── image: string              # URL principal (base64 webp)
│   ├── images?: string[]          # Galería de imágenes
│   ├── colors?: string[]          # Variantes de color
│   ├── colorImages?: map          # {color: índice imagen}
│   ├── description: string
│   ├── stock?: number
│   ├── isBundle?: boolean
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp

orders/
├── {orderId}
│   ├── orderNumber: string        # ej: "MN-1234"
│   ├── customerId?: string        # UID (null si guest)
│   ├── email: string
│   ├── phone: string
│   ├── shippingAddress: map
│   ├── items: array               # [{productId, name, price, qty, ...}]
│   ├── subtotal: number
│   ├── shipping: number
│   ├── tax: number                # IVA extraído (informativo)
│   ├── discount?: number
│   ├── promoCode?: string
│   ├── total: number              # Importe cobrado
│   ├── status: string             # "Pending"|"Processing"|"Paid"|...
│   ├── statusHistory: array       # [{status, timestamp, updatedBy}]
│   ├── paymentMethod: string      # "Stripe"|"Cash"
│   ├── paymentId?: string         # Stripe PaymentIntent ID
│   ├── trackingNumber?: string
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp

customers/
├── {uid}
│   ├── email: string
│   ├── displayName: string
│   ├── phone?: string
│   ├── fcmToken?: string          # Push notification token
│   ├── deletionRequestedAt?: Timestamp
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   │
│   ├── addresses/{addressId}      # Subcolección
│   │   ├── label: string
│   │   ├── fullName: string
│   │   ├── street: string
│   │   ├── city: string
│   │   ├── postalCode: string
│   │   ├── country: string
│   │   ├── phone: string
│   │   └── isDefault: boolean
│   │
│   ├── cart/{itemId}              # Subcolección
│   │   ├── productId: string
│   │   ├── name: string
│   │   ├── price: number
│   │   ├── image: string
│   │   ├── quantity: number
│   │   ├── selectedModel?: string
│   │   ├── selectedColor?: string
│   │   ├── isCustom?: boolean
│   │   └── addedAt: string         # ISO timestamp
│   │
│   └── favorites/{productId}     # Subcolección
│       └── addedAt: Timestamp

users/                            # Roles de administración
├── {uid}
│   ├── email: string
│   ├── role: "admin"|"superadmin"|"customer"
│   └── createdAt: Timestamp

shopSettings/
├── general
│   ├── ivaRate: number            # ej: 0.21
│   ├── shippingCost: number
│   ├── freeShippingThreshold: number
│   ├── currency: string
│   ├── maintenanceMode: boolean
│   ├── bannerEnabled: boolean
│   └── bannerText: string
│
└── catalog
    ├── categories: string[]
    ├── brands: map
    └── updatedAt: string

promoCodes/
├── {codeId}
│   ├── code: string              # ej: "VERANO15"
│   ├── type: "percentage"|"fixed"
│   ├── value: number
│   ├── minPurchase?: number
│   ├── maxUses?: number
│   ├── usedCount: number
│   ├── expiresAt?: Timestamp
│   └── active: boolean

specialOffers/
├── {offerId}
│   ├── type: "buy_x_pay_y"|"gift_with_purchase"|"buy_x_get_extra"
│   ├── scope: "all"|"category"|"brand"
│   ├── scopeValue?: string
│   ├── buyQuantity: number
│   ├── payQuantity?: number
│   ├── giftProductId?: string
│   ├── active: boolean
│   └── createdAt: Timestamp

productReviews/
├── {reviewId}
│   ├── productId: string
│   ├── customerUid: string
│   ├── displayName: string
│   ├── rating: number            # 1-5
│   ├── comment: string
│   ├── editCount: number         # máx 2
│   └── createdAt: Timestamp

inventoryChanges/                 # Inmutable (auditoría)
├── {changeId}
│   ├── productId: string
│   ├── productName: string
│   ├── previousStock: number
│   ├── newStock: number
│   ├── change: number
│   ├── reason: "manual"|"sale"|"restock"|"adjustment"
│   └── timestamp: Timestamp

auditLogs/                        # Solo lectura superadmin
├── {logId}
│   ├── action: string
│   ├── userId: string
│   ├── userEmail: string
│   ├── targetId?: string
│   ├── targetName?: string
│   ├── details?: map
│   └── timestamp: Timestamp

repairs/                          # Reparaciones de dispositivos
├── {repairId}
│   ├── customerName: string
│   ├── telefono?: string
│   ├── device: string
│   ├── brand?: string
│   ├── model?: string
│   ├── issue: string
│   ├── parts?: string[]          # Piezas necesarias
│   ├── status: string            # "Received"|"Diagnosing"|"Repairing"|"Ready"|"Delivered"
│   ├── progress: number          # 0-100
│   ├── estimatedCompletion: string
│   ├── price?: number
│   ├── technician?: string
│   ├── tiendaId?: string
│   ├── publico: boolean          # Visible para consulta pública
│   └── createdAt: Timestamp

notifications/                    # Notificaciones de pedidos
├── {notificationId}
│   ├── orderId: string
│   ├── orderNumber: string
│   ├── customerEmail: string
│   ├── customerName: string
│   ├── newStatus: string         # Estado actual del pedido
│   ├── previousStatus: string    # Estado anterior
│   ├── message: string           # Texto descriptivo del cambio
│   ├── sentAt: Timestamp
│   └── emailSent: boolean        # Si el email vía Resend se envió correctamente
```

---

## Rutas de la aplicación (SPA)

| Ruta | Componente | Acceso | Descripción |
|------|-----------|--------|-------------|
| `/` | App (Home) | Público | Carrusel + catálogo de productos |
| `/producto/:id` | ProductPage | Público | Detalle de producto con reseñas |
| `/reparaciones` | RepairLookup | Público | Consulta de estado de reparación |
| `/admin` | AdminPanel | Solo admin (PIN) | Panel de administración completo |
| `/miperfil` | MyAccountPage | Autenticado | Perfil, direcciones, pedidos, favoritos |
| `/pagar` | CheckoutPage | Público (guest checkout) | Proceso de pago en 3 pasos |
| `/privacidad` | LegalPage | Público | Política de privacidad |
| `/condiciones` | LegalPage | Público | Términos y condiciones |
| `/aviso-legal` | LegalPage | Público | Aviso legal |
| `/cookies` | LegalPage | Público | Política de cookies |

---

## Analíticas y monitorización

### Google Analytics 4

**ID de medición**: Configurable vía `VITE_GA_MEASUREMENT_ID`

**Eventos rastreados** (en `services/analytics.ts`):
- `page_view` — Cada cambio de ruta
- `view_item` — Visualización de detalle de producto
- `add_to_cart` — Añadir producto al carrito
- `search` — Búsqueda de productos en el catálogo
- `begin_checkout` — Inicio del proceso de pago
- `purchase` — Compra completada (con valor, moneda e items)

### Sentry

**Configuración** (en `services/sentry.ts`):
- DSN configurable vía `VITE_SENTRY_DSN`
- Deshabilitado por defecto en desarrollo (`VITE_SENTRY_ENABLED=false`)
- Performance monitoring: 10% de transacciones en producción, 100% en desarrollo
- Session replay: 1% baseline, 100% en sesiones con errores
- PII: Solo se envía el UID del usuario, nunca el email

---

## Cloud Functions (API)

Todas las funciones se despliegan en la región por defecto (`us-central1`) sobre Node.js 20.

### createPaymentIntent (Callable)

Crea un `PaymentIntent` de Stripe con validación server-side.

**Entrada:**
```typescript
{
  items: Array<{ productId: string; quantity: number }>;
  promoCode?: string;
  currency?: string;  // default: "eur"
}
```

**Proceso:**
1. Rate limit: 10 intentos/min por IP
2. Validación: máx 50 items, cantidades 1-100
3. Obtiene precios reales de Firestore (nunca confía en el cliente)
4. Obtiene IVA, envío y umbral gratuito de `shopSettings/general`
5. Valida y aplica código promocional si existe
6. Calcula subtotal, descuento, envío y total
7. Crea Stripe PaymentIntent con `automatic_payment_methods: { enabled: true }`

**Salida:**
```typescript
{ clientSecret: string; total: number }
```

### stripeWebhook (HTTPS)

Recibe webhooks de Stripe en `/stripeWebhook`.

**Eventos manejados:**
- `payment_intent.succeeded` → Actualiza orden a "Paid", envía push notification al cliente
- `payment_intent.payment_failed` → Actualiza orden a "Cancelled" con mensaje de error
- `payment_intent.canceled` → Marca como cancelado (no afecta pedidos ya entregados)
- `charge.refunded` → Registra reembolso total o parcial, cancela el pedido
- `charge.dispute.created` → Registra contracargo/disputa en el historial del pedido (no cambia estado, requiere acción manual del admin)

### geminiProxy (Callable)

Proxy para la API de Gemini (la API key se mantiene server-side).

**Rate limit:** 20 peticiones/min por usuario.
**Máximo:** 10.000 caracteres por mensaje.
**Requiere:** Autenticación Firebase.

### deleteCustomerAccount (Callable)

Elimina un cliente y todos sus datos (solo admin).

**Cascade:** Auth → customers/{uid} → addresses → cart → favorites → orders

### requestAccountDeletion / cancelAccountDeletion (Callable)

Gestión del período de gracia de 30 días para eliminación de cuenta por parte del cliente.

### processScheduledDeletions (Scheduled)

Ejecuta diariamente. Elimina cuentas con `deletionRequestedAt` > 30 días.

### sendOrderNotification (Callable)

Envía emails de notificación cuando cambia el estado de un pedido. Usa **Resend** para enviar emails HTML con plantilla profesional.

**Entrada:**
```typescript
{
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  newStatus: string;       // "Pending"|"Processing"|"Paid"|"Shipped"|"Delivered"|"Cancelled"
  previousStatus: string;
  orderData?: {            // Opcional: detalle de productos para el email
    items: Array<{ productName, productImage, price, quantity }>;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
}
```

**Proceso:**
1. Valida autenticación y parámetros obligatorios
2. Valida formato de email con regex
3. Selecciona asunto y cuerpo según el `newStatus` (mensajes predefinidos en español)
4. Genera HTML responsive con productos, precios y badge de estado
5. Envía vía Resend API
6. Guarda notificación en colección `notifications` (con flag `emailSent`)

**Requiere:** Autenticación Firebase, `RESEND_API_KEY` y opcionalmente `RESEND_FROM_EMAIL` en `functions/.env`.

### sendPushToCustomer (Helper interno)

Función helper interna (no exportada como Cloud Function) que envía notificaciones push vía **Firebase Cloud Messaging (FCM)**. Busca el `fcmToken` del cliente en Firestore y envía la notificación. Auto-limpia tokens expirados.

### dynamicSitemap (HTTPS)

Genera `sitemap.xml` dinámico con productos y rutas estáticas. Cacheado 1 hora (`Cache-Control: public, max-age=3600`).

---

## Seguridad

### Firestore Security Rules

Las reglas implementan control de acceso basado en roles:

```
isAdmin()     → users/{uid}.role in ['admin', 'superadmin']
isSuperAdmin()→ users/{uid}.role == 'superadmin'
isOwner(uid)  → request.auth.uid == uid
```

Protecciones clave:
- Los clientes no pueden escalar su propio rol
- `inventoryChanges` es inmutable (no se puede editar ni borrar)
- `auditLogs` solo es legible por superadmin
- Las reseñas tienen máximo 2 ediciones
- Los pedidos de guest se protegen por `orderId` (solo lectura para creador)

### Rate Limiting

Implementado con contadores en Firestore:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| createPaymentIntent | 10 | 1 minuto (por IP) |
| geminiProxy | 20 | 1 minuto (por UID) |
| requestAccountDeletion | 5 | 1 hora (por UID) |

### Headers de seguridad (firebase.json)

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: script-src 'self' 'unsafe-inline' https://js.stripe.com ...
Permissions-Policy: camera=(), microphone=(), payment=(self "https://js.stripe.com")
```

### Firebase App Check

Habilitado con reCAPTCHA v3 en producción. Tokens de debug disponibles en desarrollo.

---

## Optimización de rendimiento

### Code Splitting (Vite)

Los chunks están separados manualmente en `vite.config.ts`:

| Chunk | Contenido |
|-------|-----------|
| `vendor-react` | react, react-dom |
| `vendor-firebase-core` | firebase/app, firebase/auth |
| `vendor-firebase-firestore` | firebase/firestore |
| `vendor-firebase-ext` | firebase/functions, storage, app-check |
| `vendor-stripe` | @stripe/stripe-js, @stripe/react-stripe-js |
| `vendor-charts` | recharts |
| `vendor-i18n` | i18next, react-i18next |
| `vendor-sentry` | @sentry/react |
| `vendor-router` | react-router-dom |
| `vendor-icons` | lucide-react |

### Lazy Loading

Componentes pesados se cargan con `React.lazy()`:
- `Hero3D`, `Storefront`, `ProductPage`, `AdminPanel`, `CheckoutPage`, `MyAccountPage`, `CustomerAuthModal`, `RepairLookup`, `LegalPage`, `NotFound`, `CookieConsentBanner`

### Caching (PWA + Hosting)

- **JS/CSS/Fonts**: 1 año, immutable (hash en nombre)
- **HTML/Manifest**: no-cache
- **Google Fonts**: StaleWhileRevalidate (1 año)
- **Imágenes Unsplash**: NetworkFirst (30 días, máx 50 entries)

### i18n

- Solo español se incluye en el bundle principal
- Los demás idiomas se cargan bajo demanda cuando el usuario los selecciona

---

## Tests

**Framework**: Vitest 4.0.18 con JSDOM
**Setup**: `tests/setup.ts`
**Coverage**: v8 provider (text, JSON, HTML reporters)

```bash
npm test                 # Modo watch
npm run test:run         # Una ejecución (CI)
npm run test:coverage    # Con reporte de cobertura
npm run test:ui          # UI interactiva de Vitest
```

**Estructura de tests**:
- `tests/components/` — Tests de componentes React (CheckoutPage, OrdersManager, StripePaymentForm, NavBar)
- `tests/hooks/` — Tests de hooks (useCart, useCheckout, useCustomerAuth, useFavorites)
- `tests/services/` — Tests de servicios (productService, orderService, promoCodeService, analytics)

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

Se ejecuta en push y PR a `main`:

```
1. lint-and-typecheck
   ├── npm run lint (ESLint)
   └── npx tsc --noEmit (TypeScript)

2. test
   └── npm run test:run (Vitest)

3. build (depende de 1 y 2)
   ├── npm run build
   └── Alerta si algún chunk > 700KB
```

### Despliegue manual

```bash
# Todo
firebase deploy

# Solo hosting (frontend)
firebase deploy --only hosting

# Solo funciones (backend)
firebase deploy --only functions

# Solo reglas de seguridad
firebase deploy --only firestore:rules,storage
```

---

## Flujo de pago (detallado)

```
Cliente                      Frontend                    Cloud Function              Stripe
  │                             │                             │                        │
  ├─ Completa checkout ──────▶ │                             │                        │
  │                             ├─ createPaymentIntent() ──▶ │                        │
  │                             │                             ├─ Valida items          │
  │                             │                             ├─ Lee precios Firestore │
  │                             │                             ├─ Aplica promo          │
  │                             │                             ├─ Calcula total ────────▶ PaymentIntent
  │                             │                             │◀─── clientSecret ──────┤
  │                             │◀── clientSecret + total ───┤                        │
  │                             │                             │                        │
  │◀── PaymentElement ─────────┤                             │                        │
  ├─ Ingresa tarjeta ─────────▶│                             │                        │
  │                             ├─ confirmPayment() ─────────────────────────────────▶│
  │                             │                             │                        ├─ Cobra
  │                             │◀── paymentIntent.succeeded ────────────────────────┤
  │                             ├─ onPaymentSuccess()        │                        │
  │                             │                             │◀── Webhook ────────────┤
  │                             │                             ├─ Actualiza orden "Paid"│
  │                             │                             ├─ Envía push            │
  │◀── Pantalla de éxito ──────┤                             │                        │
```

**Importante:** Los precios nunca se envían desde el cliente. La Cloud Function siempre lee los precios directamente de Firestore.

---

## Sistema de diseño

### Paleta de colores (Tailwind CSS custom properties)

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `brand-primary` | #008060 | #008060 | Botones, links, acentos |
| `brand-primary-dark` | #004C3F | #004C3F | Hover states |
| `brand-accent` | #FF6B35 | #fb923c | Destacados, badges |
| `brand-surface` | #FFFFFF | #1e1e1e | Tarjetas, contenedores |
| `brand-border` | #E1E3E5 | #383838 | Líneas divisorias |
| `brand-critical` | #D72C0D | #f87171 | Errores, alertas |
| `brand-success` | #008060 | #008060 | Confirmaciones |
| `brand-warning` | #B98900 | #fbbf24 | Advertencias |

### Tipografía
- **Fuente principal**: Ubuntu (Google Fonts)
- **Pesos**: 300 (light), 400 (regular), 500 (medium), 700 (bold)

### Dark mode
- Activación por clase `.dark` en `<html>`
- Persistido en `localStorage` (`theme-mode`)
- Script inline en `index.html` previene flash de tema incorrecto al cargar

---

## Notas importantes sobre la lógica de negocio

### Precios con IVA incluido
Todos los precios en la base de datos (`price`, `originalPrice`) ya incluyen IVA. El IVA se **extrae** (no se suma) para mostrarlo de forma informativa:
```typescript
tax = discountedSubtotal * ivaRate / (1 + ivaRate)
```

### Carrito con TTL
Los items del carrito en localStorage se limpian automáticamente después de **30 días** de inactividad. El carrito de Firestore se sincroniza con el de localStorage cuando el cliente inicia sesión.

### Favoritos con merge
Al iniciar sesión, los favoritos de localStorage se fusionan con los de Firestore (unión), evitando pérdida de datos en cualquier dirección.

### Normalización de categorías
El servicio `productService.ts` normaliza automáticamente las categorías antiguas en inglés (`Case` → `Carcasa`, `Screen Protector` → `Protector de pantalla`, etc.) al leer productos de Firestore. Esto garantiza compatibilidad sin necesidad de migración manual.

### Compresión de imágenes
Las imágenes de producto se comprimen client-side antes de guardarse como base64 en Firestore:
- Resolución máxima: **800×800px** (se redimensiona manteniendo proporciones)
- Formato: **WebP** con calidad 0.7
- No se usa Firebase Storage: las imágenes se incrustan directamente como data URLs en el documento del producto

### SEO
- **Meta tags dinámicos**: El hook `useDocumentHead` actualiza `<title>`, `<meta description>`, Open Graph y canonical URL por cada página/producto
- **JSON-LD estructurado**: Schema.org `LocalBusiness` + `WebSite` + `SearchAction` en `index.html`
- **Open Graph**: Tags para Facebook/LinkedIn con soporte multi-locale (es_ES, en_US, fr_FR, de_DE, zh_CN)
- **Twitter Card**: `summary_large_image` para previsualización en Twitter/X
- **Sitemap dinámico**: Cloud Function `dynamicSitemap` genera XML con todas las páginas estáticas + productos de Firestore (cacheado 1h)
- **robots.txt**: Permite indexación completa, referencia al sitemap

---

## Posibles mejoras y extensiones

### Corto plazo
- **Verificación de dominio Apple Pay**: Subir archivo `.well-known/apple-developer-merchantid-domain-association` para habilitar Apple Pay en producción
- **Personalización de emails**: Añadir logo, enlace de seguimiento y botón de contacto a la plantilla HTML existente de Resend
- **Paginación de productos**: Implementar cursor-based pagination en Firestore para catálogos grandes (>200 productos)

### Medio plazo
- **Firebase Storage para imágenes**: Migrar de base64 incrustado a Firebase Storage para mejor rendimiento y CDN
- **Búsqueda avanzada**: Integrar Algolia o Typesense para búsqueda full-text con filtros facetados
- **Sistema de cupones por cliente**: Descuentos personalizados por historial de compra
- **Gestión de reparaciones completa**: Expandir el módulo de reparaciones con asignación de técnicos, piezas, y facturación

### Largo plazo
- **Multi-tenancy**: Soporte para múltiples tiendas independientes bajo la misma plataforma
- **App nativa**: Compilar con Capacitor o React Native para distribución en App Store y Google Play
- **Dashboard financiero**: Reportes de P&L, margen por producto, y previsiones con IA
- **Integración con proveedores**: Sincronización automática de stock y precios con distribuidores mayoristas
- **Chat en vivo**: Soporte al cliente integrado con WebSockets