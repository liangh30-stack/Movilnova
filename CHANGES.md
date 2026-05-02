# Security & Bugfix Pass — 2026-05-02

This branch fixes 23 issues (5 critical security holes, 4 critical functional
bugs, the rest medium / low). The notes below explain **what changed**, **why**,
and the **manual follow-ups** you must do in Firebase Console / Stripe / etc.
that code alone can't take care of.

---

## Manual follow-ups (DO THESE)

These steps live outside the repo and won't happen automatically when you
deploy.

### 1. Delete the deprecated Cloud Function endpoints

The `assignAdminRole` and `batchUpdateProductSEO` endpoints used a hardcoded
query-string secret committed to a public repo. Anyone who reads the source
can grant themselves superadmin or rewrite product descriptions. The new code
removes the handlers, but the deployed functions will linger until you drop
them:

```bash
firebase functions:delete assignAdminRole batchUpdateProductSEO --region us-central1 --force
```

### 2. Rotate the Stripe & Firebase keys that lived in `.env.local`

The committed `movilnova.env.local` you uploaded contains a **live** Stripe
publishable key and a Firebase Web API key. Publishable keys are public by
design, but treat both as compromised since the file may have been pushed at
some point. In Stripe Dashboard → Developers → API keys, **Roll** the live
publishable key. In Firebase Console → Project Settings → General → Web app,
regenerate or restrict the Web API key (add HTTP referrer / domain
restrictions to limit it to `movilnova.es`).

Then make sure `.gitignore` is doing its job:

```bash
git log --all -p -- .env.local | head -200   # confirm it was never committed
git log --all -p -- functions/.env | head    # same for server-side env
```

### 3. Enable Firebase App Check enforcement

The code now warns loudly in production if `VITE_RECAPTCHA_SITE_KEY` is unset.
To actually protect Firestore / Functions / Storage:

  1. Register a reCAPTCHA v3 site key at <https://www.google.com/recaptcha/admin>
     for `movilnova.es`.
  2. Add `VITE_RECAPTCHA_SITE_KEY=<the site key>` to `.env.local` (and to your
     CI deploy secrets).
  3. In Firebase Console → App Check → Apps, register your web app with
     reCAPTCHA v3 (paste the same site key).
  4. In App Check → APIs, **Enforce** for: Cloud Firestore, Cloud Functions,
     Cloud Storage. (Start with "Unenforced + monitoring" for 24h to catch
     legitimate clients without tokens, then flip to Enforce.)

### 4. Migrate employee PINs to hashed form

`AttendancePanel.tsx` no longer compares PINs in the browser — it calls a new
`verifyEmployeePin` Cloud Function which hashes against a per-employee salt.

The function falls back to the legacy plaintext `pin` field for
backwards-compat during rollout, so the feature won't break the moment you
deploy. To eliminate the legacy field:

```bash
# 1. Make sure functions are deployed first
firebase deploy --only functions

# 2. Run the migration to add pinHash + pinSalt
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
  npx ts-node scripts/migrateEmployeePins.ts

# 3. Verify a clock-in still works in the admin panel

# 4. Re-run with --strip to delete the plaintext `pin` fields
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
  npx ts-node scripts/migrateEmployeePins.ts --strip
```

Also: the default PINs in `.env.example` (0000 / 1234 / 8888) are useless once
PINs are stored hashed. Pick real PINs per employee.

### 5. Configure Firestore TTL on `_rateLimits`

The new rate-limit docs include an `expiresAt` field. To clean them up
automatically: Firestore Console → Indexes / TTL → Add TTL policy →
Collection `_rateLimits`, field `expiresAt`.

### 6. Cloud Functions region (optional but recommended)

All callable functions are deployed in `us-central1` (default). Your customers
are in Spain — moving to `europe-west1` would shave ~100-150ms RTT.

This is **not** done automatically because it requires deleting the existing
functions and re-creating them in europe-west1, plus updating the Stripe
webhook URL and the CSP `connect-src`. If you want to do it:

```bash
# 1. Add to functions/src/index.ts at the top:
#    import { setGlobalOptions } from 'firebase-functions/v2';
#    setGlobalOptions({ region: 'europe-west1' });
# 2. Delete the us-central1 functions:
firebase functions:delete <name> --region us-central1 --force
# 3. Deploy fresh:
firebase deploy --only functions
# 4. Update the Stripe webhook endpoint URL in Stripe Dashboard
# 5. Update firebase.json CSP connect-src to include
#    https://europe-west1-galaxia-phone.cloudfunctions.net
```

