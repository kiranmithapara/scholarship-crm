export const ROUTES = {
  // Public / Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_OTP: "/verify-otp",

  // Shared
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",

  // Super Admin only
  REFERRAL_PARTNERS: "/referral-partners",
  REFERRAL_PARTNER_DETAILS: "/referral-partners/:id",
  SETTINGS: "/settings",
  LOGIN_LOGS: "/logs/login",
  ACTIVITY_LOGS: "/logs/activity",
  ADMIN_NOTES: "/my-notes",

  // Shared with role-based scoping
  STUDENTS: "/students",
  STUDENT_DETAILS: "/students/:id",

  // Referral Admin only
  APPLY_SCHOLARSHIP: "/applications/apply",
  MY_STUDENTS: "/my-students",

  // Fallback
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
} as const;

export function buildPath(path: string, params: Record<string, string | number>): string {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
}