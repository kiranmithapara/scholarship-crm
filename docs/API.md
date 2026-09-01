# API.md — Scholarship CRM

Base URL: `{API_URL}/api/v1`

Every response follows this envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Errors:
```json
{ "success": false, "message": "...", "errors": { "field": ["reason"] } }
```

---

## Auth — `/auth`

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/register` | Public | Strict | Creates account (role=`referral_admin`), sends OTP |
| POST | `/verify-otp` | Public | Strict | Verifies email OTP, returns tokens (auto-login) |
| POST | `/resend-otp` | Public | Strict | Sends a fresh email verification OTP |
| POST | `/login` | Public | Strict | Email + password login, returns tokens |
| POST | `/forgot-password` | Public | Strict | Sends password-reset OTP (always generic response) |
| POST | `/reset-password` | Public | Strict | Verifies OTP + sets new password |
| POST | `/refresh-token` | Public | General | Exchanges refresh token for a new access token |
| GET | `/me` | Bearer | General | Returns the logged-in user's profile |
| POST | `/change-password` | Bearer | General | Changes password (requires current password) |
| POST | `/logout` | Bearer | General | Records logout activity (client discards tokens) |

### POST `/auth/register`
```json
// Request
{ "fullName": "Ramesh Patel", "mobile": "9876543210", "email": "ramesh@example.com",
  "username": "ramesh_p", "password": "Pass@123", "confirmPassword": "Pass@123" }

// Response 201
{ "success": true, "message": "Registration successful. Please verify your email with the OTP sent.",
  "data": { "email": "ramesh@example.com" } }
```

### POST `/auth/login`
```json
// Request
{ "email": "ramesh@example.com", "password": "Pass@123", "rememberMe": true }

// Response 200
{ "success": true, "message": "Login successful",
  "data": {
    "user": { "id": "...", "fullName": "Ramesh Patel", "role": "referral_admin", "..." : "..." },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  } }
```

### Error examples
```json
// 401 - wrong credentials
{ "success": false, "message": "Invalid email or password" }

// 403 - blocked account
{ "success": false, "message": "Your account has been blocked. Please contact the administrator." }

// 400 - validation
{ "success": false, "message": "Validation failed",
  "errors": { "password": ["Password must contain at least one number"] } }
```

---

## Health — `/health`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Server + DB connectivity status, used by uptime monitors |

---

## Dashboard — `/dashboard`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/super-admin/stats` | Super Admin | Cards + 6-month chart series + recent students, one call |

---

## Referral Partners — `/referral-partners`

All routes are **Super Admin only**.

| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated list, `?page&pageSize&search&status` |
| GET | `/:id` | Full profile: stats + student list |
| PATCH | `/:id/status` | Block/activate — body `{ isActive: boolean }` |
| PATCH | `/:id` | Update name/mobile/photo |

---

## Students — `/students`

Every route requires login; **ownership is enforced in the service layer** — a Referral Admin only ever sees/edits their own students, regardless of what ID they pass.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any | List, scoped automatically by role. `?page&pageSize&search&plan&status` |
| POST | `/` | Any | Create application (Referral Admin creates for self) |
| GET | `/:id` | Owner or Super Admin | Full details incl. documents, payments, timeline, commission |
| PATCH | `/:id` | Owner or Super Admin | Edit (Referral Admin only while `status=pending`) |
| POST | `/:id/verify` | Super Admin | Marks verified, auto-creates commission record |
| POST | `/:id/request-correction` | Super Admin | Body `{ note }` — sends application back |
| POST | `/:id/complete` | Super Admin | Marks completed (must be `verified` first) |
| PATCH | `/:id/scholarship` | Owner or Super Admin | Update MYSY number/password/status |
| POST | `/:id/documents` | Owner or Super Admin | `multipart/form-data`: `file` + `type` (`aadhaar`\|`hostel_receipt`\|`twelfth_marksheet`) |
| POST | `/:id/payments` | Any | Create a payment record |
| PATCH | `/:id/payments/:paymentId/status` | Super Admin | Update payment status |

---

## Users — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| PATCH | `/me` | Any | Update own `fullName`/`mobile` |
| POST | `/me/photo` | Any | `multipart/form-data`: `file` — updates profile photo |

---

## Settings — `/settings`

All routes are **Super Admin only**. `smtpPasswordEncrypted` is never returned in any response.

| Method | Path | Description |
|---|---|---|
| GET | `/` | Current site settings |
| PATCH | `/` | Update website name, SMTP, Firebase bucket, allowed IPs, theme |
| POST | `/logo` | `multipart/form-data`: `file` — updates site logo |

---

## Logs — `/logs`

All routes are **Super Admin only**.

| Method | Path | Description |
|---|---|---|
| GET | `/login` | Paginated login attempts (success + failed), `?page&pageSize&search` |
| GET | `/activity` | Paginated audit trail, `?page&pageSize&search` |


