# 🔧 Sistema de Carrito y Órdenes - Simplificado

## Cambios Realizados ✅

Se ha rehecho completamente el sistema de carrito y creación de órdenes para hacerlo más robusto, simple y libre de errores de permisos.

### 1. Nueva Arquitectura

**Flujo Anterior (Problemático)**:
- ❌ Cliente crea orden con estado "Paid"
- ❌ Sistema decrementa stock automáticamente desde el cliente
- ❌ Requiere permisos complejos para que clientes modifiquen productos
- ❌ Problemas de seguridad y permisos

**Flujo Nuevo (Optimizado)**:
- ✅ Cliente crea orden con estado "Pending"
- ✅ Admin revisa y marca como "Paid" manualmente
- ✅ El cambio de estado a "Paid" dispara el decremento de stock
- ✅ Stock solo se modifica por admins (más seguro)
- ✅ Sin errores de permisos

### 2. Archivos Modificados

#### a) `hooks/useCheckout.ts`
- Crea órdenes con estado `'Pending'` en lugar de `'Paid'`
- No intenta decrementar stock desde el cliente

#### b) `services/orderService.ts`
- La función `createOrder` ya no decrementa stock automáticamente
- La función `updateOrderStatus` decrementa stock cuando admin marca como Paid/Processing

#### c) `components/OrdersManager.tsx`
- Conectado a Firestore en tiempo real
- Muestra indicador visual cuando cambiar estado descontará stock
- Estados actualizados: Pending, Processing, Paid, Shipped, Delivered, Cancelled

#### d) `firestore.rules`
- **Simplificadas**: Products solo modificables por admins
- Orders: creación pública, lectura para owner/admin, modificación solo admin
- InventoryChanges: solo admins pueden crear/leer (audit trail)

## Reglas de Seguridad

### 📦 Products
```javascript
match /products/{productId} {
  allow read: if true;                    // Todos pueden leer
  allow create, update, delete: if isAdmin();  // Solo admins escriben
}
```

### 🛒 Orders
```javascript
match /orders/{orderId} {
  allow create: if true;                  // Checkout sin auth
  allow read: if isAdmin() ||             // Admin ve todo
                (isSignedIn() && resource.data.customerId == request.auth.uid);
  allow update, delete: if isAdmin();     // Solo admin modifica
}
```

### 📊 Inventory Changes
```javascript
match /inventoryChanges/{changeId} {
  allow create: if isAdmin();             // Solo admin crea logs
  allow read: if isAdmin();               // Solo admin lee logs
  allow update, delete: if false;         // Inmutable
}
```

### 👤 Users
```javascript
match /users/{userId} {
  allow read: if isSignedIn();            // Para verificar roles
  allow write: if isAdmin();              // Solo admin modifica
}
```

## Flujo de Compra

### Cliente (Sin Autenticación)
1. Agrega productos al carrito
2. Procede al checkout
3. Llena información (nombre, email, teléfono, dirección)
4. Selecciona método de pago (demo, no real)
5. **Orden creada como "Pending"** ✅

### Administrador
1. Ve la orden en tiempo real en el panel admin
2. Verifica el pedido
3. **Marca como "Paid"** (esto decrementa stock automáticamente)
4. Puede cambiar a "Processing" → "Shipped" → "Delivered"
5. Puede cancelar con "Cancelled"

## Estados de Orden

| Estado | Descripción | Decrementa Stock |
|--------|-------------|------------------|
| **Pending** | Orden creada, esperando confirmación | ❌ No |
| **Processing** | Admin está procesando el pedido | ✅ Sí (si era Pending antes) |
| **Paid** | Pago confirmado por admin | ✅ Sí (si era Pending antes) |
| **Shipped** | Pedido enviado | ❌ No (ya descontado) |
| **Delivered** | Pedido entregado | ❌ No (ya descontado) |
| **Cancelled** | Pedido cancelado | ❌ No (no se reintegra stock) |

