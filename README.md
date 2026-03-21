<div align="center">
<img width="1200" height="475" alt="MovilNova Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MovilNova - Sistema de Gestión para Tiendas de Reparación

**MovilNova** es una plataforma SaaS inteligente diseñada para modernizar la gestión de tiendas de reparación mediante IA, ofreciendo eficiencia operativa y una experiencia de cliente excepcional.

---

## 🚀 Características Principales

### 🛒 Portal del Cliente (Storefront)
- Navegación de servicios y productos
- Reservas online
- Seguimiento de órdenes en tiempo real
- Consulta de historial de reparaciones

### 👨‍💼 Portal del Empleado
- Tablero Kanban de tareas
- Gestión de órdenes de trabajo
- Sistema de asistencia y control horario
- Notificaciones en tiempo real

### 📊 Panel de Administración
- Dashboard con analíticas completas
- Gestión de productos e inventario
- Gestión de pedidos y usuarios
- Reportes y estadísticas de ventas

### 🤖 Asistente IA
- Diagnóstico inteligente de dispositivos
- Soporte al cliente automatizado
- Sugerencias para órdenes de trabajo
- Integración con Gemini API

---

## 💻 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **IA**: Google Gemini API
- **Internacionalización**: i18next (ES, EN, ZH, FR, DE)

---

## 📦 Instalación y Ejecución Local

### Requisitos Previos

- Node.js (versión 18 o superior)
- Cuenta de Firebase
- API Key de Gemini

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd galaxia-phone-copia
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

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

4. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`

5. **Construir para producción**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🔐 Configuración de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Activa **Authentication**, **Firestore Database** y **Storage**

### 2. Configurar Authentication

- Habilita los métodos de autenticación: Email/Password
- Crea un usuario administrador

### 3. Estructura de Firestore

Consulta el archivo [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md) para ver la estructura completa de las colecciones necesarias:

- `products` - Catálogo de productos
- `customers` - Perfiles de clientes
- `users` - Roles y permisos (admin/customer)
- `orders` - Pedidos (opcional)

### 4. Reglas de Seguridad

Configura las reglas de seguridad en Firestore Console según lo especificado en [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md).

---

## 🧪 Testing y Validación

```bash
# Verificación de tipos TypeScript
npx tsc --noEmit

# Ejecutar linter
npm run lint

# Build de producción
npm run build
```

---

## 📁 Estructura del Proyecto

```
/
├── components/           # Componentes React
│   ├── AdminPanel.tsx       # Panel admin principal
│   ├── ProductManager.tsx   # Gestión de productos
│   ├── OrdersManager.tsx    # Gestión de pedidos
│   ├── UsersManager.tsx     # Gestión de usuarios
│   ├── StatsManager.tsx     # Dashboard y estadísticas
│   ├── Storefront.tsx       # Tienda online
│   ├── AIAssistant.tsx      # Asistente IA
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

---

## 🌍 Idiomas Soportados

- 🇪🇸 Español (por defecto)
- 🇬🇧 English
- 🇨🇳 中文 (Chino)
- 🇫🇷 Français
- 🇩🇪 Deutsch

---

## 📖 Documentación

- [AGENTS.md](./AGENTS.md) - Sistema de agentes para desarrollo colaborativo
- [CONTEXT.md](./CONTEXT.md) - Contexto técnico del proyecto
- [PRODUCT.md](./PRODUCT.md) - Documento de producto y estrategia
- [FIRESTORE_STRUCTURE.md](./FIRESTORE_STRUCTURE.md) - Estructura de base de datos
- [DESIGN_TOKENS.md](./docs/DESIGN_TOKENS.md) - Sistema de diseño

---

## 🔒 Cumplimiento Legal

El proyecto incluye un sistema de consentimiento de cookies conforme a:
- **RGPD** (Reglamento General de Protección de Datos)
- **LSSI-CE** (Ley de Servicios de la Sociedad de la Información - España)

---

## 🤝 Contribución

Este proyecto utiliza un sistema de agentes especializados para el desarrollo. Consulta [AGENTS.md](./AGENTS.md) para entender el flujo de trabajo.

---

## 📄 Licencia

[Especifica tu licencia aquí]

---

## 📧 Contacto

Para soporte o consultas, contacta al equipo de desarrollo.

---

**Fecha de última actualización**: Febrero 2026
