import { z } from "zod";

export const listPartnersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    status: z.enum(["active", "blocked", "all"]).optional().default("all"),
  }),
});

export const partnerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid partner id"),
  }),
});

export const updatePartnerStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid partner id") }),
  body: z.object({ isActive: z.boolean() }),
});

export const updatePartnerSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid partner id") }),
  body: z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(150).optional(),
    email: z.string().trim().email("Enter a valid email address").optional(),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
      .optional(),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores")
      .optional(),
    password: z
      .string()
      .optional()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined))
      .pipe(z.string().min(6, "Password must be at least 6 characters").optional()),
    prepaidCost: z
      .union([z.coerce.number().nonnegative(), z.literal("")])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    postpaidCost: z
      .union([z.coerce.number().nonnegative(), z.literal("")])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    photoUrl: z.string().url().optional().nullable(),
  }),
});

// V2 NEW: Per-partner pricing - only Super Admin can set what a partner PAYS (their cost)
// for each service type. This becomes the "buying price" auto-filled when that partner adds a student.
export const updatePartnerPricingSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid partner id") }),
  body: z.object({
    prepaidCost: z.coerce.number().nonnegative("Prepaid cost cannot be negative"),
    postpaidCost: z.coerce.number().nonnegative("Postpaid cost cannot be negative"),
  }),
});

export const createPartnerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(150),
    email: z.string().trim().email("Enter a valid email address"),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(50),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

// V3 NEW: mark a commission paid/pending - the fix for the previously-missing action.
export const updateCommissionStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid partner id"),
    commissionId: z.string().uuid("Invalid commission id"),
  }),
  body: z.object({
    status: z.enum(["pending", "paid"]),
  }),
});

// V6 NEW: partner notes validators
export const addPartnerNoteSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid partner id") }),
  body: z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000),
  }),
});

export const updatePartnerNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid partner id"),
    noteId: z.string().uuid("Invalid note id"),
  }),
  body: z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000),
  }),
});

export const partnerNoteParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid partner id"),
    noteId: z.string().uuid("Invalid note id"),
  }),
});
