import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/apiError";
import { verifyAccessToken } from "@/helpers/jwt.helper";
import { User } from "@/models";

/**
 * authMiddleware - verifies the JWT access token from the Authorization header,
 * and verifies that the user still exists and is ACTIVE in the database.
 * If a partner/user is blocked by Super Admin, their request is immediately rejected.
 * Must run BEFORE roleMiddleware on any protected route.
 */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Access token is missing"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token as string);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "fullName", "email", "role", "isActive", "deletedAt"],
    });

    if (!user || user.deletedAt) {
      return next(ApiError.unauthorized("User account no longer exists"));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden("Your account has been deactivated or blocked by administrator. Please contact support."));
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(ApiError.unauthorized("Access token is invalid or has expired"));
  }
}
