# CHANGELOG

## V2 — Hostel Receipt Business CRM Upgrade

The project was upgraded from a generic Scholarship CRM into a purpose-built CRM for a Hostel Receipt business, following the actual referral-partner → student → scholarship-tracking → payment workflow used in production. **No functionality was removed without replacement** — every V1 concept was either renamed to match the real business terminology or replaced with a more accurate model.

### 🔄 Renamed

| V1 | V2 |
|---|---|
| `plan` (`'2500'` / `'5000'`) | `serviceType` (`'prepaid'` / `'postpaid'`) |
| ₹2500 Plan | Prepaid Service |
| ₹5000 Plan | Postpaid Service |

The rename is **data-preserving** — a migration backfills every existing student's new `service_type` from their old `plan` value (`2500` → `prepaid`, `5000` → `postpaid`) before dropping the old column. See `20260201000002-student-business-model-upgrade.js`.

### ❌ Removed

- **MYSY Registration Number** and **MYSY Password** — dropped from the `students` table, all validators, services, and the Student Details UI. This CRM no longer tracks the MYSY government portal directly.
- **Hostel Receipt from the application form** — a Referral Partner can no longer upload a Hostel Receipt when submitting a student. Only Super Admin can, and only after physically creating the receipt offline (see Business Workflow below).
- **Firebase Storage** — fully replaced by **Cloudinary** for all file storage (documents, receipts, avatars, logos). Only Cloudinary URLs are stored in PostgreSQL; no binary data.

### ✅ Added

- **Per-Partner Pricing** — `users.prepaid_cost` / `users.postpaid_cost`, editable only by Super Admin, on the Referral Partner Profile page.
- **Buying Price / Selling Price / Partner Profit** — `students.buying_price` (snapshotted from the partner's rate at application time), `students.selling_price` (entered by the Referral Partner), `students.partner_profit` (auto-computed, never manual).
- **13-Stage Manual Scholarship Progress Tracker** — the `student_timelines.event` enum expanded from 5 generic events to the full workflow:
  1. Application Filled
  2. Application Locked by Student
  3. Documents Submitted at Help Center
  4. Help Center Verification Completed
  5. Commissioner Verification
  6. Query Raised *(optional)*
  7. Query Resolved *(optional)*
  8. Scholarship Approved
  9. Scholarship Amount Credited
  10. Payment Pending
  11. Payment Received
  12. Payment Verified
  13. Case Completed

  Every stage is added manually (Super Admin or Referral Partner) with an optional internal note — there is no automation.
- **Student Details page redesigned** — now 9 tabs: Overview, Documents, Scholarship Progress, Receipt, Financial Summary, Payment History, Timeline, Internal Notes, Activity Logs.
- **Dedicated "Receipt" tab** — shows the Hostel Receipt document specifically; upload control only renders for Super Admin.
- **Per-student Activity Logs** — `GET /students/:id/activity-logs`, scoped audit trail for the new Activity Logs tab.
- **Hostel Receipt upload permission enforcement** — `student.service.ts` throws `403 Forbidden` if a Referral Partner attempts to upload a `hostel_receipt` document type, at the API level (not just hidden in the UI).

### 🗄️ Database Migrations (run in order)

```
20260201000001-add-partner-pricing.js            → users.prepaid_cost, users.postpaid_cost
20260201000002-student-business-model-upgrade.js  → plan→service_type rename, MYSY removal, financial fields
20260201000003-expand-timeline-stages.js          → student_timelines.event ENUM expanded to 15 values
```

All three are additive/transformative on existing data — **no student, partner, or application record is deleted or lost**. Full `down()` rollback migrations are included for each.

### 📌 Business Workflow Reference

**Prepaid Service**: Student pays upfront → Referral Partner collects → sends to Super Admin → Super Admin verifies payment → Super Admin creates and uploads the Hostel Receipt → student record is permanent.

**Postpaid Service**: No advance payment → scholarship progress tracked manually through the 13 stages above → once scholarship is credited, Referral Partner collects payment → sends to Super Admin → Super Admin verifies → Case Completed.

**Students are never hard-deleted** in either flow — every application remains in the database permanently as a future marketing/re-engagement database, per the `paranoid: true` soft-delete setting already in place on the `students` table.
