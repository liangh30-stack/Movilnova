# Estructura de Firestore para Panel de Administración

Este documento describe la estructura completa de colecciones y documentos en Firestore necesaria para el panel de administración de MovilNova.

---

## Collections Overview

```
/
├── products/               # Catálogo de productos de la tienda
├── customers/              # Perfiles de clientes registrados
├── users/                  # Roles globales (admin/customer)
├── orders/                 # Pedidos realizados (si usas Firestore para pedidos)
└── repairs/                # Órdenes de reparación (opcional)
```

---

## 1. Collection: `products`

**Descripción:** Catálogo de productos de la tienda online.

### Document Structure

```typescript
{
  id: string;                    // ID autogenerado por Firestore
  name: string;                  // Nombre del producto
  price: number;                 // Precio actual en €
  originalPrice?: number;        // Precio original (si hay descuento)
  category: string;              // Categoría: "Case" | "Screen Protector" | "Charger" | "Cable" | "Power Bank" | "Strap" | "Audio" | "Bundle"
  brand?: string;                // Marca: "Apple" | "Samsung" | "Xiaomi" | etc. (opcional)
  compatibleModels?: string[];   // Array de modelos compatibles (opcional)
  image: string;                 // URL de la imagen del producto
  description: string;           // Descripción del producto
  isBundle?: boolean;            // Si es un pack/bundle
  createdAt?: Timestamp;         // Fecha de creación (opcional)
  updatedAt?: Timestamp;         // Última actualización (opcional)
}
```

### Ejemplo

```json
{
  "id": "prod_abc123",
  "name": "Pink Marble Dream Case",
  "price": 15.99,
  "originalPrice": 29.99,
  "category": "Case",
  "brand": "Apple",
  "compatibleModels": ["iPhone 15 Pro", "iPhone 15 Pro Max"],
  "image": "https://example.com/image.jpg",
  "description": "Elegant marble design with shock absorption",
  "isBundle": false,
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-02-10T14:22:00Z"
}
```

### Firestore Console Path

`Firestore Database → products → [document_id]`

---

## 2. Collection: `customers`

**Descripción:** Perfiles de clientes registrados con Firebase Auth.

### Document Structure

```typescript
{
  uid: string;              // UID de Firebase Auth (igual al document ID)
  email: string;            // Email del cliente
  displayName?: string;     // Nombre completo
  phone?: string;           // Teléfono (opcional)
  createdAt: string;        // ISO timestamp de registro
  updatedAt: string;        // ISO timestamp última actualización
}
```

### Subcollection: `customers/{uid}/addresses`

Direcciones de envío del cliente:

```typescript
{
  id: string;               // ID de la dirección
  label: string;            // Etiqueta: "Casa", "Trabajo", etc.
  street: string;           // Dirección completa
  city: string;             // Ciudad
  postalCode: string;       // Código postal
  country: string;          // País
  isDefault: boolean;       // Si es la dirección predeterminada
}
```

### Subcollection: `customers/{uid}/orders`

Pedidos históricos del cliente (si guardas en Firestore):

```typescript
{
  id: string;               // ID del pedido
  date: string;             // ISO timestamp
  status: string;           // "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;            // Total del pedido
}
```

### Ejemplo

```json
{
  "uid": "cust_xyz789",
  "email": "cliente@example.com",
  "displayName": "María García",
  "phone": "+34 600 123 456",
  "createdAt": "2026-01-20T08:15:00Z",
  "updatedAt": "2026-02-05T12:30:00Z"
}
```

### Firestore Console Path

`Firestore Database → customers → [uid]`

---

## 3. Collection: `users`

**Descripción:** Roles globales de usuarios (admin/customer).

### Document Structure

```typescript
{
  email: string;            // Email del usuario
  role: "admin" | "customer";  // Rol del usuario
  createdAt: Timestamp;     // Fecha de creación
}
```

### Ejemplo (Admin)

```json
{
  "email": "admin@movilnova.com",
  "role": "admin",
  "createdAt": "2026-01-10T00:00:00Z"
}
```

### Ejemplo (Customer)

```json
{
  "email": "cliente@example.com",
  "role": "customer",
  "createdAt": "2026-01-20T08:15:00Z"
}
```

### Firestore Console Path

`Firestore Database → users → [uid]`

**Importante:** El `uid` del documento debe coincidir con el UID de Firebase Auth.

