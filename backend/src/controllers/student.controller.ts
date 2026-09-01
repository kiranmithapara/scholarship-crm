import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { studentService } from "@/services/student.service";
import { uploadService } from "@/services/upload.service";
import { activityLogService } from "@/services/activityLog.service";

export const studentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    // Referral Admins create students for themselves; Super Admin creating on behalf of a partner
    // would pass referralPartnerId explicitly (not covered by public schema - kept simple by design).
    const referralPartnerId = req.user.role === "referral_admin" ? req.user.id : (req.body.referralPartnerId as string);
    if (!referralPartnerId) throw ApiError.badRequest("referralPartnerId is required");

    const student = await studentService.create(req.body, referralPartnerId, req.user.id);

    await activityLogService.logActivity(req, { userId: req.user.id, action: "STUDENT_CREATED", details: { studentId: student.id } });

    ApiResponse.created(res, student, "Student application submitted successfully");
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { page, pageSize, search, plan, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      plan: "2500" | "5000" | "all";
      status: "pending" | "verified" | "completed" | "correction_requested" | "all";
    };

    // Referral Admins ALWAYS get scoped results - this is the core "My Students" enforcement point
    const referralPartnerId = req.user.role === "referral_admin" ? req.user.id : undefined;

    const result = await studentService.list({ page, pageSize, search, plan, status, referralPartnerId });
    ApiResponse.ok(res, result, "Students fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const student = await studentService.getById(req.params.id as string, req.user);
    ApiResponse.ok(res, student, "Student fetched successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const student = await studentService.update(req.params.id as string, req.body, req.user);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "STUDENT_UPDATED", details: { studentId: student.id } });
    ApiResponse.ok(res, student, "Student updated successfully");
  }),

  verify: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const student = await studentService.verify(req.params.id as string, req.user.id);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "APPLICATION_VERIFIED", details: { studentId: student.id } });
    ApiResponse.ok(res, student, "Application verified successfully");
  }),

  requestCorrection: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const student = await studentService.requestCorrection(req.params.id as string, req.body.note, req.user.id);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "CORRECTION_REQUESTED", details: { studentId: student.id } });
    ApiResponse.ok(res, student, "Correction requested successfully");
  }),

  markCompleted: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const student = await studentService.markCompleted(req.params.id as string, req.user.id);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "APPLICATION_COMPLETED", details: { studentId: student.id } });
    ApiResponse.ok(res, student, "Application marked as completed");
  }),

  updateScholarship: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const student = await studentService.updateScholarship(req.params.id as string, req.body, req.user);
    ApiResponse.ok(res, student, "Scholarship details updated successfully");
  }),

  uploadDocument: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest("No file uploaded");

    const { url, fileName } = await uploadService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "documents");
    const document = await studentService.addDocument(req.params.id as string, req.body.type, { url, fileName }, req.user.id);

    ApiResponse.created(res, document, "Document uploaded successfully");
  }),

  addPayment: asyncHandler(async (req: Request, res: Response) => {
    const { amount, transactionId } = req.body;
    const payment = await studentService.addPayment(req.params.id as string, amount, transactionId);
    ApiResponse.created(res, payment, "Payment record created successfully");
  }),

  updatePaymentStatus: asyncHandler(async (req: Request, res: Response) => {
    const payment = await studentService.updatePaymentStatus(req.params.paymentId as string, req.body.status);
    ApiResponse.ok(res, payment, "Payment status updated successfully");
  }),
};
