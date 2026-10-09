# MedBookInd API (`medbookind.server`)

Express + PostgreSQL REST API for the MedBookInd client.

**Full setup for client + server:** see the root [README.md](../README.md).

## Quick run

```bash
cp .env.example .env   # set JWT_SECRET, DATABASE_URL (or PG_*), optional Razorpay
npm install
npm run dev
```

- URL: `http://localhost:5000`
- Health: `GET /api/health`
- Demo admin: `admin@medbook.local` / `Admin123!`

Optional Postgres: `npm run db:up` (Docker Compose in this folder).
