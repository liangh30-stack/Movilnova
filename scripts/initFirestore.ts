/**
 * Script de inicialización de Firestore
 *
 * Este script crea:
 * - Un usuario administrador
 * - Productos de ejemplo en el catálogo
 * - Un cliente de prueba
 * - Pedidos de ejemplo
 *
 * IMPORTANTE: Ejecutar solo una vez para poblar la base de datos vacía
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';

// Configuración de Firebase (usa las mismas variables de entorno)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Datos de ejemplo para productos
const PRODUCTOS_EJEMPLO = [
  {
    name: 'Funda Mármol Rosa',
    price: 15.99,
    originalPrice: 29.99,
    category: 'Case',
    brands: ['Apple'],
    compatibleModels: ['iPhone 15 Pro', 'iPhone 15 Pro Max'],
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
    description: 'Elegante diseño de mármol con absorción de impactos',
    isBundle: false,
  },
  {
    name: 'Protector Pantalla Cristal Templado',
    price: 9.99,
    originalPrice: 19.99,
    category: 'Screen Protector',
    brands: ['Samsung'],
    compatibleModels: ['Galaxy S24', 'Galaxy S24 Plus'],
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
    description: 'Protección 9H contra rayones y golpes',
    isBundle: false,
  },
  {
    name: 'Cargador Rápido USB-C 65W',
    price: 24.99,
    originalPrice: 39.99,
    category: 'Charger',
    brands: ['Universal'],
    compatibleModels: [],
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400',
    description: 'Carga rápida para todos tus dispositivos',
    isBundle: false,
  },
  {
    name: 'Cable USB-C a Lightning 2m',
    price: 12.99,
    category: 'Cable',
    brands: ['Apple'],
    compatibleModels: ['iPhone 15', 'iPhone 14', 'iPhone 13'],
    image: 'https://images.unsplash.com/photo-1591290619762-c588f8f73c7d?w=400',
    description: 'Cable certificado MFi, 2 metros de longitud',
    isBundle: false,
  },
  {
    name: 'Power Bank 20000mAh',
    price: 34.99,
    originalPrice: 49.99,
    category: 'Power Bank',
    brands: ['Anker'],
    compatibleModels: [],
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
    description: 'Batería externa de alta capacidad con carga rápida',
    isBundle: false,
  },
  {
    name: 'Auriculares Inalámbricos Pro',
    price: 89.99,
    originalPrice: 129.99,
    category: 'Audio',
    brands: ['Sony'],
    compatibleModels: [],
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    description: 'Cancelación de ruido activa, 30h de batería',
    isBundle: false,
  },
  {
    name: 'Pack Esencial iPhone',
    price: 49.99,
    originalPrice: 79.99,
    category: 'Bundle',
    brands: ['Apple'],
    compatibleModels: ['iPhone 15', 'iPhone 15 Pro'],
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
    description: 'Funda + Protector + Cable USB-C',
    isBundle: true,
  },
  {
    name: 'Funda Transparente Ultra Slim',
    price: 11.99,
    category: 'Case',
    brands: ['Universal'],
    compatibleModels: ['iPhone 15', 'Galaxy S24', 'Xiaomi 13'],
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
    description: 'Protección transparente que muestra el diseño original',
    isBundle: false,
  },
];

// Cliente de ejemplo — credentials read from env vars for security.
// Set SEED_CUSTOMER_EMAIL, SEED_CUSTOMER_PASSWORD, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
// before running this script.
const CLIENTE_EJEMPLO = {
  email: import.meta.env.SEED_CUSTOMER_EMAIL || 'cliente@ejemplo.com',
  password: import.meta.env.SEED_CUSTOMER_PASSWORD || 'ChangeMe_Customer1!',
  displayName: 'María García',
  phone: '+34 600 123 456',
};

// Admin de ejemplo
const ADMIN_EJEMPLO = {
  email: import.meta.env.SEED_ADMIN_EMAIL || 'admin@movilnova.es',
  password: import.meta.env.SEED_ADMIN_PASSWORD || 'ChangeMe_Admin1!',
};

async function inicializarFirestore() {
  console.log('🚀 Iniciando población de Firestore...\n');

  try {
    // 1. CREAR USUARIO ADMINISTRADOR
    console.log('👤 Creando usuario administrador...');
    let adminUid: string;

    try {
      const adminUserCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_EJEMPLO.email,
        ADMIN_EJEMPLO.password
      );
      adminUid = adminUserCredential.user.uid;
      console.log(`   ✅ Admin creado con UID: ${adminUid}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('   ⚠️  El admin ya existe, continuando...');
        // Si ya existe, necesitamos obtener el UID de alguna manera
        // Por simplicidad, usaremos un UID fijo para la demo
        adminUid = 'admin-demo-uid';
      } else {
        throw error;
      }
    }

    // Crear documento de rol admin en collection 'users'
    await setDoc(doc(db, 'users', adminUid), {
      email: ADMIN_EJEMPLO.email,
      role: 'admin',
      createdAt: Timestamp.now(),
    });
    console.log('   ✅ Rol de admin configurado en Firestore\n');

    // Cerrar sesión del admin
    if (auth.currentUser) {
      await signOut(auth);
    }

    // 2. CREAR PRODUCTOS DE EJEMPLO
    console.log('📦 Creando productos de ejemplo...');
    let productosCreados = 0;

    for (const producto of PRODUCTOS_EJEMPLO) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...producto,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      productosCreados++;
      console.log(`   ✅ Producto creado: ${producto.name} (ID: ${docRef.id})`);
    }
    console.log(`\n   🎉 ${productosCreados} productos creados exitosamente\n`);

    // 3. CREAR CLIENTE DE EJEMPLO
    console.log('👥 Creando cliente de ejemplo...');
    let customerUid: string;

    try {
      const customerCredential = await createUserWithEmailAndPassword(
        auth,
        CLIENTE_EJEMPLO.email,
        CLIENTE_EJEMPLO.password
      );
      customerUid = customerCredential.user.uid;
      console.log(`   ✅ Cliente creado con UID: ${customerUid}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('   ⚠️  El cliente ya existe, continuando...');
        customerUid = 'customer-demo-uid';
      } else {
        throw error;
      }
    }

    // Crear perfil de cliente en Firestore
    await setDoc(doc(db, 'customers', customerUid), {
      uid: customerUid,
      email: CLIENTE_EJEMPLO.email,
      displayName: CLIENTE_EJEMPLO.displayName,
      phone: CLIENTE_EJEMPLO.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Crear documento de rol customer en collection 'users'
    await setDoc(doc(db, 'users', customerUid), {
      email: CLIENTE_EJEMPLO.email,
      role: 'customer',
      createdAt: Timestamp.now(),
    });
    console.log('   ✅ Perfil de cliente configurado en Firestore\n');

    // Cerrar sesión del cliente
    if (auth.currentUser) {
      await signOut(auth);
    }

    // 4. CREAR DIRECCIÓN DE EJEMPLO PARA EL CLIENTE
    console.log('📍 Creando dirección de ejemplo...');
    await setDoc(doc(db, 'customers', customerUid, 'addresses', 'addr-1'), {
      id: 'addr-1',
      label: 'Casa',
      street: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      country: 'España',
      isDefault: true,
    });
    console.log('   ✅ Dirección creada\n');

    // 5. CREAR PEDIDO DE EJEMPLO
    console.log('🛒 Creando pedido de ejemplo...');
    const orderId = `ORD-${Date.now()}`;
    await setDoc(doc(db, 'orders', orderId), {
      id: orderId,
      customerName: CLIENTE_EJEMPLO.displayName,
      email: CLIENTE_EJEMPLO.email,
      phone: CLIENTE_EJEMPLO.phone,
      address: 'Calle Mayor 123, Madrid 28001',
      date: new Date().toISOString(),
      status: 'pending',
      items: [
        {
          id: 'prod-1',
          name: 'Funda Mármol Rosa',
          price: 15.99,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
        },
        {
          id: 'prod-2',
          name: 'Protector Pantalla Cristal Templado',
          price: 9.99,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
        },
      ],
      payment: 'stripe',
    });
    console.log(`   ✅ Pedido creado: ${orderId}\n`);

    // RESUMEN FINAL
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ¡INICIALIZACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📋 RESUMEN:');
    console.log(`   • ${productosCreados} productos creados`);
    console.log('   • 1 usuario administrador creado');
    console.log('   • 1 cliente de ejemplo creado');
    console.log('   • 1 dirección de ejemplo creada');
    console.log('   • 1 pedido de ejemplo creado\n');

    console.log('🔑 CREDENCIALES DE ACCESO:');
    console.log(`   Admin:    ${ADMIN_EJEMPLO.email} / ****`);
    console.log(`   Cliente:  ${CLIENTE_EJEMPLO.email} / ****`);
    console.log('   (Contraseñas definidas en variables de entorno SEED_ADMIN_PASSWORD / SEED_CUSTOMER_PASSWORD)\n');

    console.log('🌐 PRÓXIMOS PASOS:');
    console.log('   1. Visita http://localhost:5173');
    console.log('   2. Inicia sesión con las credenciales de admin');
    console.log('   3. Explora el panel de administración\n');

    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR durante la inicialización:', error);
    throw error;
  }
}

// Ejecutar el script
inicializarFirestore()
  .then(() => {
    console.log('🎉 Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 El script falló:', error);
    process.exit(1);
  });
