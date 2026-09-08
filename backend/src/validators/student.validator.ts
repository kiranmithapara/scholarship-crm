import { z } from "zod";

// V2 UPGRADE: "plan" -> "serviceType" (prepaid/postpaid), MYSY fields removed, sellingPrice
// added as a required field the Referral Partner enters when submitting the application.
export const createStudentSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full name is too short").max(150),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    gender: z.enum(["male", "female", "other"]),
    collegeName: z.string().trim().min(2).max(200),
    universityName: z.string().trim().min(2).max(200),
    course: z.string().trim().min(2).max(150),
    semester: z.string().trim().min(1).max(20),
    serviceType: z.enum(["prepaid", "postpaid"]),
    sellingPrice: z.coerce.number().positive("Selling price must be greater than 0"),
  }),
});

export const listStudentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    serviceType: z.enum(["prepaid", "postpaid", "all"]).optional().default("all"),
    status: z.enum(["pending", "verified", "completed", "correction_requested", "all"]).optional().default("all"),
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    fullName: z.string().trim().min(2).max(150).optional(),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/)
      .optional(),
    collegeName: z.string().trim().min(2).max(200).optional(),
    universityName: z.string().trim().min(2).max(200).optional(),
    course: z.string().trim().min(2).max(150).optional(),
    semester: z.string().trim().min(1).max(20).optional(),
    // Selling price can be corrected by Super Admin/Referral Partner before verification
    sellingPrice: z.coerce.number().positive().optional(),
  }),
});

// V2 UPGRADE: updateScholarshipSchema removed entirely (MYSY fields no longer exist).
// Scholarship progress is now updated via addTimelineStageSchema below.

export const requestCorrectionSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    note: z.string().trim().min(5, "Please describe what needs to be corrected").max(1000),
  }),
});

// V2 UPGRADE: document type restriction now depends on WHO is uploading, not just what plan -
// hostel_receipt can only ever be uploaded by Super Admin (enforced in student.service.ts,
// not here, since that check needs req.user.role which isn't available to a pure Zod schema).
export const documentTypeSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    type: z.enum(["aadhaar", "hostel_receipt", "twelfth_marksheet"]),
  }),
});

export const addPaymentSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    transactionId: z.string().trim().optional(),
  }),
});

export const updatePaymentStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id"), paymentId: z.string().uuid("Invalid payment id") }),
  body: z.object({ status: z.enum(["pending", "completed", "failed"]) }),
});

// V2 NEW: Manually add a scholarship-progress timeline stage - the core of the new
// 13-stage manual tracking workflow. No automation; Super Admin/Referral Partner picks
// the stage explicitly and can attach an internal note.
// V4 CHANGE: manual scholarship-progress tracking simplified from 13 stages down to the
// 6 that are actually used day-to-day (radio-button single-select on the frontend).
// The remaining stages (query handling, credited/pending/verified payment sub-states, case
// completed) are no longer offered here - "payment_received" plus the existing "Mark
// Commission as Paid" action now cover the tail end of the workflow.
export const addTimelineStageSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    event: z.enum([
      "application_filled",
      "application_locked_by_student",
      "documents_submitted",
      "help_center_verification_completed",
      "scholarship_approved",
      "payment_received",
    ]),
    note: z.string().trim().max(1000).optional(),
  }),
});

// V3 NEW: toggle commission status - used on Student Details page (Super Admin only)
export const updateCommissionStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    status: z.enum(["pending", "paid"]),
  }),
});