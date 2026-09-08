import { Op } from "sequelize";
import { Student, User, StudentDocument, Payment, StudentTimeline, Commission, ActivityLog } from "@/models";
import { ApiError } from "@/utils/apiError";
import type { DocumentType } from "@/models/Document";
import type { ServiceType } from "@/models/Student";
import type { TimelineEvent } from "@/models/StudentTimeline";

interface CreateStudentInput {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName: string;
  course: string;
  semester: string;
  serviceType: ServiceType;
  sellingPrice: number;
}

interface ListStudentsParams {
  page: number;
  pageSize: number;
  search?: string;
  serviceType: ServiceType | "all";
  status: "pending" | "verified" | "completed" | "correction_requested" | "all";
  /** When set, scopes results to this referral partner only (used for "My Students") */
  referralPartnerId?: string;
}

export const studentService = {
  /**
   * V2 UPGRADE: buyingPrice is no longer a flat formula - it's snapshotted from the
   * Referral Partner's own prepaidCost/postpaidCost (set by Super Admin on their profile)
   * at the moment the application is created. sellingPrice comes from the partner's form
   * input. partnerProfit = sellingPrice - buyingPrice, computed once here (not a DB generated
   * column) so historical profit never shifts if the partner's rate changes later.
   */
  create: async (input: CreateStudentInput, referralPartnerId: string, createdBy: string): Promise<Student> => {
    const partner = await User.findByPk(referralPartnerId);
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const buyingPrice = input.serviceType === "prepaid" ? partner.prepaidCost : partner.postpaidCost;
    if (buyingPrice === null || buyingPrice === undefined) {
      throw ApiError.badRequest(
        `Super Admin has not set a ${input.serviceType} price for this partner yet. Please contact your administrator.`
      );
    }

    const partnerProfit = input.sellingPrice - Number(buyingPrice);

    const student = await Student.create({
      fullName: input.fullName,
      mobile: input.mobile,
      gender: input.gender,
      collegeName: input.collegeName,
      universityName: input.universityName,
      course: input.course,
      semester: input.semester,
      serviceType: input.serviceType,
      // DECIMAL columns are typed as `string` on the model - .toFixed(2) also avoids
      // floating-point rounding artifacts on money values (e.g. 0.1 + 0.2 !== 0.3).
      sellingPrice: input.sellingPrice.toFixed(2),
      buyingPrice: Number(buyingPrice).toFixed(2),
      partnerProfit: partnerProfit.toFixed(2),
      referralPartnerId,
    });

    await StudentTimeline.create({
      studentId: student.id,
      event: "application_filled",
      note: "Application submitted by referral partner",
      createdBy,
    });

    return student;
  },

  list: async ({ page, pageSize, search, serviceType, status, referralPartnerId }: ListStudentsParams) => {
    const where: Record<string | symbol, unknown> = {};
    if (referralPartnerId) where.referralPartnerId = referralPartnerId;
    if (serviceType !== "all") where.serviceType = serviceType;
    if (status !== "all") where.status = status;
    if (search) {
      where[Op.or as unknown as string] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } },
        { collegeName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Student.findAndCountAll({
      where,
      include: [{ model: User, as: "referralPartner", attributes: ["id", "fullName", "mobile"] }],
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { items: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
  },

  /** Throws 403 if a referral_admin tries to access a student that isn't theirs. Super Admin bypasses this entirely. */
  assertAccess: (student: Student, requester: { id: string; role: string }): void => {
    if (requester.role === "referral_admin" && student.referralPartnerId !== requester.id) {
      throw ApiError.forbidden("You do not have access to this student's records");
    }
  },

  getById: async (id: string, requester: { id: string; role: string }) => {
    const student = await Student.findByPk(id, {
      include: [
        { model: User, as: "referralPartner", attributes: ["id", "fullName", "mobile", "email"] },
        { model: StudentDocument, as: "documents" },
        { model: Payment, as: "payments", order: [["createdAt", "DESC"]] },
        { model: StudentTimeline, as: "timeline", order: [["createdAt", "ASC"]], include: [{ model: User, as: "actor", attributes: ["id", "fullName"] }] },
        { model: Commission, as: "commission" },
      ],
    });
    if (!student) throw ApiError.notFound("Student not found");

    studentService.assertAccess(student, requester);
    return student;
  },

  update: async (
    id: string,
    updates: Partial<Omit<CreateStudentInput, "serviceType">>,
    requester: { id: string; role: string }
  ): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    // Referral Admins can only edit applications that are still pending (per project rule)
    if (requester.role === "referral_admin" && student.status !== "pending") {
      throw ApiError.forbidden("Only pending applications can be edited");
    }

    // If sellingPrice changes, recompute partnerProfit against the already-snapshotted buyingPrice
    const patch: Record<string, unknown> = { ...updates };
    if (updates.sellingPrice !== undefined && student.buyingPrice !== null) {
      patch.partnerProfit = updates.sellingPrice - Number(student.buyingPrice);
    }

    await student.update(patch);
    return student;
  },

  /** Super Admin verifies an application - creates the commission record using the already-computed partner profit. */
  verify: async (id: string, verifiedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    if (student.status === "verified" || student.status === "completed") {
      throw ApiError.badRequest("This application has already been verified");
    }

    // `amount` = the Referral Partner's profit (sellingPrice - buyingPrice, already computed).
    // `adminAmount` = the Super Admin's own earning = the partner's buyingPrice for this
    // application (what the partner owes the admin for the Hostel Receipt).
    const commissionAmount = Number(student.partnerProfit ?? 0);
    const adminCommissionAmount = Number(student.buyingPrice ?? 0);

    await student.update({ status: "verified", correctionNote: null });
    await StudentTimeline.create({ studentId: id, event: "help_center_verification_completed", createdBy: verifiedBy });
    await Commission.findOrCreate({
      where: { studentId: id },
      defaults: {
        referralPartnerId: student.referralPartnerId,
        studentId: id,
        amount: commissionAmount,
        adminAmount: adminCommissionAmount,
        status: "pending",
      },
    });

    return student;
  },

  /** Super Admin requests a correction - sends the application back to the referral partner. */
  requestCorrection: async (id: string, note: string, requestedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");

    await student.update({ status: "correction_requested", correctionNote: note });
    await StudentTimeline.create({ studentId: id, event: "correction_requested", note, createdBy: requestedBy });

    return student;
  },

  /** Marks the application as fully completed - final stage of the Timeline. */
  markCompleted: async (id: string, completedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    if (student.status !== "verified") throw ApiError.badRequest("Only verified applications can be marked completed");

    await student.update({ status: "completed" });
    await StudentTimeline.create({ studentId: id, event: "case_completed", createdBy: completedBy });

    return student;
  },

  /**
   * V2 NEW: Manually add a scholarship-progress timeline stage - the heart of the new
   * 13-stage tracking system. Anyone with access to the student (owner partner or Super Admin)
   * can log a stage; there is no automation or derived state.
   */
  addTimelineStage: async (
    id: string,
    event: TimelineEvent,
    note: string | undefined,
    requester: { id: string; role: string }
  ): Promise<StudentTimeline> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    return StudentTimeline.create({ studentId: id, event, note: note ?? null, createdBy: requester.id });
  },

  /**
   * V2 NEW: Toggles a student's commission between "pending" and "paid" - Super Admin only
   * (enforced at the route level). Both the partner's `amount` and the admin's own
   * `adminAmount` live on the same Commission row, so a single status update moves both
   * the partner's "My Commission" figures (Partner Profile) and the Super Admin's own
   * "Commission" dashboard cards together - never out of sync.
   */
  updateCommissionStatus: async (id: string, status: "pending" | "paid"): Promise<Commission> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");

    const commission = await Commission.findOne({ where: { studentId: id } });
    if (!commission) throw ApiError.badRequest("Commission has not been generated yet - verify the application first");

    await commission.update({ status, paidAt: status === "paid" ? new Date() : null });
    return commission;
  },

  /**
   * V2 NEW: Fetches activity-log entries relevant to a single student, for the new
   * "Activity Logs" tab in Student Details (distinct from the manual scholarship-progress
   * Timeline tab - this is a system audit trail of actions taken).
   */
  getActivityLogs: async (id: string, requester: { id: string; role: string }) => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    return ActivityLog.findAll({
      where: { details: { studentId: id } },
      include: [{ model: User, as: "user", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
    });
  },

  addDocument: async (
    studentId: string,
    type: DocumentType,
    file: { url: string; fileName: string },
    uploader: { id: string; role: string }
  ): Promise<StudentDocument> => {
    const student = await Student.findByPk(studentId);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, uploader);

    // V2 UPGRADE: Hostel Receipt is NEVER uploaded by a Referral Partner - only Super Admin,
    // after they've physically created the receipt offline (per the new business workflow).
    if (type === "hostel_receipt" && uploader.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can upload the Hostel Receipt");
    }

    // Replace any existing document of the same type (unique constraint on student_id+type)
    const existing = await StudentDocument.findOne({ where: { studentId, type } });
    if (existing) {
      await existing.update({ fileUrl: file.url, fileName: file.fileName, uploadedBy: uploader.id });
      return existing;
    }

    const document = await StudentDocument.create({ studentId, type, fileUrl: file.url, fileName: file.fileName, uploadedBy: uploader.id });
    await StudentTimeline.create({
      studentId,
      event: "receipt_uploaded",
      note: `${type.replace(/_/g, " ")} uploaded`,
      createdBy: uploader.id,
    });

    return document;
  },

  addPayment: async (studentId: string, amount: number, transactionId?: string): Promise<Payment> => {
    const student = await Student.findByPk(studentId);
    if (!student) throw ApiError.notFound("Student not found");

    return Payment.create({ studentId, amount, transactionId: transactionId ?? null, status: "pending" });
  },

  updatePaymentStatus: async (paymentId: string, status: "pending" | "completed" | "failed"): Promise<Payment> => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw ApiError.notFound("Payment not found");

    await payment.update({ status, paidAt: status === "completed" ? new Date() : null });
    return payment;
  },
};
