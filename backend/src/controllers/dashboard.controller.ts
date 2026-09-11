import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { dashboardService } from "@/services/dashboard.service";

export const dashboardController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const stats = await dashboardService.getStats(req.user);
    ApiResponse.ok(res, stats, "Dashboard stats fetched successfully");
  }),

  getSuperAdminStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getStats({ id: "", role: "super_admin" });
    ApiResponse.ok(res, stats, "Dashboard stats fetched successfully");
  }),

  // V9 NEW: partner-wise receipt summary with filters
  getPartnerReceipts: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const isSuperAdmin = req.user.role === "super_admin";
    let { period = "all", partnerId } = req.query as { period?: string; partnerId?: string };

    // If referral partner, force their own partnerId
    if (!isSuperAdmin) {
      partnerId = req.user.id;
    }

    const result = await dashboardService.getPartnerReceipts({ period, partnerId });
    ApiResponse.ok(res, result, "Partner receipts fetched successfully");
  }),
};