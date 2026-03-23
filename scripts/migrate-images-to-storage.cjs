/**
 * Migrate product images from Firestore base64 to Firebase Storage URLs
 * 
 * Steps:
 * 1. Read all products from Firestore
 * 2. For each base64 image, upload to Firebase Storage
 * 3. Get the public download URL
 * 4. Update the product document with the URL
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const firebaseConfig = {
  apiKey: 'AIzaSyAAKYoc8hZaKyDJ11DfR2VfhJpOuXKyU8g',
  authDomain: 'galaxia-phone.firebaseapp.com',
  projectId: 'galaxia-phone',
  storageBucket: 'galaxia-phone.firebasestorage.app',
  messagingSenderId: '757726568567',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

function base64ToBuffer(base64DataUrl) {
  // Remove the data:image/xxx;base64, prefix
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, mimeType };
}

function getExtension(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimeType] || 'webp';
}

async function migrate() {
  console.log('🚀 Starting image migration...');
  
  const snap = await getDocs(collection(db, 'products'));
  console.log(`📦 Found ${snap.size} products`);
  
  let totalImages = 0;
  let migratedImages = 0;
  let skippedProducts = 0;
  let failedImages = 0;
  
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const productId = docSnap.id;
    const images = data.images || [];
    const image = data.image; // single image field
    
    // Check if any images are base64
    const hasBase64 = images.some(img => typeof img === 'string' && img.startsWith('data:'));
    const singleBase64 = typeof image === 'string' && image.startsWith('data:');
    
    if (!hasBase64 && !singleBase64) {
      skippedProducts++;
      continue;
    }
    
    console.log(`\n📱 ${data.name || productId} (${images.length} images)`);
    
    // Migrate images array
    const newImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      totalImages++;
      
      if (typeof img !== 'string' || !img.startsWith('data:')) {
        newImages.push(img); // Already a URL
        continue;
      }
      
      try {
        const parsed = base64ToBuffer(img);
        if (!parsed) {
          console.log(`  ⚠️ Image ${i}: Invalid base64`);
          newImages.push(img);
          failedImages++;
          continue;
        }
        
        const ext = getExtension(parsed.mimeType);
        const storagePath = `products/${productId}/image_${i}.${ext}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload
        const metadata = { contentType: parsed.mimeType };
        await uploadBytes(storageRef, parsed.buffer, metadata);
        
        // Get URL
        const url = await getDownloadURL(storageRef);
        newImages.push(url);
        migratedImages++;
        
        const sizeKB = Math.round(parsed.buffer.length / 1024);
        console.log(`  ✅ Image ${i}: ${sizeKB}KB → ${storagePath}`);
      } catch (err) {
        console.log(`  ❌ Image ${i}: ${err.message}`);
        newImages.push(img); // Keep base64 on failure
        failedImages++;
      }
    }
    
    // Migrate single image field
    let newImage = image;
    if (singleBase64) {
      try {
        const parsed = base64ToBuffer(image);
        if (parsed) {
          const ext = getExtension(parsed.mimeType);
          const storagePath = `products/${productId}/main.${ext}`;
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, parsed.buffer, { contentType: parsed.mimeType });
          newImage = await getDownloadURL(storageRef);
          console.log(`  ✅ Main image migrated`);
        }
      } catch (err) {
        console.log(`  ❌ Main image: ${err.message}`);
      }
    }
    
    // Update Firestore
    try {
      const updateData = { images: newImages };
      if (newImage !== image) updateData.image = newImage;
      await updateDoc(doc(db, 'products', productId), updateData);
      console.log(`  💾 Firestore updated`);
    } catch (err) {
      console.log(`  ❌ Firestore update failed: ${err.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Migration complete!`);
  console.log(`📊 Total images: ${totalImages}`);
  console.log(`✅ Migrated: ${migratedImages}`);
  console.log(`⏭️ Skipped products (already URLs): ${skippedProducts}`);
  console.log(`❌ Failed: ${failedImages}`);
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
