import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { partnerService } from "@/services/partner.service";
import { uploadService } from "@/services/upload.service";
import { activityLogService } from "@/services/activityLog.service";

export const partnerController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    let photoUrl: string | undefined;

    if (req.file) {
      const uploadRes = await uploadService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "avatars"
      );
      photoUrl = uploadRes.url;
    }

    const partner = await partnerService.create({
      ...req.body,
      photoUrl: photoUrl ?? req.body.photoUrl,
    });

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_CREATED",
      details: { partnerId: partner.id, partnerEmail: partner.email },
    });

    ApiResponse.created(res, partner.toSafeJSON(), "Referral partner created successfully");
  }),
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, search, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      status: "active" | "blocked" | "all";
    };
    const result = await partnerService.list({ page, pageSize, search, status });
    ApiResponse.ok(res, result, "Referral partners fetched successfully");
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await partnerService.getProfile(req.params.id as string);
    ApiResponse.ok(res, profile, "Partner profile fetched successfully");
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;
    const { isActive } = req.body;

    const partner = await partnerService.updateStatus(id as string, isActive);

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: isActive ? "PARTNER_ACTIVATED" : "PARTNER_BLOCKED",
      details: { partnerId: id, partnerEmail: partner.email },
    });

    ApiResponse.ok(res, partner.toSafeJSON(), `Partner ${isActive ? "activated" : "blocked"} successfully`);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;

    const partner = await partnerService.update(id as string, req.body);

    await activityLogService.logActivity(req, { userId: req.user.id, action: "PARTNER_UPDATED", details: { partnerId: id } });

    ApiResponse.ok(res, partner.toSafeJSON(), "Partner updated successfully");
  }),
};
