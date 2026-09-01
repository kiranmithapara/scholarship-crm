import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env.config";
import { logger } from "./logger.config";

/**
 * Nodemailer transporter - single reusable instance for all outgoing mail
 * (OTP verification, forgot password, notifications).
 */
export const mailTransporter: Transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
  // Fail fast rather than hanging indefinitely if the SMTP server is unreachable
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/** Verifies SMTP credentials are correct - called once on server boot, non-fatal if it fails */
export async function verifyMailTransporter(): Promise<void> {
  try {
    await mailTransporter.verify();
    logger.info("SMTP transporter is ready to send emails.");
  } catch (error) {
    logger.warn("SMTP transporter verification failed - emails will not be sent.", error);
  }
}
