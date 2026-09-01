import { Router } from "express";
import { authController } from "@/controllers/auth.controller";
import { validate } from "@/middlewares/validate.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { authRateLimiter } from "@/middlewares/rateLimiter.middleware";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "@/validators/auth.validator";

const router = Router();

// ---------- Public routes (strict rate limit - highest brute-force risk) ----------
router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/verify-otp", authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", authRateLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);

// ---------- Protected routes (login required) ----------
router.get("/me", authMiddleware, authController.getMe);
router.post("/change-password", authMiddleware, validate(changePasswordSchema), authController.changePassword);
router.post("/logout", authMiddleware, authController.logout);

export default router;
