import { z } from "zod";

export const createStudentSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full name is too short").max(150),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    gender: z.enum(["male", "female", "other"]),
    collegeName: z.string().trim().min(2, "College name is required").max(200),
    universityName: z.string().trim().max(200).optional(),
    course: z.string().trim().max(150).optional(),
    semester: z.string().trim().max(20).optional(),
    serviceType: z.enum(["prepaid", "postpaid"]),
    sellingPrice: z.coerce.number().positive("Selling price must be greater than 0").optional(),
    referralPartnerId: z.string().uuid().optional(),
  }),
});

export const listStudentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    serviceType: z.enum(["prepaid", "postpaid", "all"]).optional().default("all"),
    status: z.enum(["pending", "completed", "all"]).optional().default("all"),
    referralPartnerId: z.string().optional(),
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    fullName: z.string().trim().min(2).max(150).optional(),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
    collegeName: z.string().trim().min(2).max(200).optional(),
    universityName: z.string().trim().max(200).optional(),
    course: z.string().trim().max(150).optional(),
    semester: z.string().trim().max(20).optional(),
    sellingPrice: z.coerce.number().positive().optional().nullable(),
    buyingPrice: z.coerce.number().nonnegative().optional(),
  }),
});

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

export const updateCommissionStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    status: z.enum(["pending", "paid"]),
  }),
});

export const updateTimelineNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid student id"),
    timelineId: z.string().uuid("Invalid timeline id"),
  }),
  body: z.object({
    note: z.string().trim().max(1000).nullable(),
  }),
});

export const timelineEntryParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid student id"),
    timelineId: z.string().uuid("Invalid timeline id"),
  }),
});

// V5 NEW: internal notes validators
export const addNoteSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid student id"),
    noteId: z.string().uuid("Invalid note id"),
  }),
  body: z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000),
  }),
});

export const noteParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid student id"),
    noteId: z.string().uuid("Invalid note id"),
  }),
});