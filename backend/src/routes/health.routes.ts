import { Router } from "express";
import { ApiResponse } from "@/utils/apiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { sequelize } from "@/config/database.config";
import { env } from "@/config/env.config";

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

router.get(
  "/mail-provider",
  asyncHandler(async (_req, res) => {
    ApiResponse.ok(res, {
      hasBrevoKey: Boolean(env.brevoApiKey && env.brevoApiKey.length > 5),
      brevoKeyPrefix: env.brevoApiKey ? `${env.brevoApiKey.slice(0, 10)}...` : null,
      hasResendKey: Boolean(env.resendApiKey && env.resendApiKey.length > 5),
      smtpFromEmail: env.smtp.fromEmail,
      smtpFromName: env.smtp.fromName,
    });
  })
);

export default router;
