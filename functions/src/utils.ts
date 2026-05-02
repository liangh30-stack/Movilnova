// ============================================
// Shared utilities for Cloud Functions
// ============================================

import * as admin from 'firebase-admin';

/**
 * HTML-escape user input before embedding in email templates or other HTML strings.
 * Prevents HTML/script injection in admin inboxes (e.g., from mail-in repair form).
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extract the real client IP from a callable function's rawRequest.
 * Cloud Functions sit behind Google Front End — req.ip is a proxy IP and is
 * effectively the same for every caller. The real client IP is the FIRST
 * address in x-forwarded-for (the rest are proxy hops).
 *
 * Returns 'unknown' only if no header is present (very rare).
 */
export function getClientIp(rawRequest: { headers?: Record<string, string | string[] | undefined>; ip?: string } | undefined): string {
  const xff = rawRequest?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    // x-forwarded-for is "client, proxy1, proxy2, ..." — first value is the originating client
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(xff) && xff.length > 0 && xff[0]) {
    const first = xff[0].split(',')[0]?.trim();
    if (first) return first;
  }
  return rawRequest?.ip || 'unknown';
}

/**
 * Firestore-backed sliding-window rate limiter.
 * Returns true if the call is within the limit, false if it should be rejected.
 *
 * Tracks attempts per key in the `_rateLimits` collection.
 * Documents include `expiresAt` so a Firestore TTL policy can clean them up
 * (configure: Firestore Console → TTL → field `expiresAt` on `_rateLimits`).
 */
export async function checkRateLimit(
  db: admin.firestore.Firestore,
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<boolean> {
  const ref = db.collection('_rateLimits').doc(key);
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();

    if (!data) {
      tx.set(ref, {
        attempts: 1,
        windowStart: now,
        expiresAt: new Date(now + windowMs * 2),
      });
      return true;
    }

    const windowStart = data.windowStart as number;
    if (now - windowStart > windowMs) {
      tx.set(ref, {
        attempts: 1,
        windowStart: now,
        expiresAt: new Date(now + windowMs * 2),
      });
      return true;
    }

    if ((data.attempts as number) >= maxAttempts) {
      return false;
    }

    tx.update(ref, { attempts: admin.firestore.FieldValue.increment(1) });
    return true;
  });
}

/**
 * Throws if the caller is not an admin or superadmin.
 * Pass the caller's auth UID (from `context.auth.uid`).
 */
export async function requireAdmin(
  db: admin.firestore.Firestore,
  uid: string,
): Promise<'admin' | 'superadmin'> {
  const snap = await db.collection('users').doc(uid).get();
  const role = snap.data()?.role;
  if (!snap.exists || (role !== 'admin' && role !== 'superadmin')) {
    throw new Error('PERMISSION_DENIED');
  }
  return role;
}
