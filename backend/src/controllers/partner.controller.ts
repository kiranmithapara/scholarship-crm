import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { partnerService } from "@/services/partner.service";
import { uploadService } from "@/services/upload.service";
import { activityLogService } from "@/services/activityLog.service";

export const partnerController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    let photoUrl: string | undefined;

    if (req.file) {
      const uploadRes = await uploadService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "avatars"
      );
      photoUrl = uploadRes.url;
    }

    const partner = await partnerService.create({
      ...req.body,
      photoUrl: photoUrl ?? req.body.photoUrl,
    });

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_CREATED",
      details: { partnerId: partner.id, partnerEmail: partner.email },
    });

    ApiResponse.created(res, partner.toSafeJSON(), "Referral partner created successfully");
  }),
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, search, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      status: "active" | "blocked" | "all";
    };
    const result = await partnerService.list({ page, pageSize, search, status });
    ApiResponse.ok(res, result, "Referral partners fetched successfully");
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await partnerService.getProfile(req.params.id as string);
    ApiResponse.ok(res, profile, "Partner profile fetched successfully");
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;
    const { isActive } = req.body;

    const partner = await partnerService.updateStatus(id as string, isActive);

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: isActive ? "PARTNER_ACTIVATED" : "PARTNER_BLOCKED",
      details: { partnerId: id, partnerEmail: partner.email },
    });

    ApiResponse.ok(res, partner.toSafeJSON(), `Partner ${isActive ? "activated" : "blocked"} successfully`);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;
    let photoUrl = req.body.photoUrl;

    if (req.file) {
      const uploadRes = await uploadService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "avatars"
      );
      photoUrl = uploadRes.url;
    }

    const partner = await partnerService.update(id as string, {
      ...req.body,
      ...(photoUrl !== undefined ? { photoUrl } : {}),
    });

    await activityLogService.logActivity(req, { userId: req.user.id, action: "PARTNER_UPDATED", details: { partnerId: id } });

    ApiResponse.ok(res, partner.toSafeJSON(), "Partner updated successfully");
  }),

  updatePricing: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;
    const { prepaidCost, postpaidCost } = req.body;

    const partner = await partnerService.updatePricing(id as string, prepaidCost, postpaidCost);

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_PRICING_UPDATED",
      details: { partnerId: id, prepaidCost, postpaidCost },
    });

    ApiResponse.ok(res, partner.toSafeJSON(), "Partner pricing updated successfully");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;

    const partner = await partnerService.delete(id as string);

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_DELETED",
      details: { partnerId: id, partnerEmail: partner.email, partnerName: partner.fullName },
    });

    ApiResponse.ok(res, null, "Referral partner deleted successfully");
  }),

  /** V3 NEW: lists this partner's commissions (one per verified student) with student names attached. */
  getCommissions: asyncHandler(async (req: Request, res: Response) => {
    const commissions = await partnerService.getCommissions(req.params.id as string);
    ApiResponse.ok(res, commissions, "Commissions fetched successfully");
  }),

  /** V3 NEW: marks a commission paid/pending - fixes the previously-missing "mark as paid" action. */
  updateCommissionStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { commissionId } = req.params;
    const { status } = req.body;

    const commission = await partnerService.updateCommissionStatus(commissionId as string, status);

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: status === "paid" ? "COMMISSION_MARKED_PAID" : "COMMISSION_MARKED_PENDING",
      details: { commissionId, partnerId: req.params.id, studentId: commission.studentId, amount: commission.amount },
    });

    ApiResponse.ok(res, commission, `Commission marked as ${status} successfully`);
  }),

    /** V4 NEW: Mark all pending commissions as paid for this partner. */
  markAllCommissionsPaid: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;

    const result = await partnerService.markAllCommissionsPaid(id as string);

    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "ALL_COMMISSIONS_MARKED_PAID",
      details: { partnerId: id, count: result.count },
    });

    ApiResponse.ok(res, result, `Marked ${result.count} commission(s) as paid`);
  }),
    /** V6 NEW: Add a partner note (Super Admin only) */
  addNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await partnerService.addPartnerNote(req.params.id as string, req.body.note, req.user);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_NOTE_ADDED",
      details: { partnerId: req.params.id, noteId: entry.id },
    });
    ApiResponse.created(res, entry, "Note added successfully");
  }),

  /** V6 NEW: Update a partner note */
  updateNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await partnerService.updatePartnerNote(
      req.params.id as string,
      req.params.noteId as string,
      req.body.note,
      req.user
    );
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_NOTE_UPDATED",
      details: { partnerId: req.params.id, noteId: entry.id },
    });
    ApiResponse.ok(res, entry, "Note updated successfully");
  }),

  /** V6 NEW: Delete a partner note */
  deleteNote: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await partnerService.deletePartnerNote(req.params.id as string, req.params.noteId as string, req.user);
    await activityLogService.logActivity(req, {
      userId: req.user.id,
      action: "PARTNER_NOTE_DELETED",
      details: { partnerId: req.params.id, noteId: req.params.noteId },
    });
    ApiResponse.ok(res, null, "Note deleted successfully");
  }),
};
