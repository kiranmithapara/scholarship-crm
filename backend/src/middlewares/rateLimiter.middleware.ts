import rateLimit from "express-rate-limit";
import { env } from "@/config/env.config";

/**
 * General API rate limiter - applied globally in app.ts.
 * Prevents basic abuse/DoS on all routes.
 */
export const generalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment, // Disabled in local development mode for seamless testing
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

/**
 * Strict rate limiter for auth routes (login, register, OTP, forgot-password).
 * These are the highest-value brute-force targets, so they get a much tighter limit.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count towards the limit
  skip: () => env.isDevelopment, // Disabled in local development mode for seamless testing
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});
