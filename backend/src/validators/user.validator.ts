import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full name is too short").max(150).optional(),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
      .optional(),
  }),
});
