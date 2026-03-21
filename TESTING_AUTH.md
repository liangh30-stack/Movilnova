# Testing: Separación de Roles Admin/Customer

## Setup Previo

### 1. Crear un usuario admin en Firestore

Debes tener al menos un usuario admin en Firebase. Si no tienes uno:

**Opción A: Desde Firebase Console**

1. Ir a Firebase Console → Authentication
2. Crear usuario: `admin@movilnova.com` con contraseña
3. Copiar el UID del usuario
4. Ir a Firestore Database → Crear documento:
   ```
   Collection: users
   Document ID: [UID del usuario]
   Fields:
     - email: "admin@movilnova.com"
     - role: "admin"
     - createdAt: [timestamp actual]
   ```

**Opción B: Script de inicialización** (guardar como `scripts/createAdmin.js`):

```javascript
// Requiere: npm install firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
  const email = 'admin@movilnova.com';
  const password = 'Admin123!';

  try {
    // Crear usuario en Auth
    const user = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    // Crear documento en Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Admin creado:', user.uid);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createAdmin();
```

---

## Test Cases

### ✅ Test 1: Customer NO puede acceder a admin

**Pasos:**
1. Abrir MovilNova: `http://localhost:3001`
2. Registrar nuevo customer:
   - Click "Sign Up" en el nav
   - Email: `customer@test.com`
   - Password: `Test123!`
   - Nombre: "Test Customer"
   - Click "Register"
3. Intentar acceder al admin:
   - Scroll al footer
   - Click "Admin Panel"
4. **Resultado esperado:**
   - ✅ Redirige automáticamente a HOME (sin mensaje de error)
   - ✅ No muestra el ProductManager
   - ✅ URL no cambia a `/admin` (si usas routing)

**Verificación técnica:**
```javascript
// Abrir DevTools Console y ejecutar:
console.log('Admin User:', window.adminUser); // Debe ser null o undefined
```

---

### ✅ Test 2: Admin SÍ puede acceder

**Pasos:**
1. Logout del customer (si estás logueado)
2. Ir al footer → Click "Admin Panel"
3. Login con credenciales de admin:
   - Email: `admin@movilnova.com`
   - Password: `[tu contraseña]`
   - Click "Iniciar sesión"
4. **Resultado esperado:**
   - ✅ Accede al ProductManager
   - ✅ Puede ver/editar productos
   - ✅ Botón "Logout" visible

---

### ✅ Test 3: Admin logout no afecta customer

**Pasos:**
1. Login como admin (Test 2)
2. Click "Logout" en ProductManager
3. Registrar/Login como customer
4. **Resultado esperado:**
   - ✅ Customer login funciona normal
   - ✅ No se setea `adminUser` state
   - ✅ Customer no puede acceder a admin (Test 1)

**Verificación en DevTools:**
```javascript
// Con customer logueado:
console.log('Admin User:', window.adminUser); // null
console.log('Customer:', window.customer);    // { uid, email, ... }
```

---

### ✅ Test 4: Mezcla de sesiones (edge case)

**Pasos:**
1. Login como customer en Tab 1
2. Abrir nueva tab (Tab 2)
3. En Tab 2: Login como admin
4. Volver a Tab 1
5. **Resultado esperado:**
   - ⚠️ Firebase Auth solo permite 1 sesión
   - El último login (admin) prevalece
   - Customer es deslogueado automáticamente

Esto es **comportamiento normal de Firebase Auth** - no es un bug.

---

### ✅ Test 5: URL directo a admin (security)

**Pasos:**
1. Sin estar logueado
2. Ir directamente a: `http://localhost:3001` (y setear manualmente `view=admin` si usas state routing)
3. **Resultado esperado:**
   - ✅ Muestra AdminLogin (no ProductManager)
   - ✅ Requiere credenciales de admin

---

### ✅ Test 6: AdminLogin rechaza customer

**Pasos:**
1. Ir a AdminLogin
2. Intentar login con credenciales de customer:
   - Email: `customer@test.com`
   - Password: `Test123!`
3. **Resultado esperado:**
   - ❌ Error: "No tienes permisos de administrador"
   - ✅ NO accede al ProductManager

---

## Debugging

### Ver estado de autenticación

Ejecutar en DevTools Console:

```javascript
// Estado actual
firebase.auth().currentUser; // Usuario de Firebase Auth actual

// Verificar role en Firestore
firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).get()
  .then(doc => console.log('Role:', doc.data().role));

// Ver custom claims (si configurado)
firebase.auth().currentUser.getIdTokenResult()
  .then(result => console.log('Claims:', result.claims));
```

### Limpiar estado local

Si algo se rompe:

```javascript
// En DevTools Console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Firestore Security Rules (Recomendado)

Agregar en Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper para verificar si es admin
    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Solo admins pueden leer/escribir products
    match /products/{productId} {
      allow read: if true; // Público para storefront
      allow write: if isAdmin();
    }

    // Customers solo pueden acceder a sus propios datos
    match /customers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /addresses/{addressId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /orders/{orderId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && request.auth.uid == userId;
      }
    }

    // users collection: solo admins pueden modificar roles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if isAdmin();
    }
  }
}
```

---

## Checklist de Validación

- [ ] Customer no puede acceder al ProductManager
- [ ] Admin puede acceder al ProductManager
- [ ] AdminLogin rechaza customers con error visible
- [ ] Admin logout funciona correctamente
- [ ] Customer logout no afecta admin state
- [ ] TypeScript compile sin errores
- [ ] Production build exitoso
- [ ] Firestore Security Rules configuradas (opcional pero recomendado)

---

## Troubleshooting

### Problema: "Usuario sin rol asignado"

**Causa:** Documento `users/{uid}` no existe en Firestore.

**Solución:**
1. Ir a Firebase Console → Firestore
2. Verificar que existe `users/{uid}` con campo `role`
3. Si no existe, crear manualmente (ver Setup Previo)

### Problema: Customer puede acceder a admin

**Causa:** Caché de estado o cambios no aplicados.

**Solución:**
1. Limpiar localStorage: `localStorage.clear()`
2. Hard refresh: `Ctrl + Shift + R`
3. Verificar que cambios en `authService.ts` y `App.tsx` están aplicados

### Problema: Admin no puede login

**Causa:** Documento `users/{uid}` tiene `role: 'customer'`.

**Solución:**
1. Firebase Console → Firestore → `users/{uid}`
2. Cambiar `role` a `"admin"`

---

Fecha: 2026-02-11
