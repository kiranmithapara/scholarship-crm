import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { authService } from "@/services/auth.service";
import { activityLogService } from "@/services/activityLog.service";

/**
 * Auth Controller - thin layer: parses req, calls authService, formats res.
 * All business logic lives in auth.service.ts; this file only orchestrates
 * the HTTP concerns (status codes, cookies, logging side-effects).
 */
export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    ApiResponse.created(res, result, "Registration successful. Please verify your email with the OTP sent.");
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const { user, accessToken, refreshToken } = await authService.verifyOtp(email, otp);

    await activityLogService.logActivity(req, { userId: user.id, action: "EMAIL_VERIFIED" });

    ApiResponse.ok(res, { user: user.toSafeJSON(), accessToken, refreshToken }, "Email verified successfully");
  }),

  resendOtp: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendOtp(req.body.email);
    ApiResponse.ok(res, null, "A new OTP has been sent to your email");
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body;

    try {
      const { user, accessToken, refreshToken } = await authService.login(email, password, rememberMe);

      await activityLogService.logLoginAttempt(req, { userId: user.id, emailAttempted: email, status: "success" });
      await activityLogService.logActivity(req, { userId: user.id, action: "LOGIN" });

      ApiResponse.ok(res, { user: user.toSafeJSON(), accessToken, refreshToken }, "Login successful");
    } catch (error) {
      // Failed attempts are logged too - this is what powers the Login Logs page's "failed" rows
      const reason = error instanceof ApiError ? error.message : "Unknown error";
      await activityLogService.logLoginAttempt(req, { userId: null, emailAttempted: email, status: "failed", failureReason: reason });
      throw error;
    }
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    // Deliberately generic message - never reveal whether the email exists (prevents enumeration)
    ApiResponse.ok(res, null, "If an account exists with this email, a password reset OTP has been sent.");
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    ApiResponse.ok(res, null, "Password has been reset successfully. Please log in with your new password.");
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const { accessToken } = await authService.refreshAccessToken(req.body.refreshToken);
    ApiResponse.ok(res, { accessToken }, "Token refreshed");
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.getById(req.user.id);
    ApiResponse.ok(res, user.toSafeJSON(), "Current user fetched");
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "PASSWORD_CHANGED" });
    ApiResponse.ok(res, null, "Password changed successfully");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await activityLogService.logActivity(req, { userId: req.user.id, action: "LOGOUT" });
    }
    // JWT is stateless - logout is handled client-side by discarding tokens.
    // We still expose this endpoint so the client always has a consistent server call to make,
    // and so the action is captured in the activity log.
    ApiResponse.ok(res, null, "Logged out successfully");
  }),
};
