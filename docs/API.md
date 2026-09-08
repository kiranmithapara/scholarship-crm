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
| GET | `/:id` | Full profile: stats + pricing + student list |
| PATCH | `/:id/status` | Block/activate — body `{ isActive: boolean }` |
| PATCH | `/:id` | Update name/mobile/photo |
| PATCH | `/:id/pricing` | **V2 NEW** — body `{ prepaidCost, postpaidCost }`. Sets this partner's buying cost per service type; becomes the `buyingPrice` auto-filled when they add a student. |

---

## Students — `/students`

Every route requires login; **ownership is enforced in the service layer** — a Referral Admin only ever sees/edits their own students, regardless of what ID they pass.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any | List, scoped automatically by role. `?page&pageSize&search&serviceType&status` |
| POST | `/` | Any | Create application. Body includes `serviceType` (`prepaid`\|`postpaid`) and `sellingPrice`; `buyingPrice`/`partnerProfit` are computed server-side from the partner's pricing. |
| GET | `/:id` | Owner or Super Admin | Full details incl. documents, payments, timeline, commission, financials |
| PATCH | `/:id` | Owner or Super Admin | Edit (Referral Admin only while `status=pending`); `sellingPrice` changes auto-recompute `partnerProfit` |
| POST | `/:id/verify` | Super Admin | Marks verified, creates commission record using `partnerProfit` (partner's `amount`) and `buyingPrice` (Super Admin's own `adminAmount`) |
| POST | `/:id/request-correction` | Super Admin | Body `{ note }` — sends application back |
| POST | `/:id/complete` | Super Admin | Marks completed (must be `verified` first) |
| POST | `/:id/timeline-stage` | Owner or Super Admin | **V2 NEW, narrowed in V3** — body `{ event, note? }`. Manually logs one of 4 scholarship-progress checkpoints: `application_filled`, `help_center_verification_completed`, `scholarship_approved`, `payment_received` (see CHANGELOG.md). Replaces the removed `/scholarship` (MYSY) endpoint. |
| GET | `/:id/activity-logs` | Owner or Super Admin | **V2 NEW** — system audit trail scoped to this student, powers the Activity Logs tab |
| POST | `/:id/documents` | Owner or Super Admin | `multipart/form-data`: `file` + `type` (`aadhaar`\|`hostel_receipt`\|`twelfth_marksheet`). **V2:** `hostel_receipt` returns `403 Forbidden` if uploaded by a `referral_admin` — Super Admin only. |
| POST | `/:id/payments` | Any | Create a payment record |
| PATCH | `/:id/payments/:paymentId/status` | Super Admin | Update payment status |
| PATCH | `/:id/commission/status` | Super Admin | **V3 NEW** — body `{ status: "pending" \| "paid" }`. Toggles this student's commission; moves it between the Pending/Paid totals on both the Super Admin Dashboard and the Referral Partner's Profile page. |

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
| PATCH | `/` | Update website name, SMTP, Cloudinary folder, allowed IPs, theme |
| POST | `/logo` | `multipart/form-data`: `file` — updates site logo |

---

## Logs — `/logs`

All routes are **Super Admin only**.

| Method | Path | Description |
|---|---|---|
| GET | `/login` | Paginated login attempts (success + failed), `?page&pageSize&search` |
| GET | `/activity` | Paginated audit trail, `?page&pageSize&search` |


