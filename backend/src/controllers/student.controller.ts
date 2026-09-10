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
    const referralPartnerId = req.user.role === "referral_admin" ? req.user.id : (req.body.referralPartnerId as string);
    if (!referralPartnerId) throw ApiError.badRequest("referralPartnerId is required");

    const student = await studentService.create(req.body, referralPartnerId, req.user.id);
    await activityLogService.logActivity(req, { userId: req.user.id, action: "STUDENT_CREATED", details: { studentId: student.id } });
    ApiResponse.created(res, student, "Student application submitted successfully");
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { page, pageSize, search, serviceType, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      serviceType: "prepaid" | "postpaid" | "all";
      status: "pending" | "completed" | "all";
    };
    const referralPartnerId = req.user.role === "referral_admin" ? req.user.id : undefined;
    const result = await studentService.list({ page, pageSize, search, serviceType, status, referralPartnerId });
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

  getActivityLogs: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const logs = await studentService.getActivityLogs(req.params.id as string, req.user);
    ApiResponse.ok(res, logs, "Student activity logs fetched successfully");
  }),

  addTimelineStage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await studentService.addTimelineStage(req.params.id as string, req.body.event, req.body.note, req.user);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "TIMELINE_STAGE_ADDED",
      details: { studentId: req.params.id, event: req.body.event },
    });
    ApiResponse.created(res, entry, "Timeline stage added successfully");
  }),

  updateTimelineNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await studentService.updateTimelineNote(
      req.params.id as string,
      req.params.timelineId as string,
      req.body.note ?? null,
      req.user
    );
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "TIMELINE_NOTE_UPDATED",
      details: { studentId: req.params.id, timelineId: req.params.timelineId },
    });
    ApiResponse.ok(res, entry, "Timeline note updated successfully");
  }),

  deleteTimelineEntry: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await studentService.deleteTimelineEntry(req.params.id as string, req.params.timelineId as string, req.user);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "TIMELINE_ENTRY_DELETED",
      details: { studentId: req.params.id, timelineId: req.params.timelineId },
    });
    ApiResponse.ok(res, null, "Timeline entry deleted successfully");
  }),

  /** V5 NEW: internal notes */
  addNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await studentService.addNote(req.params.id as string, req.body.note, req.user);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "INTERNAL_NOTE_ADDED",
      details: { studentId: req.params.id, noteId: entry.id },
    });
    ApiResponse.created(res, entry, "Note added successfully");
  }),

  updateNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await studentService.updateNote(
      req.params.id as string,
      req.params.noteId as string,
      req.body.note,
      req.user
    );
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "INTERNAL_NOTE_UPDATED",
      details: { studentId: req.params.id, noteId: entry.id },
    });
    ApiResponse.ok(res, entry, "Note updated successfully");
  }),

  deleteNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await studentService.deleteNote(req.params.id as string, req.params.noteId as string, req.user);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "INTERNAL_NOTE_DELETED",
      details: { studentId: req.params.id, noteId: req.params.noteId },
    });
    ApiResponse.ok(res, null, "Note deleted successfully");
  }),

  uploadDocument: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest("No file uploaded");

    const { url, fileName } = await uploadService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "documents");
    const document = await studentService.addDocument(req.params.id as string, req.body.type, { url, fileName }, req.user);

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

  updateCommissionStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const commission = await studentService.updateCommissionStatus(req.params.id as string, req.body.status);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: req.body.status === "paid" ? "COMMISSION_MARKED_PAID" : "COMMISSION_MARKED_PENDING",
      details: { studentId: req.params.id },
    });
    ApiResponse.ok(res, commission, "Commission status updated successfully");
  }),

  getFieldSuggestions: asyncHandler(async (req: Request, res: Response) => {
    const { field, search } = req.query as { field?: string; search?: string };
    if (!field) throw ApiError.badRequest("field query param is required");
    const suggestions = await studentService.getFieldSuggestions(
      field as "college" | "university" | "course" | "semester",
      search || ""
    );
    ApiResponse.ok(res, suggestions, "Suggestions fetched");
  }),
};