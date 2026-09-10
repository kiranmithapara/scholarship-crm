import { Op, QueryTypes } from "sequelize";
import { Student, User, StudentDocument, Payment, StudentTimeline, Commission, ActivityLog, StudentNote } from "@/models";
import { sequelize } from "@/config/database.config";
import { ApiError } from "@/utils/apiError";
import type { DocumentType } from "@/models/Document";
import type { ServiceType } from "@/models/Student";
import type { TimelineEvent } from "@/models/StudentTimeline";

interface CreateStudentInput {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName?: string;
  course?: string;
  semester?: string;
  serviceType: ServiceType;
  sellingPrice?: number | null;
}

interface ListStudentsParams {
  page: number;
  pageSize: number;
  search?: string;
  serviceType: ServiceType | "all";
  status: "pending" | "verified" | "completed" | "correction_requested" | "all";
  referralPartnerId?: string;
}

function toTitleCase(input?: string | null): string {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function toUpperCase(input?: string | null): string {
  if (!input) return "";
  return input.trim().toUpperCase();
}

export const studentService = {
  create: async (input: CreateStudentInput, referralPartnerId: string, createdBy: string): Promise<Student> => {
    const partner = await User.findByPk(referralPartnerId);
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const rawBuyingPrice = input.serviceType === "prepaid" ? partner.prepaidCost : partner.postpaidCost;
    const buyingPrice = rawBuyingPrice != null && rawBuyingPrice !== ""
      ? rawBuyingPrice
      : (input.serviceType === "prepaid" ? "1500.00" : "4500.00");

    const hasSellingPrice = input.sellingPrice != null && !Number.isNaN(Number(input.sellingPrice));
    const partnerProfit = hasSellingPrice ? Number(input.sellingPrice) - Number(buyingPrice) : null;

    const student = await Student.create({
      fullName: toTitleCase(input.fullName),
      mobile: input.mobile,
      gender: input.gender,
      collegeName: toUpperCase(input.collegeName),
      universityName: input.universityName ? toUpperCase(input.universityName) : "",
      course: input.course ? toUpperCase(input.course) : "",
      semester: input.semester ? toTitleCase(input.semester) : "",
      serviceType: input.serviceType,
      sellingPrice: hasSellingPrice ? Number(input.sellingPrice).toFixed(2) : null,
      buyingPrice: Number(buyingPrice).toFixed(2),
      partnerProfit: hasSellingPrice ? Number(partnerProfit).toFixed(2) : null,
      referralPartnerId,
    });

    await StudentTimeline.create({
      studentId: student.id,
      event: "application_filled",
      note: "Application submitted by referral partner",
      createdBy,
    });

    if (input.serviceType === "prepaid") {
      await Commission.create({
        referralPartnerId,
        studentId: student.id,
        amount: hasSellingPrice ? Number(partnerProfit!.toFixed(2)) : 0,
        adminAmount: Number(Number(buyingPrice).toFixed(2)),
        status: "pending",
      });
    }

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

  assertAccess: (student: Student, requester: { id: string; role: string }): void => {
    if (requester.role === "referral_admin" && student.referralPartnerId !== requester.id) {
      throw ApiError.forbidden("You do not have access to this student's records");
    }
  },

  /**
   * V5 UPDATE: Returns student details. Timeline notes and internal notes are hidden from
   * referral_admin. Notes array is only included for Super Admin.
   */
  getById: async (id: string, requester: { id: string; role: string }) => {
    const include: any[] = [
      { model: User, as: "referralPartner", attributes: ["id", "fullName", "mobile", "email"] },
      { model: StudentDocument, as: "documents" },
      { model: Payment, as: "payments", order: [["createdAt", "DESC"]] },
      {
        model: StudentTimeline,
        as: "timeline",
        order: [["createdAt", "ASC"]],
        include: [{ model: User, as: "actor", attributes: ["id", "fullName"] }],
      },
      { model: Commission, as: "commission" },
    ];

    // Only Super Admin sees internal notes
    if (requester.role === "super_admin") {
      include.push({
        model: StudentNote,
        as: "notes",
        order: [["createdAt", "DESC"]],
        include: [{ model: User, as: "author", attributes: ["id", "fullName"] }],
      });
    }

    const student = await Student.findByPk(id, { include });
    if (!student) throw ApiError.notFound("Student not found");

    studentService.assertAccess(student, requester);

    const studentJson: any = student.toJSON();

    // Strip timeline notes for referral_admin
    if (requester.role === "referral_admin" && Array.isArray(studentJson.timeline)) {
      studentJson.timeline = studentJson.timeline.map((t: any) => ({ ...t, note: null }));
    }

    // Notes array should never reach referral_admin
    if (requester.role === "referral_admin") {
      delete studentJson.notes;
    }

    return studentJson;
  },

  update: async (
    id: string,
    updates: Partial<CreateStudentInput> & { buyingPrice?: number },
    requester: { id: string; role: string }
  ): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    if (requester.role === "referral_admin" && student.status !== "pending") {
      throw ApiError.forbidden("Only pending applications can be edited");
    }

    if (updates.buyingPrice !== undefined && requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can change the buying price");
    }

    const normalized: Record<string, unknown> = {};
    if (updates.fullName !== undefined) normalized.fullName = toTitleCase(updates.fullName);
    if (updates.collegeName !== undefined) normalized.collegeName = toUpperCase(updates.collegeName);
    if (updates.universityName !== undefined) normalized.universityName = toUpperCase(updates.universityName);
    if (updates.course !== undefined) normalized.course = toUpperCase(updates.course);
    if (updates.semester !== undefined) normalized.semester = toTitleCase(updates.semester);
    if (updates.sellingPrice !== undefined) normalized.sellingPrice = updates.sellingPrice;
    if (updates.buyingPrice !== undefined) normalized.buyingPrice = Number(updates.buyingPrice).toFixed(2);

    const patch: Record<string, unknown> = { ...normalized };

    const finalBuyingPrice =
      updates.buyingPrice !== undefined
        ? Number(updates.buyingPrice)
        : student.buyingPrice !== null
        ? Number(student.buyingPrice)
        : null;

    const finalSellingPrice =
      updates.sellingPrice !== undefined
        ? updates.sellingPrice != null
          ? Number(updates.sellingPrice)
          : null
        : student.sellingPrice !== null
        ? Number(student.sellingPrice)
        : null;

    if (finalBuyingPrice !== null && finalSellingPrice !== null) {
      patch.partnerProfit = (finalSellingPrice - finalBuyingPrice).toFixed(2);
    } else {
      patch.partnerProfit = null;
    }

    await student.update(patch);

    if (updates.buyingPrice !== undefined || updates.sellingPrice !== undefined) {
      const commission = await Commission.findOne({ where: { studentId: id } });
      if (commission && finalBuyingPrice !== null) {
        const newPartnerAmount = finalSellingPrice !== null ? finalSellingPrice - finalBuyingPrice : 0;
        await commission.update({
          amount: Number(newPartnerAmount.toFixed(2)),
          adminAmount: Number(finalBuyingPrice.toFixed(2)),
        });
      }
    }

    return student;
  },

  verify: async (id: string, verifiedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    if (student.status === "verified" || student.status === "completed") {
      throw ApiError.badRequest("This application has already been verified");
    }

    const buying = Number(student.buyingPrice ?? 0);
    const selling = student.sellingPrice !== null ? Number(student.sellingPrice) : null;
    const partnerProfitAmount = selling !== null ? selling - buying : 0;

    await student.update({ status: "verified", correctionNote: null });
    await StudentTimeline.create({ studentId: id, event: "help_center_verification_completed", createdBy: verifiedBy });

    await Commission.findOrCreate({
      where: { studentId: id },
      defaults: {
        referralPartnerId: student.referralPartnerId,
        studentId: id,
        amount: Number(partnerProfitAmount.toFixed(2)),
        adminAmount: Number(buying.toFixed(2)),
        status: "pending",
      },
    });

    return student;
  },

  requestCorrection: async (id: string, note: string, requestedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");

    await student.update({ status: "correction_requested", correctionNote: note });
    await StudentTimeline.create({ studentId: id, event: "correction_requested", note, createdBy: requestedBy });

    return student;
  },

  markCompleted: async (id: string, completedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    if (student.status !== "verified") throw ApiError.badRequest("Only verified applications can be marked completed");

    await student.update({ status: "completed" });
    await StudentTimeline.create({ studentId: id, event: "case_completed", createdBy: completedBy });

    return student;
  },

  addTimelineStage: async (
    id: string,
    event: TimelineEvent,
    note: string | undefined,
    requester: { id: string; role: string }
  ): Promise<StudentTimeline> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    if (student.serviceType === "prepaid") {
      throw ApiError.forbidden("Scholarship progress is not tracked for prepaid service");
    }
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can update scholarship progress for postpaid service");
    }

    const entry = await StudentTimeline.create({
      studentId: id,
      event,
      note: note ?? null,
      createdBy: requester.id,
    });

    if (event === "help_center_verification_completed") {
      const existingCommission = await Commission.findOne({ where: { studentId: id } });
      if (!existingCommission) {
        const buying = Number(student.buyingPrice ?? 0);
        const selling = student.sellingPrice !== null ? Number(student.sellingPrice) : null;
        const profit = selling !== null ? selling - buying : 0;
        await Commission.create({
          referralPartnerId: student.referralPartnerId,
          studentId: id,
          amount: Number(profit.toFixed(2)),
          adminAmount: Number(buying.toFixed(2)),
          status: "pending",
        });
      }
    }

    if (event === "payment_received") {
      const commission = await Commission.findOne({ where: { studentId: id } });
      if (commission && commission.status !== "paid") {
        await commission.update({ status: "paid", paidAt: new Date() });
      }
      if (student.status !== "completed") {
        await student.update({ status: "completed" });
        await StudentTimeline.create({
          studentId: id,
          event: "case_completed",
          createdBy: requester.id,
        });
      }
    }

    return entry;
  },

  updateTimelineNote: async (
    studentId: string,
    timelineId: string,
    note: string | null,
    requester: { id: string; role: string }
  ): Promise<StudentTimeline> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can edit timeline notes");
    }

    const student = await Student.findByPk(studentId);
    if (!student) throw ApiError.notFound("Student not found");

    const entry = await StudentTimeline.findOne({ where: { id: timelineId, studentId } });
    if (!entry) throw ApiError.notFound("Timeline entry not found");

    await entry.update({ note });
    return entry;
  },

  deleteTimelineEntry: async (
    studentId: string,
    timelineId: string,
    requester: { id: string; role: string }
  ): Promise<void> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can delete timeline entries");
    }

    const student = await Student.findByPk(studentId);
    if (!student) throw ApiError.notFound("Student not found");

    const entry = await StudentTimeline.findOne({ where: { id: timelineId, studentId } });
    if (!entry) throw ApiError.notFound("Timeline entry not found");

    if (entry.event === "application_filled") {
      throw ApiError.badRequest("The initial 'Application Filled' entry cannot be deleted");
    }

    await entry.destroy();
  },

  /**
   * V5 NEW: Add an internal note to a student. Super Admin only.
   */
  addNote: async (
    studentId: string,
    note: string,
    requester: { id: string; role: string }
  ): Promise<StudentNote> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can add internal notes");
    }

    const student = await Student.findByPk(studentId);
    if (!student) throw ApiError.notFound("Student not found");

    return StudentNote.create({
      studentId,
      note: note.trim(),
      createdBy: requester.id,
    });
  },

  /**
   * V5 NEW: Update an existing internal note. Super Admin only.
   */
  updateNote: async (
    studentId: string,
    noteId: string,
    note: string,
    requester: { id: string; role: string }
  ): Promise<StudentNote> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can edit internal notes");
    }

    const entry = await StudentNote.findOne({ where: { id: noteId, studentId } });
    if (!entry) throw ApiError.notFound("Note not found");

    await entry.update({ note: note.trim() });
    return entry;
  },

  /**
   * V5 NEW: Delete an internal note. Super Admin only.
   */
  deleteNote: async (
    studentId: string,
    noteId: string,
    requester: { id: string; role: string }
  ): Promise<void> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can delete internal notes");
    }

    const entry = await StudentNote.findOne({ where: { id: noteId, studentId } });
    if (!entry) throw ApiError.notFound("Note not found");

    await entry.destroy();
  },

  updateCommissionStatus: async (id: string, status: "pending" | "paid"): Promise<Commission> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");

    const commission = await Commission.findOne({ where: { studentId: id } });
    if (!commission) throw ApiError.badRequest("Commission has not been generated yet - verify the application first");

    await commission.update({ status, paidAt: status === "paid" ? new Date() : null });

    if (status === "paid" && student.status !== "completed") {
      await student.update({ status: "completed" });
      await StudentTimeline.create({
        studentId: student.id,
        event: "case_completed",
        createdBy: student.referralPartnerId,
      });
    }

    return commission;
  },

  getActivityLogs: async (id: string, requester: { id: string; role: string }) => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    return ActivityLog.findAll({
      where: { details: { [Op.contains]: { studentId: id } } } as any,
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

    if (type === "hostel_receipt" && uploader.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can upload the Hostel Receipt");
    }

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

  getFieldSuggestions: async (
    field: "college" | "university" | "course" | "semester",
    search: string
  ): Promise<string[]> => {
    const columnMap: Record<string, string> = {
      college: "college_name",
      university: "university_name",
      course: "course",
      semester: "semester",
    };

    const dbColumn = columnMap[field];
    if (!dbColumn) throw ApiError.badRequest("Invalid suggestion field");

    const trimmed = (search || "").trim();
    const hasSearch = trimmed.length > 0;

    const sql = hasSearch
      ? `SELECT DISTINCT "${dbColumn}" AS value FROM students WHERE "${dbColumn}" ILIKE :search AND "${dbColumn}" IS NOT NULL LIMIT 300`
      : `SELECT DISTINCT "${dbColumn}" AS value FROM students WHERE "${dbColumn}" IS NOT NULL LIMIT 300`;

    const rows = await sequelize.query(sql, {
      replacements: hasSearch ? { search: `%${trimmed}%` } : {},
      type: QueryTypes.SELECT,
    });

    const seen = new Set<string>();
    const result: string[] = [];
    const upperFields = ["college", "university", "course"];

    for (const r of rows as any[]) {
      const v = String(r.value ?? "").trim();
      if (!v) continue;

      const key = v.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const normalized = upperFields.includes(field) ? toUpperCase(v) : toTitleCase(v);
      result.push(normalized);
      if (result.length >= 10) break;
    }

    return result;
  },
};