# MedBookInd

Hospital / practice management system with a **React (Vite) client** and **Express + PostgreSQL API**.

| Package | Path | Default URL |
|---------|------|-------------|
| **API (server)** | `medbookind.server/` | `http://localhost:5000` |
| **Web (client)** | `medbookind.client/` | `https://localhost:5173` |

The Vite client proxies `/api` → `http://localhost:5000` (see `medbookind.client/vite.config.ts`).

---

## Prerequisites

- **Node.js 20+**
- **PostgreSQL** (local, Docker, or Neon / cloud)
- npm

---

## Quick start (both apps)

### 1. Server

```bash
cd medbookind.server
cp .env.example .env   # or create .env from the variables below
npm install
npm run dev
```

Optional local Postgres via Docker (from `medbookind.server`):

```bash
npm run db:up
# or: docker compose up -d
```

API health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

On first start, migrations run from `medbookind.server/src/schema.sql` and a demo admin is seeded:

| Field | Value |
|-------|--------|
| Email | `admin@medbook.local` |
| Password | `Admin123!` |

### 2. Client

In a **second** terminal:

```bash
cd medbookind.client
npm install
npm run dev
```

Open **https://localhost:5173** (accept the local SSL certificate if prompted). If 5173 is busy, Vite may use 5174+.

---

## Environment (server)

Create `medbookind.server/.env`:

```env
PORT=5000
JWT_SECRET=change-me-in-production-use-long-random-string
CLIENT_ORIGIN=https://localhost:5173

# Option A — connection string (Neon, local, etc.)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require

# Option B — discrete PG vars (comment out DATABASE_URL if using these)
# PGHOST=localhost
# PGPORT=5432
# PGDATABASE=hospital_mid
# PGUSER=postgres
# PGPASSWORD=your-password

# Razorpay (onboarding subscription) — test keys from dashboard
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# OTP: codes appear in server console in development
OTP_DEV_EXPOSE=true
# SMTP_* and TWILIO_* for production email/SMS
```

If the database does not exist yet, the server may create it by connecting to the default `postgres` database first (user needs `CREATE DATABASE`).

---

## Role-based login

There is **one login screen** (`/auth`). Role is stored on the user account (not chosen at login). After success:

| Role | Dashboard |
|------|-----------|
| Admin | `/admin/dashboard` |
| Doctor | `/doctor/dashboard` |
| Staff | `/staff/dashboard` |
| Patient | `/patient/patient-dashboard` |
| Developer | `/developer/dashboard` |

**How to get each role**

1. **Admin** — use the seeded user, or register as Admin and complete onboarding.
2. **Doctor / Staff / Patient** — register with that role on `/auth`, or have Admin add users under **Settings → User management**, then log in with those credentials.

Wrong-role URLs redirect to **Unauthorized**.

---

## Main features

| Area | What you get |
|------|----------------|
| **Auth** | Login, register, OTP (email/phone), password reset |
| **Onboarding** | Practice setup + Razorpay subscription |
| **Dashboards** | Admin / Doctor / Staff / Patient KPIs |
| **Consult manager** | Live queue, notes, follow-up |
| **Configuration** | Treatment, patient, payment, appointment settings |
| **Settings** | Practice, users, locations |
| **Notifications** | Reminders, alerts, announcements (navbar bell) |
| **Smart filters** | Date, doctor, patient search |
| **RBAC** | Admin full · Doctor limited · Staff operational · Patient self |
| **Export** | Appointments CSV/PDF, patients CSV, billing summary (Admin) |

---

## API overview (`medbookind.server`)

| Prefix | Purpose |
|--------|---------|
| `GET /api/health` | Health check |
| `/api/auth` | Login, register, OTP, password reset, `/me` |
| `/api/user` | Practice users and roles |
| `/api/practice` | Practice details, logo, hours |
| `/api/location` | Locations and staff mapping |
| `/api/Onboarding` | Onboarding wizard |
| `/api/payment` | Razorpay plans, order, verify |
| `/api/TreamentConfig` | Treatment categories / plans (name matches client) |
| `/api/admin` | Admin dashboard |
| `/api/doctor` · `/api/staff` · `/api/patient` | Role dashboards |
| `/api/patients` | Patient registration / profiles |
| `/api/appointments` | Appointments |
| `/api/consultations` | Consult manager |
| `/api/notifications` | List, read, announcements |
| `/api/export` | CSV/JSON export, billing summary, permissions |

### Razorpay (test)

1. Add test keys to `.env`.
2. Onboarding → Subscription → Checkout (UPI test VPA: `success@razorpay`).

### OTP

In development, codes are logged in the API terminal (`OTP_DEV_EXPOSE=true`). Production: configure `SMTP_*` and/or `TWILIO_*`.

---

## Client overview (`medbookind.client`)

| Script | Command |
|--------|---------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Preview | `npm run preview` |
| Lint | `npm run lint` |

Stack: React 18, Vite, TypeScript, Tailwind, React Router, Axios, jsPDF.

Extra UI docs: `medbookind.client/docs/`.

---

## Suggested daily workflow

```bash
# Terminal 1
cd medbookind.server && npm run dev

# Terminal 2
cd medbookind.client && npm run dev
```

1. Open https://localhost:5173  
2. Sign in as `admin@medbook.local` / `Admin123!`  
3. Finish onboarding if prompted  
4. Use **Reports & export**, **Consult Manager**, and the notification bell to verify features  

---

## Project layout

```
hospital MID/
├── README.md                 ← this file (client + server)
├── medbookind.server/        ← Express API
│   ├── src/
│   ├── .env                  ← secrets (do not commit)
│   ├── docker-compose.yml
│   └── package.json
└── medbookind.client/        ← Vite React app
    ├── src/
    ├── docs/
    └── package.json
```

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| API `EADDRINUSE :5000` | Another server already running — use that process or stop it |
| Client on 5174 | Normal if 5173 is taken; CORS allows `https://localhost:*` in dev |
| Empty role / wrong dashboard | Log out and log in again so JWT has current `role` / `practiceId` |
| DB / blank data | Check `DATABASE_URL` or `PG_*` in `medbookind.server/.env`, restart API |
| Proxy errors | Start **server first**, then client |

---

## License / notes

Private project. Do not commit `.env` or real API keys. Rotate any credentials that were shared outside the team.
