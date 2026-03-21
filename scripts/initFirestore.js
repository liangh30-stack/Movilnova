/**
 * Script de inicialización de Firestore (versión JavaScript)
 *
 * Este script crea datos de prueba en Firestore
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
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Verificar configuración
if (!firebaseConfig.apiKey) {
  console.error('❌ ERROR: No se encontraron las variables de entorno de Firebase');
  console.error('   Asegúrate de tener un archivo .env.local con las credenciales de Firebase');
  process.exit(1);
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Datos de ejemplo
const PRODUCTOS_EJEMPLO = [
  {
    name: 'Funda Mármol Rosa',
    price: 15.99,
    originalPrice: 29.99,
    category: 'Case',
    brand: 'Apple',
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
    brand: 'Samsung',
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
    brand: 'Universal',
    compatibleModels: [],
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400',
    description: 'Carga rápida para todos tus dispositivos',
    isBundle: false,
  },
  {
    name: 'Cable USB-C a Lightning 2m',
    price: 12.99,
    category: 'Cable',
    brand: 'Apple',
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
    brand: 'Anker',
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
    brand: 'Sony',
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
    brand: 'Apple',
    compatibleModels: ['iPhone 15', 'iPhone 15 Pro'],
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
    description: 'Funda + Protector + Cable USB-C',
    isBundle: true,
  },
  {
    name: 'Funda Transparente Ultra Slim',
    price: 11.99,
    category: 'Case',
    brand: 'Universal',
    compatibleModels: ['iPhone 15', 'Galaxy S24', 'Xiaomi 13'],
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
    description: 'Protección transparente que muestra el diseño original',
    isBundle: false,
  },
];

const ADMIN_EJEMPLO = {
  email: 'admin@movilnova.es',
  password: 'Admin123!',
};

const CLIENTE_EJEMPLO = {
  email: 'cliente@ejemplo.com',
  password: 'Cliente123!',
  displayName: 'María García',
  phone: '+34 600 123 456',
};

async function inicializarFirestore() {
  console.log('🚀 Iniciando población de Firestore...\n');

  try {
    // 1. CREAR USUARIO ADMINISTRADOR
    console.log('👤 Creando usuario administrador...');
    let adminUid;

    try {
      const adminUserCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_EJEMPLO.email,
        ADMIN_EJEMPLO.password
      );
      adminUid = adminUserCredential.user.uid;
      console.log(`   ✅ Admin creado con UID: ${adminUid}`);

      // Crear documento de rol admin
      await setDoc(doc(db, 'users', adminUid), {
        email: ADMIN_EJEMPLO.email,
        role: 'admin',
        createdAt: Timestamp.now(),
      });
      console.log('   ✅ Rol de admin configurado\n');

      await signOut(auth);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('   ⚠️  El admin ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // 2. CREAR PRODUCTOS
    console.log('📦 Creando productos de ejemplo...');
    let productosCreados = 0;

    for (const producto of PRODUCTOS_EJEMPLO) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...producto,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      productosCreados++;
      console.log(`   ✅ ${producto.name}`);
    }
    console.log(`\n   🎉 ${productosCreados} productos creados\n`);

    // 3. CREAR CLIENTE
    console.log('👥 Creando cliente de ejemplo...');
    let customerUid;

    try {
      const customerCredential = await createUserWithEmailAndPassword(
        auth,
        CLIENTE_EJEMPLO.email,
        CLIENTE_EJEMPLO.password
      );
      customerUid = customerCredential.user.uid;
      console.log(`   ✅ Cliente creado con UID: ${customerUid}`);

      // Perfil de cliente
      await setDoc(doc(db, 'customers', customerUid), {
        uid: customerUid,
        email: CLIENTE_EJEMPLO.email,
        displayName: CLIENTE_EJEMPLO.displayName,
        phone: CLIENTE_EJEMPLO.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Rol de customer
      await setDoc(doc(db, 'users', customerUid), {
        email: CLIENTE_EJEMPLO.email,
        role: 'customer',
        createdAt: Timestamp.now(),
      });
      console.log('   ✅ Perfil configurado\n');

      await signOut(auth);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('   ⚠️  El cliente ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // 4. CREAR PEDIDO DE EJEMPLO
    if (customerUid) {
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
        ],
        payment: 'stripe',
      });
      console.log(`   ✅ Pedido ${orderId} creado\n`);
    }

    // RESUMEN
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ¡INICIALIZACIÓN COMPLETADA!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('🔑 CREDENCIALES:');
    console.log(`   Admin:   ${ADMIN_EJEMPLO.email} / ${ADMIN_EJEMPLO.password}`);
    console.log(`   Cliente: ${CLIENTE_EJEMPLO.email} / ${CLIENTE_EJEMPLO.password}\n`);

    console.log('🌐 Visita http://localhost:5173 para empezar\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

// Ejecutar
inicializarFirestore()
  .then(() => {
    console.log('✨ Completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falló:', error);
    process.exit(1);
  });
