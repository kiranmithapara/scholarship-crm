import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/apiError";

/**
 * roleMiddleware - restricts a route to specific roles.
 * Must be used AFTER authMiddleware (req.user must already be populated).
 *
 * Usage: router.get("/settings", authMiddleware, roleMiddleware("super_admin"), controller.get);
 */
export function roleMiddleware(...allowedRoles: Array<"super_admin" | "referral_admin">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required before role check");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden("You do not have permission to access this resource");
    }

    next();
  };
}
