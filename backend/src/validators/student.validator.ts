import { z } from "zod";

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
    plan: z.enum(["2500", "5000"]),
    mysyRegistrationNumber: z.string().trim().optional(),
    mysyPassword: z.string().trim().optional(),
  }),
});

export const listStudentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    plan: z.enum(["2500", "5000", "all"]).optional().default("all"),
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
  }),
});

export const updateScholarshipSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    mysyRegistrationNumber: z.string().trim().optional(),
    mysyPassword: z.string().trim().optional(),
    scholarshipStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});

export const requestCorrectionSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid student id") }),
  body: z.object({
    note: z.string().trim().min(5, "Please describe what needs to be corrected").max(1000),
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
