import type { Request } from "express";
import { ActivityLog, LoginLog } from "@/models";
import { getClientIp, parseUserAgent } from "@/helpers/requestMeta.helper";
import { logger } from "@/config/logger.config";

/**
 * Activity + Login logging service.
 * Logging failures NEVER throw - a broken audit log should never block the actual
 * user-facing action (login, student creation, etc.) from succeeding.
 */
export const activityLogService = {
  /** Records a login attempt (success or failure) - powers the Login Logs page. */
  logLoginAttempt: async (
    req: Request,
    params: { userId: string | null; emailAttempted: string; status: "success" | "failed"; failureReason?: string }
  ): Promise<void> => {
    try {
      const { browser, device } = parseUserAgent(req);
      await LoginLog.create({
        userId: params.userId,
        emailAttempted: params.emailAttempted,
        ipAddress: getClientIp(req),
        browser,
        device,
        status: params.status,
        failureReason: params.failureReason ?? null,
      });
    } catch (error) {
      logger.error("Failed to write login log:", error);
    }
  },

  /** Records a general user action - powers the Activity Logs page. */
  logActivity: async (
    req: Request,
    params: { userId: string; action: string; details?: Record<string, unknown> }
  ): Promise<void> => {
    try {
      await ActivityLog.create({
        userId: params.userId,
        action: params.action,
        details: params.details ?? null,
        ipAddress: getClientIp(req),
      });
    } catch (error) {
      logger.error("Failed to write activity log:", error);
    }
  },
};
