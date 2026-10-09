# MedBookInd — Page & Feature Documentation

## High-level overview

**Goal:** A healthcare practice management app with role-based areas, patient/consult flows, configuration, and guided practice onboarding.

**Code layout:**

| Area | Location |
|------|----------|
| Routes | `src/routes/AppRoutes.tsx` |
| API clients | `src/services/*.ts` |
| Auth | `src/contexts/AuthContext.tsx`, `src/services/auth.service.ts` |
| Backend (REST) | `medbookind.server` (Node.js, Express, PostgreSQL) |

---

## UX / UI principles

- Minimal, readable layouts; Tailwind utility styling  
- Responsive (mobile / tablet / desktop)  
- Role-specific navigation (`Sidebar`, `ProtectedRoute`, `PrivateRoute`)  
- Charts and KPI-style cards where dashboards exist (`recharts`)  
- Accessibility-oriented components (Radix-style patterns, labels, focus)  
- Optional: dark mode and WebSockets can be added later; current stack is REST-first  

---

## Technology stack

**Frontend**

- React 18 + TypeScript  
- Vite (dev server; `/api` proxied to backend)  
- Tailwind CSS  
- Radix UI primitives (`@radix-ui/*`)  
- Lucide React icons  
- React Router v6  
- Axios for HTTP  
- Zod (where forms use validation)  
- React Context (`AuthContext`, `ModalContext`)  

**Backend (this repo)**

- Node.js + Express (TypeScript) — `medbookind.server`  
- PostgreSQL (`PG*` or `DATABASE_URL` in `.env`)  
- JWT for `/api` auth  

**Charts**

- Recharts; custom metric cards on dashboards  

---

## Authentication (`/auth`)

**Purpose:** Login, register, forgot/reset password (OTP-style flow in UI).

**Features**

- Modes: login / register / forgot / reset  
- Password strength hinting (client-side)  
- Role stored on user; post-login redirect by role  
- Tokens in `localStorage`; Axios sends `Authorization: Bearer`  

**Related code:** `src/pages/auth/Auth.tsx`, `auth.service.ts`  

---

## Onboarding (`/onboarding`)

**Purpose:** First-time practice setup after registration — wizard with **onboarding progress** in the UI.

### Steps (order)

1. **Practice details** — name, type, address, contact, optional logo  
2. **Locations** — one or more sites (name, address, city, state, postal, phone)  
3. **Practice roles** — e.g. hygienist, front desk (used when assigning staff)  
4. **App users** — extra users (optional row set); roles/locations tied to saved data  
5. **Subscription** — plan selection; **Complete setup** calls the API and marks the user onboarded  

### Onboarding progress (implemented)

- **Wizard position:** “Step *n* of 5” and a **gradient progress bar** (current step / total)  
- **Checklist completion:** five chips (Practice, Locations, Roles, Users, Plan) derived from saved + form state  
- **Overall checklist %** shown next to the wizard  
- **Step tabs** are clickable to jump between steps (same step index kept in sync)  
- **Back / Save and continue** navigate steps; last step uses **Complete setup** (subscription API + `isOnboarded` + redirect to role dashboard)  

**Related code:** `src/pages/onboarding/Onboarding.tsx`, `onboarding.service.ts`, `src/utils/dashboardPath.ts`  

---

## Dashboards & home routes

Routes follow **`/role/...`** (not `/dashboard/role`).

| Role | Main dashboard route | Notes |
|------|----------------------|--------|
| Admin | `/admin/dashboard` | KPIs, consult links, settings entry |
| Doctor | `/doctor/dashboard` | Also `/doctor/doctor-dashboard` alias |
| Staff | `/staff/dashboard` | Generic `Dashboard` component; optional `/staff/staff-dashboard` |
| Patient | `/patient/patient-dashboard` | Self-service |
| Developer | `/developer/dashboard` | Internal / practice tooling |

**Related:** `AdminDashboard.tsx`, `DoctorDashboard.tsx`, `StaffDashboard.tsx`, `PatientDashboard.tsx`, `DeveloperDashboard.tsx`, `Dashboard.tsx`  

---

## Patient management

| Feature | Route / location |
|---------|------------------|
| Patient profile | `/patient/patient-profile`, `/doctor/patients/:id` |
| New patient | Often embedded (e.g. consult manager modal / `NewPatientForm`) |

**Related:** `src/pages/patients/PatientProfile.tsx`, `src/components/patients/NewPatientForm.tsx`  

---

## Consultation

| Page | Route |
|------|--------|
| Consult manager | `/admin/consult-manager`, `/staff/consult-manager` |
| New consult (example) | `/admin/newcm` |

**Related:** `consult-manager/consultmanager.tsx`, `newcm.tsx`  

---

## Configuration (admin)

| Page | Route |
|------|--------|
| Treatment (categories, plans, add-ons) | `/admin/configuration/treatment` |
| Patient form config | `/admin/configuration/patient` |
| Payment config | `/admin/configuration/payment` |
| Appointment config | `/admin/configuration/appointment` |

**API:** `txconfig.service.ts` → `/api/TreamentConfig` (spelling matches legacy client)  

---

## Settings & practice

| Area | Route |
|------|--------|
| General settings | `/admin/settings` (and per-role `/settings` where routed) |
| Practice management | `/admin/practice-management`, `/developer/practicemanagement` |
| Subscription | `/admin/subscription` |

---

## Placeholder / future screens

Routed placeholders (title + path) until full UI is built:

- `/admin/appointments`, `/admin/departments`, `/admin/billing`  
- `/staff/appointments`  
- `/patient/book-appointment`  
- `/doctor/patients` (list — profile uses `:id`)  

**Component:** `src/pages/PlaceholderPage.tsx`  

---

## Advanced / cross-cutting features

- **Notifications:** can be implemented via polling, SSE, or WebSockets later  
- **Filters:** date ranges, role filters, patient search — per page  
- **RBAC:** `ProtectedRoute` + `user.role`  
- **Export:** PDF/CSV via client libs (`jspdf`, `@react-pdf/renderer`) where used  

---

## Implementation notes

**Components**

- Shared UI under `src/components/`  
- Layout: `Layout`, `Sidebar`, `Navbar`  

**API surface (server)**

- `/api/auth` — login, register, reset, validate token  
- `/api/user` — users, roles, locations for practice  
- `/api/practice`, `/api/location`  
- `/api/Onboarding` — wizard persistence  
- `/api/TreamentConfig` — treatment configuration  

**Performance**

- Route-level code splitting optional (`React.lazy`)  
- Memoization where lists are heavy  

**Testing (recommended)**

- Unit: services and pure helpers  
- Integration: auth + onboarding  
- E2E: login → onboarding → dashboard  

---

## Document history

This file tracks **MedBookInd** as implemented in this monorepo (client + `medbookind.server`). Update routes here when `AppRoutes.tsx` changes.
