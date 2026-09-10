import { z } from "zod";

export const createAdminNoteSchema = z.object({
  body: z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000),
    title: z.string().trim().max(200).optional().nullable(),
  }),
});

export const updateAdminNoteSchema = z.object({
  params: z.object({ noteId: z.string().uuid("Invalid note id") }),
  body: z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000),
    title: z.string().trim().max(200).optional().nullable(),
  }),
});

export const adminNoteParamSchema = z.object({
  params: z.object({ noteId: z.string().uuid("Invalid note id") }),
});