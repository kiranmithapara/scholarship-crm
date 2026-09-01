import { mailTransporter } from "@/config/nodemailer.config";
import { env } from "@/config/env.config";
import { logger } from "@/config/logger.config";

/**
 * Mail service - all outgoing emails go through here.
 * HTML templates are kept simple/inline (no external template engine) since we only
 * have 2-3 email types - keeps the module dependency-free and easy to audit.
 */
const brandHeader = `
  <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-family:Arial,sans-serif;font-size:20px;">Scholarship CRM</h1>
  </div>
`;

function wrapTemplate(bodyHtml: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      ${brandHeader}
      <div style="padding:32px 24px;color:#1f2937;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;">
        This is an automated email from Scholarship CRM. Please do not reply.
      </div>
    </div>
  `;
}

export const mailService = {
  /** Sends the OTP for email verification (registration flow) or forgot-password flow. */
  sendOtpEmail: async (to: string, otp: string, purpose: "email_verification" | "forgot_password"): Promise<void> => {
    const heading = purpose === "email_verification" ? "Verify your email" : "Reset your password";
    const body = `
      <p style="font-size:15px;">${heading} using the OTP below. This code expires in ${env.otp.expiryMinutes} minutes.</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-size:28px;font-weight:700;letter-spacing:6px;padding:16px 28px;border-radius:10px;">${otp}</span>
      </div>
      <p style="font-size:13px;color:#6b7280;">If you did not request this, you can safely ignore this email.</p>
    `;

    try {
      await mailTransporter.sendMail({
        from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
        to,
        subject: purpose === "email_verification" ? "Verify your email - Scholarship CRM" : "Reset your password - Scholarship CRM",
        html: wrapTemplate(body),
      });
    } catch (error) {
      // Email failure should not crash the request - it's logged, and the OTP still exists in DB
      // so the user can request a resend. Never let a mail server outage break registration.
      logger.error(`Failed to send OTP email to ${to}:`, error);
    }
  },

  /** Notifies a user their account status changed (blocked/activated by Super Admin). */
  sendAccountStatusEmail: async (to: string, isActive: boolean): Promise<void> => {
    const body = `
      <p style="font-size:15px;">
        Your Scholarship CRM account has been <strong>${isActive ? "activated" : "blocked"}</strong> by an administrator.
      </p>
      ${!isActive ? '<p style="font-size:13px;color:#6b7280;">If you believe this is a mistake, please contact your administrator.</p>' : ""}
    `;
    try {
      await mailTransporter.sendMail({
        from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
        to,
        subject: `Account ${isActive ? "Activated" : "Blocked"} - Scholarship CRM`,
        html: wrapTemplate(body),
      });
    } catch (error) {
      logger.error(`Failed to send account status email to ${to}:`, error);
    }
  },
};
