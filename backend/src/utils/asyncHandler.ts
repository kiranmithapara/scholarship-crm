import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * asyncHandler - wraps async controller functions so any thrown error/rejected promise
 * is automatically forwarded to next(), instead of every controller needing its own try/catch.
 *
 * Usage: router.get("/students", asyncHandler(studentController.list));
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
