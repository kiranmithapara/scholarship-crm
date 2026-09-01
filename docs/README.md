# Scholarship CRM

A production-ready CRM for managing scholarship applications, referral partners, and students — built with React 19, TypeScript, Express, and PostgreSQL.

---

## Overview

Scholarship CRM lets a **Super Admin** oversee the entire scholarship program while **Referral Partners** (referred to in the UI as Referral Admins) submit and track their own students' applications. The system handles the full lifecycle: application submission → document upload → verification → payment → MYSY scholarship tracking → completion, with a full audit trail (login logs + activity logs) throughout.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, React Router, React Hook Form, Zod, Axios, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript, Sequelize ORM |
| Database | PostgreSQL |
| Auth | JWT (access + refresh), Email OTP, bcrypt |
| Storage | Firebase Storage (signed URLs — documents are never public) |
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
cp .env.example .env        # fill in DB, JWT, SMTP, Firebase credentials
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

- **Super Admin** — full access: manages referral partners, verifies/corrects applications, views all students, manages settings, views login/activity logs.
- **Referral Admin** — scoped access: manages their own students only, applies for scholarships, tracks their own commission.

## Documentation

- [DATABASE.md](./DATABASE.md) — schema, ER diagram, migrations
- [API.md](./API.md) — REST endpoint reference
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — folder-by-folder breakdown and architecture
- [INSTALLATION.md](./INSTALLATION.md) — local setup and deployment guide

## Architecture Principles

- **Clean layered architecture**: Route → Middleware → Controller → Service → Model, on the backend; Page → Hook → Service → Axios, on the frontend.
- **Soft deletes** on `users` and `students` — scholarship records are never hard-deleted.
- **Ownership enforcement at the service layer** — a Referral Admin can never fetch another partner's students, even by guessing a student ID.
- **Firebase Storage only** for files — the database never stores binary data, only signed URLs.
- **Standard API envelope** everywhere: `{ success, message, data }` on success, `{ success, message, errors }` on failure.
