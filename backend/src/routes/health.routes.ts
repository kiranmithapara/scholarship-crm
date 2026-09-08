import { Router } from "express";
import { ApiResponse } from "@/utils/apiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { sequelize } from "@/config/database.config";

const router = Router();

/**
 * GET /api/v1/health
 * Used by Render/uptime monitors to check if the service (and its DB connection) is alive.
 *
 * SECURITY FIX: previously this router also exposed GET /health/mail-provider, a public
 * unauthenticated endpoint that leaked partial API key prefixes (e.g. Brevo/SendGrid keys)
 * for any configured email provider. Anyone who found the URL could confirm which providers
 * were wired up and see the first few characters of live secrets. Removed entirely - this
 * kind of debug info should never be reachable without auth, and isn't needed in production.
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