For now the code keeps `us-central1` so nothing breaks on deploy.

---

## What changed in this branch

### Critical security fixes

| # | Issue | Files |
|---|-------|-------|
| 1 | Removed `assignAdminRole` superadmin backdoor | `functions/src/index.ts` |
| 1 | Removed `batchUpdateProductSEO` backdoor | `functions/src/index.ts` |
| 2 | Fixed `submitMailInRepair` (region mismatch + v1/v2 signature mismatch) | `functions/src/index.ts`, `components/MailInRepair.tsx`, `components/RepairServices.tsx` |
| 3 | Added rate limiting + length caps on `submitMailInRepair` | `functions/src/index.ts` |
| 3 | HTML-escape user input in mail-in repair email + stopped putting device password in email body | `functions/src/index.ts` |
| 4 | Loud warning when App Check missing in production | `services/firebase.ts` |
| 5 | Storage rules now allow `superadmin` (was admin-only) | `storage.rules` |
| 6 | Real client IP extraction from `x-forwarded-for` for rate limits | `functions/src/utils.ts`, `functions/src/index.ts` |
| 7 | Server-side PIN verification (was client-side `emp.pin === pin`) | `functions/src/index.ts`, `components/AttendancePanel.tsx`, `scripts/migrateEmployeePins.ts` |
| 8 | CSP: added Stripe Checkout, Sentry US ingest, App Check, reCAPTCHA frame | `firebase.json` |
| 9 | `sendOrderNotification` now requires admin role + has rate limit | `functions/src/index.ts` |

### Correctness fixes

| # | Issue | Files |
|---|-------|-------|
| 10 | `createPaymentIntent` now increments `promoCodes.usedCount` after successful PI creation (so `maxUses` actually works) | `functions/src/index.ts` |
| 11 | `processScheduledDeletions` now pages results (was loading all customers in one query) | `functions/src/index.ts` |
| 12 | Removed MOCK_PRODUCTS fallback that caused checkout to fail when Firestore returned empty | `App.tsx` |
| 13 | Stale-closure useEffect for checkout autofill — now uses refs | `App.tsx` |
| 14 | Removed duplicate dynamic `import('./services/sentry')` | `index.tsx` |
| 15 | Stripe API version no longer cast with `as` to a future-dated string — let the SDK pin | `functions/src/index.ts` |
| 16 | Cleaned up duplicated `update` rule for `customers` | `firestore.rules` |
| 17 | Added Firestore rules for `employees`, `mailInRepairs`, `_rateLimits` (were default-deny but undocumented) | `firestore.rules` |

### Quality / DX

| # | Issue | Files |
|---|-------|-------|
| 18 | Added `eslint-plugin-react-hooks` (catches future stale-closure bugs) | `eslint.config.js`, `package.json` |
| 19 | Removed unused `loadEnv` from vite config | `vite.config.ts` |
| 20 | Removed `as any` from callable invocations; added typed responses | `components/MailInRepair.tsx`, `components/RepairServices.tsx` |
| 21 | Tightened `tsconfig.json` (`noFallthroughCasesInSwitch`, `noImplicitOverride`, `forceConsistentCasingInFileNames`) | `tsconfig.json` |
| 22 | Added `engines.node >= 20` to root `package.json` | `package.json` |
| 23 | CI workflow now has a `workflow_dispatch` deploy job (gated on secrets) | `.github/workflows/ci.yml` |

### New files

  - `functions/src/utils.ts` — `escapeHtml`, `getClientIp`, `checkRateLimit`,
    `requireAdmin`. Reused across functions.
  - `scripts/migrateEmployeePins.ts` — one-shot migration to hash PINs.
  - `CHANGES.md` — this document.

---

## Things I did NOT do (need your call)

  - **Migrate everything to firebase-functions v2.** The package is still on
    v5; all callables use the v1 `(data, context)` signature except
    `submitMailInRepair` which I switched back to v1 to match. Full v2
    migration would mean upgrading the package, rewriting every function, and
    redeploying. Worth doing eventually but it's a separate PR.
  - **Move the Cloud Functions to europe-west1.** Discussed in follow-up #6
    above — needs Stripe webhook URL update + CSP change.
  - **Move the marketing/internal `.md` files into a private location.** Files
    like `POS_FEATURE_MAP.md`, `AGENTS.md`, `FEEDBACK.md` etc. expose internal
    process info to anyone reading the public repo. Up to you whether to
    `git rm` them or move to a private wiki.
  - **Replace the Stripe live publishable key in `.env.local` with `pk_test_…`
    for development.** That's an environment / hygiene fix you do locally.
