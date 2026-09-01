# PROJECT STRUCTURE — Scholarship CRM

Ye document poore project ki folder structure explain karta hai — har folder **kis liye hai**, aur **Clean Architecture + SOLID principles** kaise follow ho rahe hain.

---

## High Level Overview

```
scholarship-crm/
├── client/          → React 19 + TypeScript Frontend (Vite)
├── backend/         → Node.js + Express + TypeScript Backend (REST API)
└── docs/            → Saari documentation (README, API, DATABASE, etc.)
```

Frontend aur Backend completely **decoupled** hain — dono independent repos ki tarah kaam kar sakte hain, sirf REST API (Axios) se baat karte hain. Isse:
- Frontend Vercel pe deploy hota hai
- Backend Render pe deploy hota hai
- Dono independently scale ho sakte hain

---

## CLIENT (Frontend) — Detailed Breakdown

```
client/
├── public/                  → Static assets (favicon, robots.txt, manifest)
├── src/
│   ├── assets/
│   │   ├── images/           → Logos, illustrations, backgrounds
│   │   └── icons/             → Custom SVG icons (Lucide covers most, ye extra ke liye)
│   │
│   ├── components/
│   │   ├── ui/                → Shadcn base components (Button, Input, Dialog, etc.)
│   │   ├── common/             → App-wide reusable components (Avatar, Badge, EmptyState, ErrorState, Loader)
│   │   ├── layout/              → Sidebar, Topbar, DashboardShell, AuthLayout wrapper pieces
│   │   ├── forms/                → Reusable form building blocks (FormInput, FormSelect, FileUpload, OTPInput)
│   │   ├── tables/                → TanStack Table wrapper, DataTable, TablePagination, TableFilters
│   │   └── charts/                 → Recharts wrappers (MonthlyStudentsChart, ApplicationsChart)
│   │
│   ├── pages/                → Route-level pages (ONLY layout + data wiring, no business logic here)
│   │   ├── auth/                → Login, Register, ForgotPassword, VerifyOTP
│   │   ├── dashboard/             → SuperAdminDashboard
│   │   ├── referral-partners/      → PartnerList, PartnerProfile
│   │   ├── students/                → StudentList, StudentDetails (with tabs)
│   │   ├── applications/             → ApplyForReceipt (Referral Admin)
│   │   ├── settings/                  → Settings (Super Admin only)
│   │   ├── logs/                       → LoginLogs, ActivityLogs
│   │   └── profile/                     → Profile page (both roles)
│   │
│   ├── layouts/               → Route wrapper layouts (AuthLayout, DashboardLayout)
│   ├── hooks/                  → Custom hooks (useAuth, useDebounce, usePagination, useTheme)
│   ├── contexts/                → React Context providers (AuthContext, ThemeContext)
│   ├── services/                 → Axios API call functions, ek service file per module (auth.service.ts, student.service.ts...)
│   ├── types/                      → TypeScript interfaces/types (User, Student, Partner, Application...)
│   ├── utils/                       → Pure helper functions (formatDate, formatCurrency, validators)
│   ├── lib/                          → 3rd-party lib configs (axios instance, react-query client, cn() utility)
│   ├── routes/                        → React Router route definitions + ProtectedRoute + RoleBasedRoute
│   ├── store/                          → Global state (Zustand — lightweight, agar zaroorat pade)
│   └── constants/                       → Enums, static dropdown values, route paths, roles
```

**Kyun ye separation?**
- `services/` → Sirf API calls, koi UI logic nahi (Single Responsibility)
- `pages/` → Sirf composition, koi direct API call nahi — hamesha `services/` se hoke jayega
- `components/ui/` vs `components/common/` → `ui` = Shadcn primitives (mostly untouched), `common` = humare khud ke reusable pieces

---

## BACKEND — Detailed Breakdown

```
backend/
├── src/
│   ├── controllers/     → Request/Response handling ONLY (thin layer) — business logic yaha nahi
│   ├── services/          → Actual business logic (createStudent, calculateCommission, etc.)
│   ├── routes/              → Express route definitions, controller se bind karte hain
│   ├── middlewares/           → auth.middleware, role.middleware, error.middleware, rateLimiter, upload.middleware
│   ├── models/                  → Sequelize models (User, Student, Application, Payment, ActivityLog, LoginLog)
│   ├── validators/                → Zod/Joi schemas for request validation
│   ├── config/                      → DB config, Firebase config, Nodemailer config, env config
│   ├── helpers/                       → Small reusable helper functions (generateOTP, hashPassword, jwt helpers)
│   ├── database/
│   │   ├── migrations/                  → Sequelize migrations (schema version control)
│   │   └── seeders/                       → Initial seed data (default Super Admin, etc.)
│   ├── jobs/                                → Cron/scheduled tasks (OTP cleanup, log rotation)
│   ├── utils/                                 → Logger (Winston), response formatter, async handler wrapper
│   ├── types/                                   → Shared TypeScript types/interfaces
│   └── logs/                                      → Runtime log files (Winston output)
├── uploads/                    → Temp local storage before Firebase upload (never final storage)
```

**Layered Architecture Flow:**

```
Route → Middleware (auth/validation) → Controller → Service → Model (Sequelize) → PostgreSQL
```

- **Controller** = "what to do with this request" (thin)
- **Service** = "how business logic actually works" (thick, testable, reusable)
- **Model** = "how data is shaped and stored"

Isse har layer ki apni ek zimmedari hai (Single Responsibility Principle), aur agar kal ko REST se GraphQL bhi shift karna pade, sirf controllers/routes badalne padenge — services waise hi rahenge.

---

## Root Level

```
scholarship-crm/
├── client/
├── backend/
└── docs/
    ├── README.md              → Project overview, setup, quick start
    ├── DATABASE.md              → ER diagram, tables, relationships
    ├── API.md                     → All API endpoints with request/response
    ├── PROJECT_STRUCTURE.md         → Ye file
    └── INSTALLATION.md                → Step-by-step local + production setup
```

---

## Naming Conventions (poore project mein follow hoga)

| Type | Convention | Example |
|---|---|---|
| React Components | PascalCase | `StudentCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Services | camelCase + `.service.ts` | `student.service.ts` |
| Backend Controllers | camelCase + `.controller.ts` | `student.controller.ts` |
| Backend Models | PascalCase (singular) | `Student.ts` |
| Routes files | camelCase + `.routes.ts` | `student.routes.ts` |
| Types/Interfaces | PascalCase, prefixed `I` optional | `Student`, `IApiResponse` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

---

**Status:** All parts complete — folder structure, frontend, backend, database, authentication, dashboard, and all 13 pages/modules are built, tested, and documented. See [README.md](./README.md) for the full module list and [INSTALLATION.md](./INSTALLATION.md) to run it locally.
