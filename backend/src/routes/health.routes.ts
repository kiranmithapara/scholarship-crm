import { Router } from "express";
import { ApiResponse } from "@/utils/apiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { sequelize } from "@/config/database.config";

const router = Router();

/**
 * GET /api/v1/health
 * Used by Render/uptime monitors to check if the service (and its DB connection) is alive.
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    let dbStatus: "connected" | "disconnected" = "disconnected";
    try {
      await sequelize.authenticate();
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }

    ApiResponse.ok(res, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV,
    });
  })
);

export default router;
