import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    websiteName: z.string().trim().min(2).max(150).optional(),
    smtpHost: z.string().trim().optional(),
    smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
    smtpUser: z.string().trim().optional(),
    smtpPassword: z.string().trim().optional(),
    firebaseStorageBucket: z.string().trim().optional(),
    allowedIps: z.array(z.string().trim()).optional(),
    defaultTheme: z.enum(["light", "dark"]).optional(),
  }),
});
