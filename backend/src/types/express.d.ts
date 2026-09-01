import "express";

/**
 * Extends Express's Request type with `user` - populated by auth.middleware.ts
 * after verifying the JWT. This gives full type-safety in every controller:
 * req.user.id, req.user.role etc. without casting.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "super_admin" | "referral_admin";
        email: string;
      };
    }
  }
}

export {};
