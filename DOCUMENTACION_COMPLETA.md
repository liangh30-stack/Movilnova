# Documentación Completa del Proyecto MovilNova

**Última actualización**: Febrero 2026

---

## Índice

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Instalación y Configuración](#2-instalación-y-configuración)
3. [Posicionamiento del Producto](#3-posicionamiento-del-producto)
4. [Contexto Técnico](#4-contexto-técnico)
5. [Sistema de Agentes](#5-sistema-de-agentes)
6. [Sistema de Diseño](#6-sistema-de-diseño)
7. [Estructura de Base de Datos](#7-estructura-de-base-de-datos)
8. [Retroalimentación y Mejoras](#8-retroalimentación-y-mejoras)

---

## 1. Visión General del Proyecto

### ¿Qué es MovilNova?

**MovilNova** es una plataforma SaaS inteligente diseñada para modernizar la gestión de talleres de reparación mediante IA, ofreciendo eficiencia operativa y una experiencia de cliente excepcional.

### Posicionamiento en Una Frase

MovilNova es una plataforma de gestión inteligente para talleres de reparación modernos que mejora la eficiencia de las reparaciones y la experiencia del cliente a través de IA.

### Visión del Producto

Permitir que cada taller de reparación ofrezca una experiencia de servicio profesional, transparente y eficiente.

### Características Principales

#### 🛒 Portal del Cliente (Storefront)
- Navegación de servicios y productos
- Reservas online
- Seguimiento de órdenes en tiempo real
- Consulta de historial de reparaciones

#### 👨‍💼 Portal del Empleado
- Tablero Kanban de tareas
- Gestión de órdenes de trabajo
- Sistema de asistencia y control horario
- Notificaciones en tiempo real

#### 📊 Panel de Administración
- Dashboard con analíticas completas
- Gestión de productos e inventario
- Gestión de pedidos y usuarios
- Reportes y estadísticas de ventas

#### 🤖 Asistente IA
- Diagnóstico inteligente de dispositivos
- Soporte al cliente automatizado
- Sugerencias para órdenes de trabajo
- Integración con Gemini API

---

## 2. Instalación y Configuración

### Requisitos Previos

- Node.js (versión 18 o superior)
- Cuenta de Firebase
- API Key de Gemini

### Pasos de Instalación

#### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd galaxia-phone-copia
```

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# Gemini API
VITE_GEMINI_API_KEY=tu_gemini_api_key
```

> **Importante**: Todas las variables de entorno deben comenzar con `VITE_` para ser accesibles en el cliente.

#### 4. Ejecutar el servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

#### 5. Construir para producción
```bash
npm run build
npm run preview
```

### Configuración de Firebase

#### Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Activa **Authentication**, **Firestore Database** y **Storage**

#### Configurar Authentication

- Habilita los métodos de autenticación: Email/Password
- Crea un usuario administrador

#### Configurar Firestore

Consulta la sección [Estructura de Base de Datos](#7-estructura-de-base-de-datos) para la configuración completa de colecciones y reglas de seguridad.

---

## 3. Posicionamiento del Producto

### Usuarios Objetivo

#### 1. Propietario del Taller (Owner)
**Perfil**:
- Edad: 30-50 años
- Opera 1-5 tiendas
- Nivel técnico: Básico
- Puntos de dolor: Gestión caótica, baja eficiencia, pérdida de clientes

**Necesidades**:
- Gestión todo-en-uno de todas las operaciones
- Reportes de datos claros
- Reducir errores humanos
- Mejorar satisfacción del cliente

#### 2. Técnico de Reparación (Technician)
**Perfil**:
- Edad: 20-40 años
- Personal técnico profesional
- Maneja 5-20 órdenes de trabajo diarias
- Puntos de dolor: Información dispersa, comunicación ineficiente

**Necesidades**:
- Lista clara de tareas
- Registro rápido de información de reparación
- Diagnóstico asistido por IA
- Reducir trabajo repetitivo

#### 3. Cliente (End Customer)
**Perfil**:
- Individuos/empresas que necesitan servicios de reparación
- Esperan transparencia, rapidez y seguimiento

**Necesidades**:
- Reservas convenientes
- Ver progreso de reparación en tiempo real
- Cotizaciones claras
- Comunicación rápida

### Propuesta de Valor Central

#### Para Talleres de Reparación
| Valor | Descripción |
|-------|-------------|
| **Mejora de Eficiencia** | Diagnóstico asistido por IA, reduce 30% el tiempo de diagnóstico |
| **Gestión Simplificada** | Una plataforma para gestionar órdenes de trabajo, inventario, empleados |
| **Retención de Clientes** | Proceso de servicio transparente mejora satisfacción del cliente |
| **Insights de Datos** | Visualización de datos de negocio para apoyar decisiones |

#### Para Clientes
| Valor | Descripción |
|-------|-------------|
| **Reserva Conveniente** | Reservar online, sin necesidad de llamar |
| **Seguimiento Transparente** | Conocer progreso de reparación en tiempo real |
| **Servicio Profesional** | Asistencia IA asegura diagnóstico preciso |

### Estrategia de Precios

| Plan | Precio | Adecuado Para |
|------|--------|---------------|
| **Starter** | €299/mes | Tienda única, <3 empleados |
| **Pro** | €699/mes | Tienda única, empleados ilimitados |
| **Business** | €1499/mes | Multi-tienda, funcionalidades avanzadas |
| **Enterprise** | Personalizado | Cadenas grandes |

### Métricas de Éxito

#### Métrica Estrella del Norte
**Órdenes de Reparación Activas Mensuales** (Monthly Active Repair Orders)

#### Métricas Clave
| Métrica | Objetivo |
|---------|----------|
| Tasa de conversión de registro de clientes | > 5% |
| Tasa de completación de órdenes de trabajo | > 95% |
| Satisfacción del cliente (CSAT) | > 4.5/5 |
| Tasa de retención mensual | > 80% |
| Tasa de adopción de diagnóstico IA | > 60% |

---

## 4. Contexto Técnico

### Stack Tecnológico

#### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Seguridad de Tipos |
| Vite | 5.x | Herramienta de Build |
| Tailwind CSS | 3.x | Framework de Estilos |

#### Servicios Backend
| Servicio | Propósito |
|----------|-----------|
| Firebase Auth | Autenticación de Usuarios |
| Firestore | Base de Datos |
| Gemini API | Funcionalidad IA |

### Estructura del Proyecto

```
/movilnova
├── components/           # Componentes React
│   ├── AIAssistant.tsx      # Asistente de chat IA
│   ├── AdminPanel.tsx       # Panel admin principal
│   ├── ProductManager.tsx   # Gestión de productos
│   ├── OrdersManager.tsx    # Gestión de pedidos
│   ├── UsersManager.tsx     # Gestión de usuarios
│   ├── StatsManager.tsx     # Dashboard y estadísticas
│   ├── Storefront.tsx       # Tienda online
│   ├── Dashboard.tsx        # Dashboard de gestión
│   └── ...
│
├── services/             # Servicios y lógica de negocio
│   ├── firebase.ts          # Configuración Firebase
│   ├── authService.ts       # Autenticación
│   ├── productService.ts    # Gestión de productos
│   └── geminiService.ts     # Integración Gemini
│
├── hooks/                # Custom React Hooks
│   ├── useCookieConsent.ts  # Consentimiento de cookies
│   └── useCustomerAuth.ts   # Autenticación de clientes
│
├── i18n/                 # Internacionalización
│   ├── config.ts            # Configuración i18next
│   └── locales/             # Traducciones (es, en, zh, fr, de)
│
├── types.ts              # Definiciones TypeScript
├── constants.ts          # Constantes globales
└── App.tsx               # Componente principal
```

### Restricciones de Diseño

#### Debe Cumplirse
- Modo estricto de TypeScript (`strict: true`)
- Principio de responsabilidad única de componentes
- Prioridad a clases nativas de Tailwind
- Reglas de seguridad de Firebase

#### Prohibiciones
- Usar tipo `any`
- Estilos inline (excepto valores dinámicos)
- Almacenar información sensible en el cliente
- Promise rejection sin manejar

### Convenciones de Nomenclatura

#### Nomenclatura de Archivos
- Componentes: `PascalCase.tsx` (ej., `RepairForm.tsx`)
- Servicios: `camelCase.ts` (ej., `authService.ts`)
- Tipos: `camelCase.ts` o inline

#### Nomenclatura de Variables
- Componentes: `PascalCase`
- Funciones: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Tipos/Interfaces: `PascalCase`

### Flujo de Trabajo Git

#### Estrategia de Ramas
- `main`: Entorno de producción
- `develop`: Entorno de desarrollo
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Corrección de bugs

#### Convención de Commits
```
<type>(<scope>): <description>

type: feat | fix | docs | style | refactor | test | chore
scope: nombre del componente o módulo
```

### Comandos de Tareas Comunes

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Vista previa del build
npm run preview

# Verificación de tipos
npx tsc --noEmit

# Lint
npm run lint
```

---

## 5. Sistema de Agentes

### Arquitectura de Colaboración

```
Solicitud del Usuario
     │
     ▼
Product-Strategist ◄── Clarificar requisitos y posicionamiento
     │
     ▼
Frontend-Architect ◄── Decidir arquitectura y estructura
     │
    ┌┴┐
    ▼ ▼
UI-Design + Tech-Copywriter ◄── En paralelo: Diseño + Redacción
     │
     ▼
Claude-Code-Engineer ◄── Integración e implementación
     │
     ▼
QA-Reviewer ◄── Revisión de calidad
     │
     ▼
SEO-Performance ◄── Optimización (opcional)
```

### Agentes Disponibles

#### 1. Product-Strategist (Estratega de Producto)
- **Propósito**: Clarificar posicionamiento y diferenciación del producto
- **Activación**: Nuevas funcionalidades, historias de usuario, análisis de competencia
- **Salida**: Análisis de estrategia, definición de problemas, prioridades

#### 2. Frontend-Architect (Arquitecto Frontend)
- **Propósito**: Diseñar estructuras de componentes mantenibles y escalables
- **Activación**: Nueva página/módulo, refactorización, optimización de rendimiento
- **Salida**: Decisiones arquitectónicas, estructura de archivos, división de componentes

#### 3. UI-Design-Engineer (Ingeniero de Diseño UI)
- **Propósito**: Diseñar UI que coincida con el tono de marca
- **Activación**: Nuevos componentes UI, optimización de estilos, layouts responsivos
- **Salida**: Especificaciones visuales, clases Tailwind, estados de interacción

#### 4. Tech-Copywriter (Especialista en Redacción Tech)
- **Propósito**: Redactar propuestas de valor claras
- **Activación**: Textos Hero, descripciones de características, CTAs, mensajes de error
- **Salida**: Textos optimizados, múltiples opciones, razonamiento

#### 5. Claude-Code-Engineer (Ingeniero de Implementación)
- **Propósito**: Escribir código ejecutable de alta calidad
- **Activación**: Implementar componentes, corregir bugs, refactorizar código
- **Salida**: Código completo y ejecutable con tipos TypeScript completos

#### 6. QA-Reviewer (Revisor de Calidad)
- **Propósito**: Verificar calidad de código línea por línea
- **Activación**: Pre-commit, revisión de PR, chequeo pre-lanzamiento
- **Salida**: Reporte de revisión, lista de problemas, sugerencias

#### 7. SEO-Performance-Agent (SEO y Rendimiento)
- **Propósito**: Analizar cuellos de botella de rendimiento
- **Activación**: Optimización pre-lanzamiento, problemas de rendimiento, auditoría SEO
- **Salida**: Reporte Lighthouse, problemas de rendimiento, sugerencias de optimización

---

## 6. Sistema de Diseño

### Colores

| Token | Valor | Propósito |
|-------|-------|-----------|
| `brand.primary` | `#1e3a5f` | Color principal, confianza, profesional |
| `brand.accent` | `#f97316` | Color de énfasis, CTA, destacados |
| `brand.dark` | `#0f172a` | Fondo oscuro, títulos |
| `brand.light` | `#f8fafc` | Fondo claro |

#### Colores Semánticos
- Éxito: `green-500` / `#22c55e`
- Advertencia: `yellow-500` / `#eab308`
- Error: `red-500` / `#ef4444`
- Información: `blue-500` / `#3b82f6`

### Tipografía

| Token | Valor | Propósito |
|-------|-------|-----------|
| `font-sans` | Poppins, sans-serif | Fuente global predeterminada |
| Título H1 | `text-4xl md:text-6xl font-black` | Título principal Hero |
| Título H2 | `text-2xl md:text-4xl font-bold` | Título de sección |
| Título H3 | `text-xl font-semibold` | Título de tarjeta |
| Cuerpo de texto | `text-base` | Texto por defecto |
| Texto pequeño | `text-sm` | Información auxiliar |

### Espaciado

| Token | Valor | Propósito |
|-------|-------|-----------|
| Padding del contenedor | `px-4` / `md:px-6` | Margen de página |
| Espaciado entre bloques | `gap-6` / `gap-8` | Espaciado entre componentes |
| Padding interno de tarjeta | `p-6` | Contenido de tarjeta |
| Padding de botón | `px-6 py-3` / `px-8 py-4` | Tamaño de botón |

### Bordes Redondeados

| Token | Valor | Propósito |
|-------|-------|-----------|
| Pequeño | `rounded-lg` (8px) | Botones, campos de entrada |
| Mediano | `rounded-xl` (12px) | Tarjetas |
| Grande | `rounded-2xl` (16px) | Tarjetas grandes, modales |
| Círculo completo | `rounded-full` | Insignias, avatares |

### Puntos de Quiebre Responsivos

| Punto de quiebre | Ancho | Propósito |
|------------------|-------|-----------|
| móvil | < 640px | Teléfonos |
| tablet | 640px - 1024px | Tabletas |
| escritorio | > 1024px | Escritorio |

Prefijos Tailwind: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

### Normas de Uso

1. **Priorizar clases de Tailwind**, evitar CSS personalizado
2. **Colores** usar `brand-*` o colores semánticos de Tailwind
3. **Espaciado** usar múltiplos de 4 (4, 8, 12, 16, 24, 32)
4. **Mantener consistencia**: Los nuevos componentes deben seguir los patrones de estilo existentes

---

## 7. Estructura de Base de Datos

### Colecciones de Firestore

#### Collection: `products`
**Descripción**: Catálogo de productos de la tienda online.

```typescript
{
  id: string;                    // ID autogenerado por Firestore
  name: string;                  // Nombre del producto
  price: number;                 // Precio actual en €
  originalPrice?: number;        // Precio original (si hay descuento)
  category: string;              // Categoría del producto
  brand?: string;                // Marca
  compatibleModels?: string[];   // Modelos compatibles
  image: string;                 // URL de la imagen
  description: string;           // Descripción
  isBundle?: boolean;            // Si es un pack/bundle
  createdAt?: Timestamp;         // Fecha de creación
  updatedAt?: Timestamp;         // Última actualización
}
```

#### Collection: `customers`
**Descripción**: Perfiles de clientes registrados con Firebase Auth.

```typescript
{
  uid: string;              // UID de Firebase Auth
  email: string;            // Email del cliente
  displayName?: string;     // Nombre completo
  phone?: string;           // Teléfono
  createdAt: string;        // ISO timestamp de registro
  updatedAt: string;        // ISO timestamp última actualización
}
```

**Subcollection**: `customers/{uid}/addresses`
```typescript
{
  id: string;               // ID de la dirección
  label: string;            // Etiqueta: "Casa", "Trabajo"
  street: string;           // Dirección completa
  city: string;             // Ciudad
  postalCode: string;       // Código postal
  country: string;          // País
  isDefault: boolean;       // Si es la dirección predeterminada
}
```

#### Collection: `users`
**Descripción**: Roles globales de usuarios (admin/customer).

```typescript
{
  email: string;            // Email del usuario
  role: "admin" | "customer";  // Rol del usuario
  createdAt: Timestamp;     // Fecha de creación
}
```

**Importante**: El `uid` del documento debe coincidir con el UID de Firebase Auth.

#### Collection: `orders` (Opcional)
**Descripción**: Pedidos globales de la tienda.

```typescript
{
  id: string;               // ID del pedido
  customerName: string;     // Nombre del cliente
  email?: string;           // Email del cliente
  phone?: string;           // Teléfono
  address?: string;         // Dirección de envío
  date: string;             // ISO timestamp
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  payment?: string;         // Método de pago
}
```

### Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isCustomer() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'customer';
    }

    // Products: Admin read/write, customer read only
    match /products/{productId} {
      allow read: if true;  // Público
      allow write: if isAdmin();
    }

    // Customers: Solo el propio usuario o admin
    match /customers/{userId} {
      allow read, write: if request.auth != null &&
                            (request.auth.uid == userId || isAdmin());

      match /addresses/{addressId} {
        allow read, write: if request.auth != null &&
                              (request.auth.uid == userId || isAdmin());
      }

      match /orders/{orderId} {
        allow read: if request.auth != null &&
                       (request.auth.uid == userId || isAdmin());
        allow create: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Users: Solo admin puede modificar roles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if isAdmin();
    }

    // Orders: Admin full access, customer read own
    match /orders/{orderId} {
      allow read: if isAdmin() ||
                     (request.auth != null && resource.data.customerId == request.auth.uid);
      allow write: if isAdmin();
    }
  }
}
```

---

## 8. Retroalimentación y Mejoras

### Aspectos Positivos

- **Posicionamiento claro**: Una frase y tres tipos de usuarios bien definidos
- **Alcance MVP definido**: Funcionalidades implementadas/planificadas por fases
- **Stack tecnológico unificado**: React + TypeScript + Firebase + Gemini
- **División de agentes clara**: Flujo de trabajo bien estructurado
- **Multi-idioma implementado**: i18n en 5 idiomas

### Áreas de Mejora

#### Producto y Documentación
- ~~**README no coincide con producto**~~ ✅ CORREGIDO
- **Métricas de éxito no implementadas**: Falta implementar seguimiento de métricas clave
- **Estrategia de precios no implementada**: Falta página de precios en el producto

#### Calidad y Mantenibilidad
- **Cobertura de tests insuficiente**: Solo existe `authService.test.ts`
- **Tipos y constantes**: Verificar alineación con modelo de Firestore
- **Errores y límites**: Unificar manejo de errores en rutas clave

#### Experiencia y Consistencia
- **Unificación de experiencia**: Verificar consistencia entre tres portales
- **Móvil**: Especificar layouts y optimizaciones táctiles
- **Accesibilidad**: Crear lista formal de verificación a11y

### Próximos Pasos Sugeridos

1. **Inmediato**: ✅ README actualizado a español y productizado
2. **Corto plazo**:
   - Agregar 2-3 tests clave para rutas principales
   - Documentar principios de móvil y a11y
3. **Medio plazo**:
   - Implementar página de precios
   - Definir checklist de pre-publicación
4. **Largo plazo**:
   - Conectar métrica estrella del norte a seguimiento/reportes

---

## Idiomas Soportados

- 🇪🇸 Español (por defecto)
- 🇬🇧 English
- 🇨🇳 中文 (Chino)
- 🇫🇷 Français
- 🇩🇪 Deutsch

---

## Cumplimiento Legal

El proyecto incluye un sistema de consentimiento de cookies conforme a:
- **RGPD** (Reglamento General de Protección de Datos)
- **LSSI-CE** (Ley de Servicios de la Sociedad de la Información - España)

---

## Documentación de Referencia

- [README.md](./README.md) - Guía de inicio rápido
- [AGENTS.md](./AGENTS.md) - Sistema de agentes colaborativos
- [CONTEXT.md](./CONTEXT.md) - Contexto técnico detallado
- [PRODUCT.md](./PRODUCT.md) - Estrategia y posicionamiento de producto
- [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md) - Estructura completa de base de datos
- [DESIGN_TOKENS.md](./docs/DESIGN_TOKENS.md) - Sistema de diseño completo
- [FEEDBACK.md](./FEEDBACK.md) - Retroalimentación del equipo

---

**Fecha de última actualización**: Febrero 2026
**Versión del Documento**: 1.0
