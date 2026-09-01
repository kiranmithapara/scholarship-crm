import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/apiError";
import { logger } from "@/config/logger.config";
import { env } from "@/config/env.config";
import { ValidationError as SequelizeValidationError, UniqueConstraintError } from "sequelize";

/**
 * Global Error Handler - the LAST middleware in the chain (see app.ts).
 * Every thrown error in the app (controllers, services, middlewares) ends up here
 * via asyncHandler() or Express's own error propagation.
 *
 * Converts ANY error into the standard { success: false, message, errors? } shape,
 * never leaks stack traces or internal details to the client in production.
 */
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: Record<string, string[]> | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof UniqueConstraintError) {
    // Postgres unique constraint violation (duplicate email/username/mobile etc.)
    statusCode = 409;
    message = "A record with this value already exists";
    errors = err.errors.reduce<Record<string, string[]>>((acc, e) => {
      acc[e.path ?? "field"] = [e.message];
      return acc;
    }, {});
  } else if (err instanceof SequelizeValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.errors.reduce<Record<string, string[]>>((acc, e) => {
      acc[e.path ?? "field"] = [e.message];
      return acc;
    }, {});
  } else if (err instanceof Error) {
    message = env.isDevelopment ? err.message : message;
  }

  // Log every 5xx as an error (needs investigation), 4xx as a warning (expected client mistake)
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${message}`, { stack: err instanceof Error ? err.stack : err });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Stack trace ONLY in development - never leak internals in production
    ...(env.isDevelopment && err instanceof Error && { stack: err.stack }),
  });
}

/** 404 handler - for routes that don't match anything, placed just before errorMiddleware */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
