/**
 * One-shot migration: convert plaintext `pin` field on employees docs into
 * `pinHash` + `pinSalt` (sha256 with per-employee salt). Run from a machine
 * with Firebase Admin credentials.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   npx ts-node scripts/migrateEmployeePins.ts
 *
 * After running successfully, manually delete the legacy `pin` field with:
 *   firebase firestore:delete --recursive \
 *     --shallow employees/<id>/pin   # not directly supported — use console/CLI
 *
 * Or pass --strip to remove the legacy field at the end of the migration.
 */
import * as admin from 'firebase-admin';
import { createHash, randomBytes } from 'crypto';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const stripLegacy = process.argv.includes('--strip');

function hashPin(salt: string, pin: string): string {
  return createHash('sha256').update(`${salt}:${pin}`).digest('hex');
}

async function main() {
  const snap = await db.collection('employees').get();
  console.log(`Found ${snap.size} employees`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.pinHash) {
      console.log(`  [skip] ${doc.id} (${data.name ?? '?'}) already migrated`);
      skipped++;
      continue;
    }
    if (typeof data.pin !== 'string' || !data.pin) {
      console.log(`  [skip] ${doc.id} (${data.name ?? '?'}) has no pin to migrate`);
      skipped++;
      continue;
    }

    const salt = randomBytes(16).toString('hex');
    const pinHash = hashPin(salt, data.pin);
    const update: Record<string, unknown> = { pinSalt: salt, pinHash };
    if (stripLegacy) update.pin = admin.firestore.FieldValue.delete();

    await doc.ref.update(update);
    console.log(`  [done] ${doc.id} (${data.name ?? '?'})${stripLegacy ? ' + stripped legacy pin' : ''}`);
    migrated++;
  }

  console.log(`\nMigration complete: ${migrated} updated, ${skipped} skipped.`);
  if (!stripLegacy) {
    console.log('Re-run with --strip to remove legacy plaintext `pin` fields once verified.');
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
