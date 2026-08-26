# CINEMA — Movie Ticket Reservation & Seat Selection Platform

Real-time online movie ticket reservation and interactive seat-selection platform for local cinemas in Ethiopia. Built with React 19 + TypeScript + Vite on the frontend and Express + Node.js + Firebase Admin SDK & Firestore on the authoritative backend, integrated with Chapa for payments and comprehensive administrative controls.

---

## Architecture & System Topology

```
Client (React / Vite Single Page App)
  ├─ Firebase Client SDK   — User Authentication, Real-time seat subscription (onSnapshot)
  └─ Authoritative API     — Express Server (/api/*)
       ├─ /api/auth        — Authentication verification & profile synchronization
       ├─ /api/reservations— Atomic reservation creation, seat locking & cancellations
       ├─ /api/payments    — Chapa payment initialization & webhook verification
       ├─ /api/admin       — Multi-venue catalog management & RBAC enforcement
       ├─ /api/health      — Health check & telemetry
       └─ Rate Limiters    — Burst protection & brute-force mitigation
```

### Security & Authority Guarantees

1. **Authoritative Backend**: All seat locks, reservation pricing calculations, and payment confirmations happen server-side inside atomic Firestore transactions. The client cannot send arbitrary prices or forge seat assignments.
2. **Atomic Concurrency Protection**: Seat locks are keyed by `${showtimeId}_${seatId}`. If two users attempt to reserve the same seat simultaneously, exactly one succeeds and the other is returned an immediate `409 Conflict`.
3. **Role-Based Access Control (RBAC)**: Only authorized administrators (`role: "ADMIN"`) can access administrative endpoints (`/api/admin/*`). Customer role elevation is restricted.
4. **Audit Logging**: Sensitive administrative actions (movie creation, schedule updates, cancellations) are recorded in Firestore with sensitive fields (passwords, tokens, credentials) automatically sanitized and redacted.
5. **Rate Limiting**: Tiered rate limiting protects authentication, booking, payment, and admin APIs against abuse.

---

## Automated Test Suite

A comprehensive test suite is included to verify all priority business logic:

```bash
npm test
```

### Test Coverage Areas

- **Authentication & RBAC (`tests/auth.test.ts`)**: Verifies admin email validation, role restrictions, and forbidden customer elevation.
- **Reservations & Pricing (`tests/reservations.test.ts`)**: Verifies server-calculated prices, VIP modifiers, booking code formats, 15-minute hold windows, and data ownership.
- **Concurrency & Seat Locking (`tests/concurrency.test.ts`)**: Simulates simultaneous booking attempts on the same seat to guarantee single-winner atomic execution.
- **Payment Verification (`tests/payments.test.ts`)**: Verifies amount match, currency verification (ETB), price tampering rejection, and webhook idempotency.
- **Showtime Conflict Detection (`tests/showtimes.test.ts`)**: Verifies hall scheduling conflict prevention, multi-hall parallelism, and multi-cinema independence.
- **Audit Logging Security (`tests/auditLog.test.ts`)**: Tests automatic stripping of secrets, passwords, and tokens before writing logs.
- **Rate Limiting (`tests/rateLimiter.test.ts`)**: Verifies threshold enforcement and client IP burst protection.

---

## Environment Configuration

| Variable | Description |
|---|---|
| `PORT` | Web server port (Default: `3000`) |
| `NODE_ENV` | Runtime environment (`development` \| `production`) |
| `FRONTEND_URL` | Allowed CORS origin for production |
| `ADMIN_EMAILS` | Comma-separated list of authorized admin email addresses |
| `CHAPA_SECRET_KEY` | Chapa merchant API secret key for payment processing |
| `CHAPA_PUBLIC_KEY` | Chapa public key for client integration |
| `CHAPA_WEBHOOK_SECRET` | Chapa webhook signature verification secret |
| `BOOTSTRAP_ADMIN_PASSWORD` | Optional password override for initial admin provisioning |

---

## Deployment & Production Build

### Building the Application

```bash
npm run build
```

This builds the Vite frontend into `dist/` and bundles the standalone Express server to `dist/server.cjs` via `esbuild`.

### Starting the Server

```bash
npm start
```

## Local Development & Setup

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env
npm run dev
```

The app also has a fallback Firebase config in `firebase-applet-config.json` for the original
AI Studio project, used automatically if `.env.local` is absent — replace it with your own project
before deploying anywhere real.

### Cloud Functions

```bash
cd functions
npm install
npm run build          # tsc --noEmit-equivalent build, outputs to lib/
```

To run functions locally against the emulator suite:

```bash
firebase functions:secrets:set CHAPA_SECRET_KEY   # or leave unset to test PAY_AT_CINEMA only
firebase emulators:start
```

## Deployment

Nothing was deployed as part of this change — only prepared. To deploy for real:

```bash
firebase login
firebase use <your-project-id>

# One-time secret setup
firebase functions:secrets:set CHAPA_SECRET_KEY

