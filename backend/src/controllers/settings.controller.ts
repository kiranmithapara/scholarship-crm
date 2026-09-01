import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { settingsService } from "@/services/settings.service";
import { uploadService } from "@/services/upload.service";
import { activityLogService } from "@/services/activityLog.service";

export const settingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.get();
    // Never send the encrypted SMTP password blob to the client, even to Super Admin
    const { smtpPasswordEncrypted: _omit, ...safe } = settings.toJSON();
    ApiResponse.ok(res, safe, "Settings fetched successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const settings = await settingsService.update(req.body);

    await activityLogService.logActivity(req, { userId: req.user.id, action: "SETTINGS_UPDATED" });

    const { smtpPasswordEncrypted: _omit, ...safe } = settings.toJSON();
    ApiResponse.ok(res, safe, "Settings updated successfully");
  }),

  uploadLogo: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest("No file uploaded");

    const { url } = await uploadService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "logos");
    const settings = await settingsService.update({ logoUrl: url });

    await activityLogService.logActivity(req, { userId: req.user.id, action: "LOGO_UPDATED" });

    const { smtpPasswordEncrypted: _omit, ...safe } = settings.toJSON();
    ApiResponse.ok(res, safe, "Logo updated successfully");
  }),
};
