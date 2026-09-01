# DATABASE.md — Scholarship CRM

PostgreSQL schema, managed entirely through **Sequelize migrations** (never `sequelize.sync()` in production — see `src/database/index.ts`). Soft-deletes (`paranoid: true`) are enabled by default on user-facing entities so nothing is ever hard-deleted by accident.

---

## Entity Relationship Overview

```
                         ┌───────────────┐
                         │     users      │  (super_admin | referral_admin)
                         └───────┬────────┘
                 referral_partner_id │ 1        │ 1
                                     │           │
                    ┌────────────────▼──┐   ┌────▼─────────┐   ┌───────────────┐
                    │     students        │   │  login_logs   │   │ activity_logs  │
                    └──┬───┬───┬───┬─────┘   └───────────────┘   └───────────────┘
             student_id│   │   │   │student_id
        ┌──────────────┘   │   │   └──────────────┐
        │                  │   │                    │
┌───────▼──────┐  ┌────────▼┐ ┌▼────────────┐ ┌─────▼──────┐
│  documents     │  │ payments │ │student_timelines│ │ commissions  │
└────────────────┘  └──────────┘ └─────────────────┘ └──────┬───────┘
                                                              │ referral_partner_id
                                                              └──────────► users

                         ┌───────────────┐
                         │   settings     │  (singleton row, id = 1)
                         └───────────────┘
```

---

## Tables

### `users`
Both **Super Admin** and **Referral Admin** live in this single table, differentiated by `role`.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| full_name | STRING(150) | |
| mobile | STRING(15) | unique |
| email | STRING(150) | unique |
| username | STRING(50) | unique |
| password | STRING | bcrypt hash only |
| role | ENUM | `super_admin`, `referral_admin` |
| photo_url | STRING | Firebase Storage URL only — never a file |
| is_active | BOOLEAN | Super Admin can block/activate |
| is_email_verified | BOOLEAN | set true after OTP verification |
| last_login_at | DATE | |
| deleted_at | DATE | soft-delete |

### `otps`
Short-lived codes for email verification and forgot-password.

| Column | Type | Notes |
|---|---|---|
| email | STRING(150) | |
| code | STRING(10) | |
| purpose | ENUM | `email_verification`, `forgot_password` |
| is_used | BOOLEAN | one-time use |
| expires_at | DATE | `OTP_EXPIRY_MINUTES` from now |

### `students`
Core entity. `referral_partner_id` → `users.id` is how **"My Students"** (Referral Admin) vs **"All Students"** (Super Admin) scoping works everywhere in the API.

| Column | Type | Notes |
|---|---|---|
| plan | ENUM | `2500`, `5000` — drives which documents are required |
| status | ENUM | `pending`, `verified`, `completed`, `correction_requested` — drives the Timeline tab |
| mysy_registration_number / mysy_password | STRING | MYSY govt. portal credentials |
| scholarship_status | ENUM | `pending`, `approved`, `rejected` — MYSY-side status, independent of `status` |
| correction_note | TEXT | set by Super Admin when requesting a correction |
| referral_partner_id | UUID (FK → users) | `onDelete: RESTRICT` — a partner with students can't be hard-deleted |

### `documents`
**Only Firebase Storage URLs are stored — never binary/base64 file data** (per project rule).

| Column | Type | Notes |
|---|---|---|
| student_id | UUID (FK → students) | `onDelete: CASCADE` |
| type | ENUM | `aadhaar`, `hostel_receipt` (plan 2500), `twelfth_marksheet` (plan 5000) |
| file_url | STRING | Firebase download URL |
| uploaded_by | UUID (FK → users) | |

Unique constraint on `(student_id, type)` — a student can't have two active documents of the same type.

### `payments`
The ₹2500/₹5000 receipt payment per student.

| Column | Type | Notes |
|---|---|---|
| amount | DECIMAL(10,2) | |
| status | ENUM | `pending`, `completed`, `failed` |
| transaction_id | STRING | |
| receipt_url | STRING | Firebase URL of uploaded receipt |

### `student_timelines`
Powers the **Timeline** tab.

| Column | Type | Notes |
|---|---|---|
| event | ENUM | `application_submitted`, `verified`, `receipt_uploaded`, `correction_requested`, `completed` |
| note | TEXT | optional context |
| created_by | UUID (FK → users) | who triggered the event |

### `commissions`
What a Referral Admin earns per completed application. One row per student (unique constraint on `student_id`) to avoid double-counting.

| Column | Type | Notes |
|---|---|---|
| referral_partner_id | UUID (FK → users) | |
| student_id | UUID (FK → students, unique) | |
| amount | DECIMAL(10,2) | |
| status | ENUM | `pending`, `paid` |

### `login_logs`
Every login attempt — successful or failed — for the **Login Logs** page (Super Admin only).

| Column | Type | Notes |
|---|---|---|
| user_id | UUID (FK → users, nullable) | null when the attempted email doesn't match any user |
| email_attempted | STRING | |
| ip_address | STRING(45) | IPv6-safe |
| browser / device | STRING | parsed from User-Agent |
| status | ENUM | `success`, `failed` |
| failure_reason | STRING | e.g. "Invalid password", "Account blocked" |

### `activity_logs`
"Who did what, when" audit trail for the **Activity Logs** page.

| Column | Type | Notes |
|---|---|---|
| user_id | UUID (FK → users) | |
| action | STRING(150) | e.g. `STUDENT_CREATED`, `APPLICATION_VERIFIED` |
| details | JSONB | arbitrary structured context |
| ip_address | STRING | |

### `settings`
**Singleton row** (`id` always `1`) for site-wide config, editable only by Super Admin.

| Column | Type | Notes |
|---|---|---|
| website_name | STRING | |
| logo_url | STRING | Firebase URL |
| smtp_* | STRING/INTEGER | SMTP override config |
| smtp_password_encrypted | STRING | AES-encrypted, never plain text |
| allowed_ips | ARRAY(STRING) | empty = allow all |
| default_theme | ENUM | `light`, `dark` |

---

## Migration & Seed Commands

```bash
npm run db:migrate        # applies all pending migrations, in filename order
npm run db:migrate:undo   # rolls back the most recent migration
npm run db:seed           # runs all seeders (creates the default Super Admin)
```

**Default Super Admin** (change immediately after first login):
```
email:    admin@scholarshipcrm.com
username: superadmin
password: Admin@12345
```

## Design Decisions

- **Soft deletes (`paranoid: true`)** on `users` and `students` — scholarship records are legal/financial data and should never disappear permanently from an accidental delete.
- **`RESTRICT` on `students.referral_partner_id`** — prevents deleting a Referral Admin who still has students assigned; they must be reassigned or blocked instead.
- **`snake_case` in Postgres, `camelCase` in Sequelize models** — handled automatically via `underscored: true` in `database.config.ts`.
- **One `commissions` row per student** (not per payment) — commission is earned once per completed application, not per transaction attempt.