## Despliegue de Reglas

### Opción A: Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Rules**
4. Copia el contenido de `firestore.rules`
5. Click en **Publish**

### Opción B: Firebase CLI

```bash
# Instala Firebase CLI si no la tienes
npm install -g firebase-tools

# Inicia sesión
firebase login

# Despliega solo las reglas
firebase deploy --only firestore:rules
```

## Verificación

### 1. Crear Orden (Cliente)
- ✅ Navega a la tienda
- ✅ Agrega productos al carrito
- ✅ Completa el checkout
- ✅ Orden creada con estado "Pending"
- ✅ Stock **NO** debe decrementarse

### 2. Procesar Orden (Admin)
- ✅ Login como admin
- ✅ Ve la orden en tiempo real
- ✅ Click en "Ver detalles"
- ✅ Cambia estado a "Paid"
- ✅ Stock **SÍ** debe decrementarse automáticamente
- ✅ Se crea registro en `inventoryChanges`

### 3. Historial de Inventario (Admin)
- ✅ Panel admin → Inventario
- ✅ Ver todos los cambios con referencias a órdenes

## Ventajas del Nuevo Sistema

### 🔒 Seguridad
- Stock solo modificable por admins
- Reglas de Firestore simples y claras
- No hay permisos complejos que puedan fallar

### ⚡ Rendimiento
- Suscripciones en tiempo real a órdenes
- No requiere recargar manualmente
- Cambios se reflejan instantáneamente

### 🎯 Realismo
- Flujo realista: orden → revisión → confirmación
- Admin tiene control total del inventario
- No se decrementa stock sin verificación

### 🐛 Sin Errores
- ✅ No más "Missing or insufficient permissions"
- ✅ No más "Unsupported field value: undefined"
- ✅ No más problemas de permisos de productos

## Estructura de Datos

### Order
```typescript
{
  id: string;
  orderNumber: string;        // "ORD-2026-001"
  customerId?: string;        // Opcional
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;        // "Pending" | "Processing" | "Paid" | etc.
  statusHistory: OrderStatusHistory[];
  paymentMethod: 'Stripe' | 'PayPal';
  paymentId?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### InventoryChange
```typescript
{
  productId: string;
  productName: string;
  changeType: 'sale' | 'restock' | 'adjustment';
  oldStock: number;
  newStock: number;
  quantity: number;
  reason?: string;            // "Order: ORD-2026-001"
  performedBy?: string;       // Admin UID
  timestamp: Timestamp;
}
```

## Troubleshooting

### Error: "Missing or insufficient permissions"
**Solución**: Asegúrate de haber desplegado las nuevas reglas en Firebase Console

### Error: Orders no se muestran en admin panel
**Solución**:
1. Verifica que el usuario esté en la colección `/admins/{uid}`
2. Verifica las reglas en Firebase Console

### Error: Stock no se decrementa al marcar como Paid
**Solución**:
1. Verifica que la orden esté en estado "Pending" antes de cambiar
2. Revisa la consola del navegador para errores
3. Verifica que el producto existe y tiene stock suficiente

### Error: "Unsupported field value: undefined"
**Solución**: Ya corregido en el código. Si persiste, haz `npm run build` y recarga.

## Notas Importantes

1. **No hay integración de pagos real** - Es una demo, el botón de pago solo crea la orden
2. **Stock se decrementa manualmente** - El admin debe marcar como "Paid" explícitamente
3. **Cancelar no restaura stock** - Deberás ajustar manualmente si es necesario
4. **Audit trail inmutable** - Los cambios de inventario no se pueden editar/borrar

## Soporte

Si encuentras algún problema:
1. Revisa que las reglas estén desplegadas correctamente
2. Verifica que el código esté compilado (`npm run build`)
3. Limpia cache del navegador
4. Revisa la consola del navegador para errores específicos
