# Cleanco Pipeline Management System

Enterprise SaaS dashboard that digitizes Cleanco’s Excel-based recruitment and UAE visa workflow into a visual state-machine pipeline.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4
- Zustand · Framer Motion · TanStack Table · DND Kit · Recharts
- React Hook Form / Zod ready · Lucide icons · Sonner toasts

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo logins (email only)

| Email | Role |
|-------|------|
| `admin@cleanco.com` | Full access |
| `pro@cleanco.com` | MOHRE / ICP / payments |
| `agency@cleanco.com` | Vacancies, uploads, signed docs |

## Modules

- **Dashboard** — KPIs, charts, activity feed
- **Vacancies** — Create & track manpower requests
- **Candidates** — Upload & directory
- **Pipeline** — Drag-and-drop Kanban (Excel stages)
- **Government** — MOHRE & ICP pending / approved / rejected
- **Payments** — 50 / 1800 / 800 AED fee tracking
- **Agencies · Reports · Notifications · Settings**

## Mock data

Seeded with **10 agencies**, **30 vacancies**, and **300 candidates** across India, Nepal, Pakistan, Bangladesh, Philippines, and Sri Lanka. Data persists in `localStorage` (reset from Settings).

## Workflow

21+ stages from manpower request → visa shared with agency, modeled as a finite state machine with stage history, role-gated transitions, documents, and government fees matching the Cleanco Excel source of truth.
