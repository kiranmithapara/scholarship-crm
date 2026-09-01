import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { logsService } from "@/services/logs.service";

export const logsController = {
  listLoginLogs: asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, search } = req.query as unknown as { page: number; pageSize: number; search?: string };
    const result = await logsService.listLoginLogs({ page, pageSize, search });
    ApiResponse.ok(res, result, "Login logs fetched successfully");
  }),

  listActivityLogs: asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, search } = req.query as unknown as { page: number; pageSize: number; search?: string };
    const result = await logsService.listActivityLogs({ page, pageSize, search });
    ApiResponse.ok(res, result, "Activity logs fetched successfully");
  }),
};
