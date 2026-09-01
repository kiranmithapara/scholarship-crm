/**
 * User roles - system me sirf ye 2 roles hain, aur koi nahi.
 * Backend ke enum se exactly match karta hai - kabhi bhi ye string values
 * backend ke Role enum se mismatch nahi honi chahiye.
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  REFERRAL_ADMIN: "referral_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
