# Scripts de Inicialización

## 🚀 Script de Población de Firestore

Este script inicializa tu base de datos Firestore con datos de prueba.

### ¿Qué crea el script?

- ✅ **8 productos de ejemplo** (fundas, protectores, cargadores, cables, etc.)
- ✅ **Usuario administrador** para acceder al panel de admin
- ✅ **Cliente de ejemplo** con perfil completo
- ✅ **Pedido de prueba** con productos
- ✅ **Dirección de envío** para el cliente

### Requisitos Previos

1. Tener Node.js instalado (versión 18 o superior)
2. Tener configurado el archivo `.env.local` con las credenciales de Firebase
3. Tener las dependencias instaladas (`npm install`)

### Método 1: Ejecutar con Node (Recomendado)

```bash
# Desde la raíz del proyecto
node scripts/initFirestore.js
```

### Método 2: Ejecutar con npm script

Primero, agrega este script a tu `package.json`:

```json
{
  "scripts": {
    "init-db": "node scripts/initFirestore.js"
  }
}
```

Luego ejecuta:

```bash
npm run init-db
```

### Credenciales Creadas

Después de ejecutar el script, podrás iniciar sesión con:

#### Cuenta de Administrador
- **Email**: `admin@movilnova.com`
- **Contraseña**: `Admin123!`
- **Acceso**: Panel de administración completo

#### Cuenta de Cliente
- **Email**: `cliente@ejemplo.com`
- **Contraseña**: `Cliente123!`
- **Acceso**: Portal de cliente, historial de pedidos

### Productos Creados

El script crea 8 productos de ejemplo:

1. **Funda Mármol Rosa** - €15.99 (antes €29.99)
2. **Protector Pantalla Cristal Templado** - €9.99
3. **Cargador Rápido USB-C 65W** - €24.99
4. **Cable USB-C a Lightning 2m** - €12.99
5. **Power Bank 20000mAh** - €34.99
6. **Auriculares Inalámbricos Pro** - €89.99
7. **Pack Esencial iPhone** - €49.99
8. **Funda Transparente Ultra Slim** - €11.99

### Verificación

Después de ejecutar el script:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Abre **Firestore Database**
4. Verifica que existan las colecciones:
   - `products` (8 documentos)
   - `users` (2 documentos: admin + customer)
   - `customers` (1 documento)
   - `orders` (1 documento)

### Solución de Problemas

#### Error: "auth/email-already-in-use"

✅ **No es un error real**. El script detecta si los usuarios ya existen y continúa normalmente.

#### Error: "No se encontraron las variables de entorno"

❌ Asegúrate de tener el archivo `.env.local` en la raíz del proyecto con:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

#### Error: "Cannot find module 'dotenv'"

Instala las dependencias faltantes:

```bash
npm install dotenv
```

#### Error de permisos en Firestore

Ve a Firebase Console → Firestore → Rules y asegúrate de tener reglas que permitan escritura durante el desarrollo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Solo para desarrollo
    }
  }
}
```

⚠️ **IMPORTANTE**: Cambia estas reglas por las reglas de producción especificadas en `FIRESTORE_STRUCTURE.md` antes de lanzar tu aplicación.

### Ejecutar Múltiples Veces

- ✅ El script es **idempotente**: puedes ejecutarlo múltiples veces
- ⚠️ Los productos se agregarán cada vez (no se eliminan los existentes)
- ✅ Los usuarios admin/cliente solo se crean si no existen

### Limpiar Base de Datos

Si quieres empezar de cero:

1. Ve a Firebase Console
2. Firestore Database
3. Elimina manualmente las colecciones
4. Vuelve a ejecutar el script

---

## 📝 Notas Adicionales

- Los IDs de productos son autogenerados por Firestore
- Las imágenes usan URLs de Unsplash (requieren conexión a internet)
- Los timestamps usan hora del servidor de Firebase
- El script sale automáticamente después de completarse

---

**¿Necesitas ayuda?** Consulta la documentación completa en [FIRESTORE_STRUCTURE.md](../FIRESTORE_STRUCTURE.md)
