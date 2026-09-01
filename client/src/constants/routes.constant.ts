/**
 * Central route path registry.
 * Kabhi bhi hardcoded "/students" jaisi strings mat likho pages/links me -
 * hamesha ROUTES.STUDENTS use karo. Isse ek jagah se sab routes rename ho sakte hain.
 */
export const ROUTES = {
  // Public / Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_OTP: "/verify-otp",

  // Shared (both roles)
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",

  // Super Admin only
  REFERRAL_PARTNERS: "/referral-partners",
  REFERRAL_PARTNER_DETAILS: "/referral-partners/:id",
  SETTINGS: "/settings",
  LOGIN_LOGS: "/logs/login",
  ACTIVITY_LOGS: "/logs/activity",

  // Shared but scoped differently per role (students of all vs students of self)
  STUDENTS: "/students",
  STUDENT_DETAILS: "/students/:id",

  // Referral Admin only
  APPLY_SCHOLARSHIP: "/applications/apply",
  MY_STUDENTS: "/my-students",

  // Fallback
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
} as const;

/** Helper - "/students/:id" + "42" -> "/students/42" */
export function buildPath(path: string, params: Record<string, string | number>): string {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
}
