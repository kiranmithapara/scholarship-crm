# Scholarship CRM

A production-ready Scholarship CRM — React 19 + TypeScript frontend, Express + PostgreSQL backend, Firebase Storage, JWT + Email OTP authentication, role-based access for Super Admin and Referral Admin.

**Full documentation lives in [`docs/`](./docs/README.md):**

- [`docs/README.md`](./docs/README.md) — overview, tech stack, quick start
- [`docs/INSTALLATION.md`](./docs/INSTALLATION.md) — full local setup + deployment guide
- [`docs/DATABASE.md`](./docs/DATABASE.md) — schema and ER diagram
- [`docs/API.md`](./docs/API.md) — REST API reference
- [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) — architecture and folder breakdown

## Quick start

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run db:migrate && npm run db:seed && npm run dev

# Frontend (new terminal)
cd client && cp .env.example .env && npm install && npm run dev
```

Default login: `admin@scholarshipcrm.com` / `Admin@12345` — change immediately after first login.
