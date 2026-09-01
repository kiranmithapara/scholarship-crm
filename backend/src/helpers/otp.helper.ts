import crypto from "crypto";
import { env } from "@/config/env.config";

/** Generates a numeric OTP of configured length (default 6 digits) using a CSPRNG - not Math.random(). */
export function generateOtp(): string {
  const length = env.otp.length;
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/** Returns the expiry Date for a freshly generated OTP. */
export function getOtpExpiry(): Date {
  return new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);
}
