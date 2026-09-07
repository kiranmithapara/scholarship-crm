# Scholarship CRM — Hostel Receipt Business Edition (V2)

A production-ready CRM for managing a Hostel Receipt referral business — Referral Partners bring students, Super Admin verifies and processes Prepaid/Postpaid service applications, tracks scholarship progress manually, and manages per-application profit. Built with React 19, TypeScript, Express, and PostgreSQL.

> **V2 upgrade note**: this project started as a generic scholarship CRM and was upgraded to match the real Hostel Receipt business workflow. See **[CHANGELOG.md](./CHANGELOG.md)** for exactly what changed and why.

---

## Overview

Scholarship CRM lets a **Super Admin** oversee the entire business while **Referral Partners** (referred to in the UI as Referral Admins) submit and track their own students. The system handles the full lifecycle: application submission → document upload → Super Admin verification → manual 13-stage scholarship-progress tracking → payment → Hostel Receipt issuance (Super Admin only) → completion — with per-application Buying Price / Selling Price / Partner Profit tracked throughout, and a full audit trail (login logs + activity logs) at every step. Students are never deleted — every application remains as a permanent record for future re-engagement.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, React Router, React Hook Form, Zod, Axios, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript, Sequelize ORM |
| Database | PostgreSQL |
| Auth | JWT (access + refresh), Email OTP, bcrypt |
| Storage | Cloudinary (only URLs stored in PostgreSQL, no binary data) |
| Email | Nodemailer |
| Hosting | Frontend → Vercel · Backend → Render · Database → managed PostgreSQL |

## Project Structure

```
scholarship-crm/
├── client/     React frontend (see docs/PROJECT_STRUCTURE.md)
├── backend/    Express API (see docs/PROJECT_STRUCTURE.md)
└── docs/       This documentation
```

## Quick Start

See **[INSTALLATION.md](./INSTALLATION.md)** for full setup instructions. Short version:

```bash
# Backend
cd backend
cp .env.example .env        # fill in DB, JWT, SMTP, Cloudinary credentials
npm install
npm run db:migrate
npm run db:seed             # creates the default Super Admin
npm run dev                 # http://localhost:5000

# Frontend
cd client
cp .env.example .env        # set VITE_API_URL
npm install
npm run dev                 # http://localhost:5173
```

Default Super Admin login (change immediately):
```
email:    admin@scholarshipcrm.com
password: Admin@12345
```

## Roles

- **Super Admin** — full access: manages referral partners and their pricing, verifies/corrects applications, uploads Hostel Receipts, tracks scholarship progress, views all students, manages settings, views login/activity logs.
- **Referral Admin** — scoped access: manages their own students only, submits Prepaid/Postpaid applications with a selling price, tracks their own commission (profit).

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) — **V2 business-model upgrade** — what changed, why, and how to migrate
- [DATABASE.md](./DATABASE.md) — schema, ER diagram, migrations
- [API.md](./API.md) — REST endpoint reference
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — folder-by-folder breakdown and architecture
- [INSTALLATION.md](./INSTALLATION.md) — local setup and deployment guide

## Architecture Principles

- **Clean layered architecture**: Route → Middleware → Controller → Service → Model, on the backend; Page → Hook → Service → Axios, on the frontend.
- **Soft deletes** on `users` and `students` — scholarship records are never hard-deleted.
- **Ownership enforcement at the service layer** — a Referral Admin can never fetch another partner's students, even by guessing a student ID.
- **Cloudinary only** for files — the database never stores binary data, only Cloudinary URLs.
- **Standard API envelope** everywhere: `{ success, message, data }` on success, `{ success, message, errors }` on failure.
