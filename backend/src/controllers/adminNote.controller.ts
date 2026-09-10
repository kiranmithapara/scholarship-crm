import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { adminNoteService } from "@/services/adminNote.service";
import { activityLogService } from "@/services/activityLog.service";

export const adminNoteController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const notes = await adminNoteService.list(req.user.id);
    ApiResponse.ok(res, notes, "Notes fetched successfully");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { note, title } = req.body;
    const entry = await adminNoteService.create(req.user.id, note, title);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "ADMIN_NOTE_CREATED",
      details: { noteId: entry.id },
    });
    ApiResponse.created(res, entry, "Note created successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { note, title } = req.body;
    const entry = await adminNoteService.update(req.params.noteId as string, req.user.id, note, title);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "ADMIN_NOTE_UPDATED",
      details: { noteId: entry.id },
    });
    ApiResponse.ok(res, entry, "Note updated successfully");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await adminNoteService.delete(req.params.noteId as string, req.user.id);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "ADMIN_NOTE_DELETED",
      details: { noteId: req.params.noteId },
    });
    ApiResponse.ok(res, null, "Note deleted successfully");
  }),
};