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
export const addTimelineStageSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    event: z.enum([
      "application_filled",
      "application_locked_by_student",
      "documents_submitted",
      "help_center_verification_completed",
      "commissioner_verification",
      "query_raised",
      "query_resolved",
      "scholarship_approved",
      "scholarship_amount_credited",
      "payment_pending",
      "payment_received",
      "payment_verified",
      "case_completed",
      "correction_requested",
      "receipt_uploaded",
    ]),
    note: z.string().trim().max(1000).optional(),
  }),
});