firebase deploy --only firestore:rules,firestore:indexes,storage:rules,functions
npm run build
firebase deploy --only hosting
```

Then, in the Chapa dashboard, set the webhook/callback URL to your deployed
`chapaWebhook` function's HTTPS trigger URL (printed by `firebase deploy --only functions`).

### Bootstrapping the first admin

There is intentionally no self-service way to become an admin. After registering your own account
normally, open Firebase Console → Firestore → `users/{your-uid}` and set `role` to `"ADMIN"`
manually. From then on, use **Admin → Users** in the app to promote anyone else.

## Testing performed

Two rounds of work exist in this codebase:

- **Prior round** (already in the repo before this pass): `npx tsc --noEmit` in both `functions/`
  and the root, plus a production `npm run build`, were reportedly run clean — see git history for
  that state.
- **This round** (this pass): moved reservation creation into a new `createReservationSecure`
  Cloud Function, added `confirmOfflinePayment` and the scheduled `expirePendingReservations`
  function, and tightened `firestore.rules` accordingly. **These specific changes were reviewed by
  hand only — `npm install` / `tsc --noEmit` / `npm run build` / `firebase deploy --only
  firestore:rules` could NOT be run in this environment**, because it has no network access
  (`npm install` fails fetching packages) and no Firebase project/credentials are configured. This
  is a real limitation, not a formality — treat the new Cloud Functions code as **unverified by a
  compiler** until you run `cd functions && npm install && npm run build` (and `firebase
  deploy --only firestore:rules` in a project's Firebase CLI, ideally against the emulator first)
  yourself. I did not run and did not fabricate any test output for this round.

Live end-to-end testing against a real Firebase project (auth flows, real-time seat updates,
an actual Chapa sandbox transaction) was **not** performed in this environment for either round —
it has no network access to Firebase or Chapa endpoints, and no project credentials were provided.
See "Next steps" below.

### Security checklist — reasoned through against the rules/functions as written

| Scenario | Result |
|---|---|
| Customer tries to self-promote to ADMIN | Blocked — rules forbid changing your own `role`; no UI path exists anymore |
| Customer edits another customer's reservation | Blocked — `update` rule requires `resource.data.userId == request.auth.uid` |
| Customer sends a different `ticketPrice`/`amount` at payment time | Not possible — `initializePayment` never reads an amount from the request |
| Customer calls Firestore directly to set `payments.status = "SUCCESS"` | Blocked — `payments` rule is `allow write: if false` |
| Customer (or malicious script) writes a `reservations`/`reservationSeats` doc directly | Blocked — both collections are `allow create: if false`; only `createReservationSecure` (Admin SDK) can create them |
| Customer sends a forged `totalPrice` or seat list when reserving | Not possible — `createReservationSecure` computes price itself from the showtime/seat docs it reads server-side; the client only sends `showtimeId` + `seatIds` |
| Customer reserves a seat someone already holds for that showtime | Blocked — the transaction re-checks `reservationSeats` for an active (unexpired) lock before committing |
| Seat from a different hall passed for a showtime | Rejected — `createReservationSecure` checks `seat.hallId == showtime.hallId` for every seat |
| Admin tries to "Mark Confirmed" a reservation paying online (Chapa/Telebirr/Card) | Blocked — `confirmOfflinePayment` refuses unless the linked payment record's `method == 'PAY_AT_CINEMA'`; the UI also hides the button for non-offline reservations |
| Admin (or anyone) tries a direct Firestore write setting `reservations.status = 'CONFIRMED'` | Blocked — rules only allow a direct client write to `CANCELLED`, never `CONFIRMED`, for owners or admins |
| Customer hits an admin-only Firestore write (e.g. edit a movie) | Blocked — requires `isAdmin()` |
| Duplicate Chapa webhook delivery for the same `tx_ref` | Idempotent — second call is a no-op once status is `SUCCESS`/`FAILED` |
| Chapa-reported amount doesn't match stored payment amount | Rejected — marked `FAILED`, reservation never confirmed |
| Invalid/unknown `showtimeId` or `seatId` passed to reservation creation | Rejected inside the transaction with a clear error |
| Reservation left unpaid past its hold window | `expirePendingReservations` (scheduled, every 2 min) cancels it and releases its seats; the seat map also stops showing the lock client-side once `expiresAt` passes, without waiting for the sweep |

## What remains dependent on external credentials

- A real Firebase project (this repo ships with the original AI Studio project's config as a
  fallback — replace it).
- A Chapa merchant account and `CHAPA_SECRET_KEY` for CHAPA/TELEBIRR/CARD payments to work.
  `PAY_AT_CINEMA` works without one.
- Firebase CLI login + project access to actually run `firebase deploy`.

## Next steps for you

1. Point the project at your real Firebase project (update `.env.local` or
   `firebase-applet-config.json`) and run `firebase deploy --only firestore:rules,firestore:indexes,storage:rules`.
2. Register your first account, then manually set its `role` to `ADMIN` in the Firebase Console as
   described above.
3. Get a Chapa secret key and run `firebase functions:secrets:set CHAPA_SECRET_KEY`, then
   `firebase deploy --only functions`.
4. Run through the customer and admin flows end-to-end against the emulator or a staging project
   before going live, including a real Chapa sandbox transaction.
5. Consider code-splitting the Vite bundle (`vite build` currently warns about a >500kB chunk) —
   not a security issue, just a perf note.
