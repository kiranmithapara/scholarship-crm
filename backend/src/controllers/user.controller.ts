import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { userService } from "@/services/user.service";
import { uploadService } from "@/services/upload.service";
import { activityLogService } from "@/services/activityLog.service";

export const userController = {
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.updateProfile(req.user.id, req.body);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "PROFILE_UPDATED" });
    ApiResponse.ok(res, user.toSafeJSON(), "Profile updated successfully");
  }),

  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest("No file uploaded");

    const { url } = await uploadService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "avatars");
    const user = await userService.updatePhoto(req.user.id, url);

    ApiResponse.ok(res, user.toSafeJSON(), "Profile photo updated successfully");
  }),
};
