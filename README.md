# Kali Cinema

Real-time online movie ticket reservation and interactive seat-selection platform for local
cinemas in Ethiopia. Built with React + TypeScript + Vite on Firebase (Auth, Firestore, Cloud
Functions), with Chapa as the payment gateway.

This project originated from Google AI Studio. It has since been secured and connected to a real
(non-fake) payment flow; the original UI/UX was preserved as-is.

## Architecture

```
Browser (React/Vite)
  ├─ Firebase Auth        — email/password accounts, CUSTOMER/ADMIN roles
  ├─ Firestore            — catalog data (read directly); reservations/
  │                          seat locks are READ directly but never
  │                          WRITTEN directly except to cancel — writes
  │                          are restricted by firestore.rules
  └─ Cloud Functions       — the ONLY code allowed to create a reservation,
     (functions/)            confirm a payment, or confirm a reservation.
                              Calls out to Chapa server-side. Never trusts
                              an amount/seat/status from the client.
```

Nothing about the reservation or payment result is ever decided in the browser. The client can
*ask* the backend to reserve seats, start a payment, or check a payment; only
`functions/src/index.ts`, running with the Firebase Admin SDK (which bypasses `firestore.rules`),
is allowed to create a `reservations`/`reservationSeats` doc, write `payments/*.status`, or flip a
reservation to `CONFIRMED`.

## Firestore data model

| Collection         | Purpose                                                              |
|---------------------|-----------------------------------------------------------------------|
| `users`             | Account profile + role (`CUSTOMER` \| `ADMIN`)                        |
| `movies`            | Catalog: title, description, duration, genre, poster/trailer, etc.   |
| `cinemas`           | Cinema branches                                                      |
| `halls`             | Auditoriums, belong to a cinema                                      |
| `seats`             | Physical seats, belong to a hall                                     |
| `showtimes`         | A movie screening in a hall at a date/time, with the ticket price    |
| `reservations`      | A customer's booking for a showtime (status, seats, total price)     |
| `reservationSeats`  | Per-showtime seat lock, keyed `${showtimeId}_${seatId}` — this is what makes seat A1 independently AVAILABLE for one showtime and RESERVED for another |
| `payments`          | Payment attempts, keyed by `reservationId`. Status is server-only.   |

## Security model

- **Firestore rules (`firestore.rules`)** — catalog data (`movies`, `cinemas`, `halls`, `seats`,
  `showtimes`) is public-read, admin-only-write. `reservations` and `reservationSeats` **cannot be
  created by the client at all** (`allow create: if false`) — only the `createReservationSecure`
  Cloud Function creates them. Owners (and admins) may only ever transition a reservation to
  `CANCELLED` via a direct write; `CONFIRMED` is never settable by any direct client write, by
  anyone — only by Cloud Functions, after real payment verification. **`payments` are entirely
  `allow write: if false`** — no client write path exists at all, by design.
- **No self-elevation.** There is no code path, UI button, or rule that lets a user set their own
  `role` to `ADMIN`. The very first admin must be set manually (Firebase Console → Firestore →
  `users/{uid}` → `role: "ADMIN"`, or via `firebase firestore:update` from the CLI as a project
  owner). Every admin after that is promoted from the in-app **Admin → Users** screen by an
  existing admin — enforced server-side, not just hidden in the UI.
- **No fake admin confirmations.** An admin can never mark an online (Chapa/Telebirr/Card)
  payment "paid" from the dashboard — Firestore rules block it as a direct write, and the only
  server path (`confirmOfflinePayment`) refuses any reservation whose linked payment record isn't
  explicitly `PAY_AT_CINEMA`. Online reservations can only reach `CONFIRMED` via the Chapa
  webhook/verify functions after independently verifying the transaction with Chapa.
- **Server-verified reservation creation** — `createReservationSecure` (Cloud Function, Admin SDK)
  re-reads the showtime, hall, and every seat inside a single Firestore transaction: it verifies
  each seat actually belongs to the showtime's hall, computes `totalPrice` itself from the
  showtime's stored `ticketPrice` × each seat's `priceModifier` (never a client-sent number), and
  re-checks every `reservationSeats/{showtimeId}_{seatId}` doc for an active lock before creating
  the reservation — aborting the whole transaction if any selected seat is already taken. Firestore
  guarantees this transaction is atomic and serializable, so two users cannot both win the same
  seat. `src/services/reservations.ts`'s `createReservationAtomic` is now a thin client wrapper
  that calls this function; it does not compute price or touch Firestore directly.
- **Seat-hold expiration** — every PENDING reservation gets an `expiresAt` (15 minutes from
  creation). The scheduled `expirePendingReservations` Cloud Function runs every 2 minutes,
  cancelling any PENDING reservation past its `expiresAt` and releasing its seat locks; cancelled
  reservations are kept for history (`status: CANCELLED`, `cancelReason: EXPIRED`), never deleted.
  The seat map also filters out expired-but-not-yet-swept locks client-side, so a seat appears
  available again immediately rather than waiting for the next sweep — while the transaction inside
  `createReservationSecure` independently re-checks expiry anyway, so this is a UX nicety, not the
  security boundary.
- **Payment verification** — see below.

## Payment flow (Chapa)

```
Customer clicks Pay
  → client calls initializePayment({ reservationId, method })   [Cloud Function]
  → function reads reservation.totalPrice (server truth), NOT any client amount
  → CHAPA/TELEBIRR/CARD: calls Chapa's initialize API, stores payment PENDING,
    returns a checkout_url; client redirects the browser there
  → PAY_AT_CINEMA: stores payment PENDING, reservation stays PENDING
    (seats are already locked; staff confirm payment at the counter later
    via the admin dashboard, which calls confirmOfflinePayment — the only
    path that can flip a PAY_AT_CINEMA reservation to CONFIRMED)
  → customer pays on Chapa's hosted page
  → Chapa calls our chapaWebhook (server-to-server)
  → webhook independently calls Chapa's verify API (never trusts the
    webhook body alone), checks amount + currency match what we stored
  → only if verified: payment → SUCCESS, reservation → CONFIRMED (atomic
    Firestore transaction, idempotent against duplicate webhook deliveries)
  → customer is redirected back to /payment/callback, which calls
    verifyPayment (a second, client-triggerable path to the same
    server-side verification) in case the webhook hasn't landed yet —
    this page never marks anything paid on its own, it only displays
    whatever the backend reports
```

If `CHAPA_SECRET_KEY` isn't configured, `initializePayment` rejects online payment methods with a
clear "gateway not configured" error. `PAY_AT_CINEMA` still works with no gateway at all, since no
money is being processed by the app in that case.

## Local development

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env.local   # fill in your Firebase project's public config
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
