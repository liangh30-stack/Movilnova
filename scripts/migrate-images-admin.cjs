/**
 * Migrate product images from Firestore base64 to Firebase Storage URLs
 * Uses Firebase Admin SDK (bypasses security rules)
 */

const admin = require('/Users/luffy/.openclaw/workspace/movilnova/functions/node_modules/firebase-admin');

// Initialize with application default credentials (uses firebase login session)
admin.initializeApp({
  projectId: 'galaxia-phone',
  storageBucket: 'galaxia-phone.firebasestorage.app',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

function base64ToBuffer(base64DataUrl) {
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return { buffer: Buffer.from(match[2], 'base64'), mimeType: match[1] };
}

function getExtension(mimeType) {
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[mimeType] || 'webp';
}

async function uploadImage(productId, imageIndex, base64DataUrl) {
  const parsed = base64ToBuffer(base64DataUrl);
  if (!parsed) throw new Error('Invalid base64');
  
  const ext = getExtension(parsed.mimeType);
  const filePath = `products/${productId}/image_${imageIndex}.${ext}`;
  const file = bucket.file(filePath);
  
  await file.save(parsed.buffer, {
    metadata: { contentType: parsed.mimeType },
    public: true,
  });
  
  // Get public URL
  const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  return { url, sizeKB: Math.round(parsed.buffer.length / 1024) };
}

async function migrate() {
  console.log('🚀 Starting image migration with Admin SDK...');
  
  const snap = await db.collection('products').get();
  console.log(`📦 Found ${snap.size} products\n`);
  
  let stats = { total: 0, migrated: 0, skipped: 0, failed: 0 };
  
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const productId = docSnap.id;
    const images = data.images || [];
    
    const hasBase64 = images.some(img => typeof img === 'string' && img.startsWith('data:'));
    if (!hasBase64) { stats.skipped++; continue; }
    
    console.log(`📱 ${(data.name || productId).substring(0, 45)} (${images.length} imgs)`);
    
    const newImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      stats.total++;
      
      if (typeof img !== 'string' || !img.startsWith('data:')) {
        newImages.push(img);
        continue;
      }
      
      try {
        const { url, sizeKB } = await uploadImage(productId, i, img);
        newImages.push(url);
        stats.migrated++;
        process.stdout.write(`  ✅ ${i}: ${sizeKB}KB\n`);
      } catch (err) {
        newImages.push(img);
        stats.failed++;
        process.stdout.write(`  ❌ ${i}: ${err.message}\n`);
      }
    }
    
    // Update Firestore
    try {
      await db.collection('products').doc(productId).update({ images: newImages });
      console.log(`  💾 Updated\n`);
    } catch (err) {
      console.log(`  ❌ Update failed: ${err.message}\n`);
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Done! Migrated: ${stats.migrated} | Failed: ${stats.failed} | Skipped: ${stats.skipped}`);
  process.exit(0);
}

migrate().catch(err => { console.error('💥', err.message); process.exit(1); });
