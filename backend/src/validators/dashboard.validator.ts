import { z } from "zod";

export const partnerReceiptsFilterSchema = z.object({
  query: z.object({
    period: z.enum(["7d", "30d", "90d", "all"]).optional().default("all"),
    partnerId: z.string().optional(),
  }),
});