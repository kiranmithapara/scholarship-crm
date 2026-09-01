import type { Response } from "express";

/**
 * ApiResponse - standard success response shape sent from EVERY controller.
 * Matches exactly what the frontend's ApiResponse<T> type expects (see docs/API.md).
 */
export class ApiResponse {
  static send<T>(res: Response, statusCode: number, message: string, data: T): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static ok<T>(res: Response, data: T, message = "Success"): Response {
    return this.send(res, 200, message, data);
  }

  static created<T>(res: Response, data: T, message = "Created successfully"): Response {
    return this.send(res, 201, message, data);
  }

  static noContent(res: Response, message = "Deleted successfully"): Response {
    return res.status(200).json({ success: true, message, data: null });
  }
}
