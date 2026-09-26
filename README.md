# CINEMA — Movie Ticket Reservation & Seat Selection Platform

Real-time online movie ticket reservation and interactive seat-selection platform for local cinemas in Ethiopia. Built with React 19 + TypeScript + Vite on the frontend and Express + Node.js + Firebase Admin SDK & Firestore on the authoritative backend, integrated with Chapa for payments and comprehensive administrative controls.

> **Note on Architecture**: This project runs on a standard Express.js / Node.js backend. **Firebase Cloud Functions are NOT required**, avoiding the paid Firebase Blaze plan requirement. Firebase Authentication, Firestore, and Firebase Storage remain in use for authentication, database storage, and file assets.

---

## Architecture & System Topology

```
React + Vite Frontend (Single Page App)
        ↓
Express.js + TypeScript Authoritative Backend (/api/*)
        ↓
Firebase Admin SDK (Privileged Server Access)
        ↓
Firestore / Firebase Authentication / Firebase Storage
```

### Route Breakdown

```
Client (React / Vite Single Page App)
  ├─ Firebase Client SDK   — User Authentication, Real-time seat subscription (onSnapshot)
  └─ Authoritative API     — Express Server (/api/*)
       ├─ /api/auth        — Authentication verification & profile synchronization
       ├─ /api/reservations— Atomic reservation creation, seat locking & cancellations
       ├─ /api/payments    — Chapa payment initialization, verification & webhooks
       ├─ /api/admin       — Multi-venue catalog management & RBAC enforcement
       ├─ /api/health      — Health check & telemetry
       └─ Rate Limiters    — Tiered burst protection & brute-force mitigation
```

### Security & Authority Guarantees

1. **Authoritative Backend**: All seat locks, reservation pricing calculations, and payment confirmations happen server-side inside atomic Firestore transactions via the Firebase Admin SDK. The client cannot send arbitrary prices or forge seat assignments.
2. **Hardened Firestore Security Rules**: Client direct writes to `reservations`, `reservationSeats`, and `payments` are strictly denied (`allow write: if false;`). Public catalog collections (`movies`, `cinemas`, `halls`, `seats`, `showtimes`) can only be modified by administrators.
3. **Atomic Concurrency Protection**: Seat locks are keyed by `${showtimeId}_${seatId}`. If two users attempt to reserve the same seat simultaneously, exactly one succeeds and the other is returned an immediate `409 Conflict`.
4. **Role-Based Access Control (RBAC)**: Only authorized administrators (`role: "ADMIN"`) can access administrative endpoints (`/api/admin/*`). Customer role elevation is restricted.
5. **Background Hold Expiration**: An in-process background worker (`expirePendingReservationsTask`) runs every 2 minutes within Express to automatically cancel unconfirmed reservations and release locked seats after their 15-minute hold expires.
6. **Audit Logging**: Sensitive administrative actions (movie creation, schedule updates, cancellations) are recorded in Firestore with sensitive fields (passwords, tokens, credentials) automatically sanitized and redacted.
7. **Rate Limiting**: Tiered rate limiting protects authentication, booking, payment, and admin APIs against abuse.

---

## Environment Configuration

Configure variables in `.env` (refer to `.env.example`):

| Variable | Description |
|---|---|
| `PORT` | Web server port (Default: `3000`) |
| `NODE_ENV` | Runtime environment (`development` \| `production`) |
| `FRONTEND_URL` | Allowed frontend origin for CORS (e.g. `http://localhost:3000`) |
| `BACKEND_URL` | Server URL (e.g. `http://localhost:3000`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID (e.g. `kali-cinema-booking`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional path to service account JSON (not needed on GCP with ADC) |
| `ADMIN_EMAILS` | Comma-separated list of authorized admin email addresses |
| `CHAPA_SECRET_KEY` | Chapa merchant API secret key for payment processing |
| `VITE_API_BASE_URL` | Base URL for API requests (Default: `/api`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID`| Firestore Database ID (Default: `(default)`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |

---

## Local Development & Setup

**Prerequisites:** Node.js 20+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run development server
```bash
npm run dev
```
Starts the full-stack Express server on port 3000 with Vite middleware mounted for the frontend.

---

## Automated Test Suite

A comprehensive test suite verifies business logic and security properties:

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

## Production Build & Deployment

### 1. Building the Application
```bash
npm run build
```
This builds the Vite frontend into `dist/` and bundles the standalone Express server to `dist/server.cjs` via `esbuild`.

### 2. Starting the Production Server
```bash
npm start
```
Starts the production Express server serving API routes and static assets from `dist/`.

### 3. Deploying the Express Application
The production application can be deployed to any standard Node.js hosting platform (such as Google Cloud Run, Railway, Render, Fly.io, or any VPS/container environment) by running `npm start`.

### 4. Deploying Firestore & Storage Rules
Deploy your Firestore and Storage rules using the Firebase CLI without touching Cloud Functions:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 5. Chapa Webhook Setup
In your Chapa dashboard, configure the webhook URL to:
```
https://<YOUR_DOMAIN>/api/payments/webhook
```

---

## Administrator Account Provisioning

There is intentionally no self-service way to become an administrator. To configure the first admin:
1. Register an account through the app UI.
2. In your `.env` file, add the account email to `ADMIN_EMAILS` (e.g. `ADMIN_EMAILS=admin@kalicinema.com,your-email@example.com`).
3. Upon login, the `/api/auth/me` endpoint will verify the authorized list and assign the `ADMIN` role.
4. Alternatively, open Firebase Console → Firestore → `users/{your-uid}` and set `role` to `"ADMIN"`.
5. Once an admin account exists, that administrator can manage roles for other users in the **Admin → Users** interface.
