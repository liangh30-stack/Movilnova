/**
 * Script para verificar y corregir el usuario admin
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'jeremypnl7@gmail.com';
const ADMIN_PASSWORD = 'abc123.';

async function checkAndFixAdmin() {
  console.log('🔍 Verificando usuario admin...\n');

  try {
    // 1. Intentar iniciar sesión
    console.log(`📧 Iniciando sesión con: ${ADMIN_EMAIL}`);
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;

    console.log(`✅ Login exitoso`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}\n`);

    // 2. Verificar documento en Firestore
    console.log('🔍 Verificando documento en Firestore...');
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('❌ El documento NO EXISTE en la colección "users"');
      console.log('   Creando documento...\n');

      await setDoc(userDocRef, {
        email: ADMIN_EMAIL,
        role: 'admin',
        createdAt: Timestamp.now(),
      });

      console.log('✅ Documento creado exitosamente');
      console.log(`   Ruta: users/${user.uid}`);
      console.log('   Datos: { email, role: "admin", createdAt }\n');
    } else {
      const data = userDoc.data();
      console.log('✅ El documento EXISTE');
      console.log(`   Ruta: users/${user.uid}`);
      console.log('   Datos actuales:', JSON.stringify(data, null, 2));

      if (data.role !== 'admin') {
        console.log('\n⚠️  PROBLEMA ENCONTRADO: role no es "admin"');
        console.log(`   Role actual: "${data.role}"`);
        console.log('   Corrigiendo...\n');

        await setDoc(userDocRef, {
          email: ADMIN_EMAIL,
          role: 'admin',
          createdAt: data.createdAt || Timestamp.now(),
        }, { merge: true });

        console.log('✅ Role corregido a "admin"');
      } else {
        console.log('\n✅ Todo está correcto. El role es "admin"');
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════\n');

    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('   1. Cierra sesión en tu app si estás logueado');
    console.log('   2. Recarga la página (Ctrl + R)');
    console.log('   3. Inicia sesión con:');
    console.log(`      Email: ${ADMIN_EMAIL}`);
    console.log(`      Pass:  ${ADMIN_PASSWORD}`);
    console.log('   4. Deberías ver el Panel de Admin\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 SOLUCIÓN: El usuario no existe en Authentication');
      console.log('   Ejecuta: node scripts/initFirestore.js');
    } else if (error.code === 'auth/wrong-password') {
      console.log('\n💡 La contraseña es incorrecta');
      console.log('   Contraseña esperada: Admin123!');
    } else if (error.code === 'permission-denied') {
      console.log('\n💡 SOLUCIÓN: Problema de permisos en Firestore');
      console.log('   Ve a Firebase Console → Firestore → Rules');
      console.log('   Temporalmente usa: allow read, write: if true;');
    }

    throw error;
  }
}

checkAndFixAdmin()
  .then(() => {
    console.log('✨ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falló:', error);
    process.exit(1);
  });
