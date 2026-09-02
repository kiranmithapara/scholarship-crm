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

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  // 1. Brevo API (HTTPS - Port 443, allows sending to ANY recipient email address without domain restriction)
  if (env.brevoApiKey) {
    const senderEmail = env.smtp.fromEmail || "kiranmithapara29@gmail.com";
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: env.smtp.fromName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Brevo API error (${res.status}): ${errText}`);
    }
    logger.info(`Email sent via Brevo API to ${to}`);
    return;
  }

  // 2. Resend API (HTTPS - Port 443)
  if (env.resendApiKey) {
    const fromAddress = env.smtp.fromEmail && !env.smtp.fromEmail.includes("gmail.com")
      ? `${env.smtp.fromName} <${env.smtp.fromEmail}>`
      : `${env.smtp.fromName} <onboarding@resend.dev>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API error (${res.status}): ${errText}`);
    }
    logger.info(`Email sent via Resend API to ${to}`);
    return;
  }

  // 3. Fallback to standard SMTP (local development)
  await mailTransporter.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
    to,
    subject,
    html,
  });
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
      await sendEmail({
        to,
        subject: purpose === "email_verification" ? "Verify your email - Scholarship CRM" : "Reset your password - Scholarship CRM",
        html: wrapTemplate(body),
      });
    } catch (error) {
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
      await sendEmail({
        to,
        subject: `Account ${isActive ? "Activated" : "Blocked"} - Scholarship CRM`,
        html: wrapTemplate(body),
      });
    } catch (error) {
      logger.error(`Failed to send account status email to ${to}:`, error);
    }
  },
};