---

## 4. Collection: `orders` (Opcional)

**Descripción:** Pedidos globales de la tienda (si prefieres Firestore en lugar de localStorage).

### Document Structure

```typescript
{
  id: string;               // ID del pedido (e.g., "ORD-1707567890123")
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
  payment?: string;         // Método de pago: "stripe" | "paypal" | etc.
}
```

### Ejemplo

```json
{
  "id": "ORD-1707567890123",
  "customerName": "Pedro López",
  "email": "pedro@example.com",
  "phone": "+34 612 345 678",
  "address": "Calle Mayor 123, Madrid 28001",
  "date": "2026-02-10T15:30:00Z",
  "status": "pending",
  "items": [
    {
      "id": "prod_abc123",
      "name": "Pink Marble Dream Case",
      "price": 15.99,
      "quantity": 2,
      "image": "https://example.com/image.jpg"
    }
  ],
  "payment": "stripe"
}
```

### Firestore Console Path

`Firestore Database → orders → [order_id]`

---

## 5. Collection: `repairs` (Opcional)

**Descripción:** Órdenes de reparación de dispositivos.

### Document Structure

```typescript
{
  id: string;               // ID de reparación
  customerName: string;     // Nombre del cliente
  phone: string;            // Teléfono
  device: string;           // Dispositivo (e.g., "iPhone 15 Pro")
  issue: string;            // Descripción del problema
  status: string;           // "received" | "diagnosing" | "repairing" | "ready" | "delivered"
  technician?: string;      // Técnico asignado
  price?: number;           // Precio de la reparación
  date: string;             // ISO timestamp
}
```

### Ejemplo

```json
{
  "id": "REP-001",
  "customerName": "Ana Martínez",
  "phone": "+34 654 321 098",
  "device": "iPhone 14",
  "issue": "Pantalla rota",
  "status": "diagnosing",
  "technician": "Carlos",
  "price": 120.00,
  "date": "2026-02-08T10:00:00Z"
}
```

### Firestore Console Path

`Firestore Database → repairs → [repair_id]`

---

## Cómo Crear la Estructura en Firestore

### Opción 1: Manualmente desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto → **Firestore Database**
3. Click **Start collection**
4. Crear cada colección e insertar documentos de prueba

### Opción 2: Usar Script de Inicialización

Crea un script `scripts/initFirestore.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function init() {
  // 1. Crear usuario admin
  const adminUser = await admin.auth().createUser({
    email: 'admin@movilnova.com',
    password: 'Admin123!',
    emailVerified: true,
  });

  await db.collection('users').doc(adminUser.uid).set({
    email: 'admin@movilnova.com',
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Admin creado:', adminUser.uid);

  // 2. Crear producto de prueba
  await db.collection('products').add({
    name: 'Pink Marble Case',
    price: 15.99,
    originalPrice: 29.99,
    category: 'Case',
    brand: 'Apple',
    image: 'https://via.placeholder.com/200',
    description: 'Elegant marble design',
    isBundle: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Producto de prueba creado');
  console.log('🎉 Inicialización completa');
}

init().catch(console.error);
```

Ejecutar:
```bash
node scripts/initFirestore.js
```

---

## Firestore Security Rules

Agregar en Firebase Console → Firestore → Rules:

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

    // Repairs: Admin full access
    match /repairs/{repairId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## Migración de Datos

Si actualmente usas localStorage y quieres migrar a Firestore:

### Productos
El ProductManager ya incluye el botón **"Importar Datos Demo"** que sube los productos mock a Firestore.

### Pedidos
```javascript
// Migrar pedidos de localStorage a Firestore
const orders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
const batch = db.batch();
orders.forEach(order => {
  const ref = db.collection('orders').doc(order.id);
  batch.set(ref, order);
});
await batch.commit();
```

---

## Checklist de Configuración

- [ ] Firebase project creado
- [ ] Firestore Database activado
- [ ] Collection `products` creada
- [ ] Collection `customers` creada
- [ ] Collection `users` creada
- [ ] Usuario admin creado en `users` con `role: "admin"`
- [ ] Firestore Security Rules configuradas
- [ ] (Opcional) Firebase Storage configurado para imágenes
- [ ] (Opcional) Cloud Functions configuradas para Custom Claims

---

## Recursos

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)

---

Fecha: 2026-02-11
