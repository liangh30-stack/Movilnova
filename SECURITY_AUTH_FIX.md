# Solución: Separación de Roles Admin/Customer

## Problema Identificado

**Bug crítico de seguridad:** Customers podían acceder al panel de administración.

### Causa raíz

```typescript
// App.tsx - ANTES (línea 156-161)
useEffect(() => {
  const unsubscribe = onAuthChange((user) => {
    setAdminUser(user);  // ❌ Seteaba adminUser para CUALQUIER usuario autenticado
  });
}, []);
```

El listener `onAuthChange` detectaba TODOS los usuarios de Firebase Auth (incluyendo customers) y los seteaba como `adminUser`, permitiendo acceso no autorizado al panel admin.

---

## Solución Implementada

### 1. **Filtrado en authService.ts**

Modificado `onAuthChange` para que SOLO devuelva usuarios con `role === 'admin'`:

```typescript
// authService.ts
export const onAuthChange = (callback: (user: AppUser | null) => void) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      callback(null);
      return;
    }

    const userData = snap.data();
    const appUser: AppUser = {
      uid: user.uid,
      email: user.email,
      role: userData.role,
    };

    // ✅ SECURITY: Solo callback si es admin
    if (appUser.role === 'admin') {
      callback(appUser);
    } else {
      callback(null);
    }
  });
```

### 2. **Route Guard en App.tsx**

Agregado guard que verifica permisos y redirige silenciosamente a HOME si no autorizado:

```typescript
// App.tsx
// SECURITY: Protect admin routes
useEffect(() => {
  if (view === ViewState.ADMIN && !adminUser) {
    const timer = setTimeout(() => {
      if (!adminUser) {
        setView(ViewState.HOME);
      }
    }, 100);
    return () => clearTimeout(timer);
  }
}, [view, adminUser]);
```

### 3. **Logout de Admin corregido**

Modificado `handleAdminLogout` para cerrar sesión de Firebase Auth (antes solo limpiaba estado local):

```typescript
// App.tsx
const handleAdminLogout = async () => {
  try {
    await signOutUser();  // ✅ Ahora cierra sesión de Firebase
  } catch (err) {
    console.error('Admin logout error:', err);
  }
  setAdminUser(null);
  setView(ViewState.HOME);
  // ...
};
```

---

## Arquitectura Actual

### Separación de Auth Contexts

| Sistema | Auth Listener | Collection | Estado Global | Uso |
|---------|--------------|------------|---------------|-----|
| **Customer** | `onCustomerAuthChange` | `customers/{uid}` | `customer` (hook) | Login clientes, carrito, favoritos |
| **Admin** | `onAuthChange` | `users/{uid}` (role: admin) | `adminUser` (App.tsx) | Panel admin, gestión productos |
| **Employee** | PIN-based | localStorage | `currentUser` (App.tsx) | Dashboard empleados, tareas |

### Firestore Structure

```
/users/{uid}
  ├── email: string
  ├── role: 'admin' | 'customer'
  └── createdAt: timestamp

/customers/{uid}
  ├── uid: string
  ├── email: string
  ├── displayName: string
  ├── /addresses/
  ├── /cart/
  └── /orders/
```

---

## Testing Manual

### ✅ Caso 1: Customer no puede acceder a admin

1. Registrarse como customer (Customer Auth Modal)
2. Intentar navegar a `/admin` o click en footer "Admin Panel"
3. **Resultado esperado:** Redirect silencioso a HOME

### ✅ Caso 2: Admin puede acceder

1. Login como admin en AdminLogin (requiere `users/{uid}` con `role: 'admin'`)
2. Acceder a ProductManager
3. **Resultado esperado:** Acceso autorizado

### ✅ Caso 3: Logout no mezcla sesiones

1. Login como admin → Logout
2. Verificar que `adminUser === null`
3. Login como customer → Verificar que `adminUser` sigue siendo `null`

---

## Mejoras Futuras: Firebase Custom Claims

Para mayor seguridad, se puede migrar a **Custom Claims** (requiere Cloud Functions):

### Setup con Cloud Functions

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setAdminClaim = functions.https.onCall(async (data, context) => {
  // Solo super admin puede asignar roles
  if (!context.auth?.token.superAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'No autorizado');
  }

  await admin.auth().setCustomUserClaims(data.uid, {
    admin: true,
  });

  return { message: 'Admin claim set successfully' };
});
```

### Verificación en el cliente

```typescript
// authService.ts
export const checkAdminClaim = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin === true;
};
```

### Ventajas de Custom Claims

- ✅ No se pueden falsificar desde el cliente
- ✅ Se incluyen automáticamente en el token JWT
- ✅ Verificables en Firestore Security Rules
- ✅ No requieren consulta adicional a Firestore

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `services/authService.ts` | Filtro `role === 'admin'` en `onAuthChange` |
| `App.tsx` | Route guard + logout corregido + import `signOutUser` |
| `components/AdminLogin.tsx` | ✅ Ya tenía verificación correcta |

---

## Checklist de Seguridad

- [x] Customers no pueden setear `adminUser` state
- [x] Route guard previene acceso directo a ViewState.ADMIN
- [x] Admin logout cierra sesión de Firebase Auth
- [x] Separación clara entre customer/admin/employee auth
- [x] TypeScript compile sin errores
- [x] Production build exitoso
- [ ] (Futuro) Migrar a Firebase Custom Claims
- [ ] (Futuro) Agregar Firestore Security Rules

---

## Notas Importantes

1. **Registro de admins:** Actualmente debes crear manualmente el documento `users/{uid}` con `role: 'admin'` en Firestore Console.

2. **Customer → Admin:** Un customer no puede "convertirse" en admin solo con credentials. El role debe estar en Firestore.

3. **Employee vs Admin:** Son sistemas separados. Employee usa PIN local, Admin usa Firebase Auth.

---

Fecha: 2026-02-11
Autor: Claude Code (Ship pipeline)
