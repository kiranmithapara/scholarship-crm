import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/apiError";
import { verifyAccessToken } from "@/helpers/jwt.helper";

/**
 * authMiddleware - verifies the JWT access token from the Authorization header.
 * On success, attaches decoded payload to req.user for downstream controllers/middlewares.
 * Must run BEFORE roleMiddleware on any protected route.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Access token is missing");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token as string);
    req.user = decoded;
    next();
  } catch {
    throw ApiError.unauthorized("Access token is invalid or has expired");
  }
}
