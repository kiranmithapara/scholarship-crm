import { Op } from "sequelize";
import { Student, User, StudentDocument, Payment, StudentTimeline, Commission } from "@/models";
import { ApiError } from "@/utils/apiError";
import type { DocumentType } from "@/models/Document";

interface CreateStudentInput {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName: string;
  course: string;
  semester: string;
  plan: "2500" | "5000";
  mysyRegistrationNumber?: string;
  mysyPassword?: string;
}

interface ListStudentsParams {
  page: number;
  pageSize: number;
  search?: string;
  plan: "2500" | "5000" | "all";
  status: "pending" | "verified" | "completed" | "correction_requested" | "all";
  /** When set, scopes results to this referral partner only (used for "My Students") */
  referralPartnerId?: string;
}

/** Commission amount is a flat percentage of the plan fee - kept simple and centralized here. */
const COMMISSION_RATE = 0.2; // 20% of plan amount

export const studentService = {
  create: async (input: CreateStudentInput, referralPartnerId: string, createdBy: string): Promise<Student> => {
    const student = await Student.create({ ...input, referralPartnerId });

    await StudentTimeline.create({
      studentId: student.id,
      event: "application_submitted",
      note: "Application submitted by referral partner",
      createdBy,
    });

    return student;
  },

  list: async ({ page, pageSize, search, plan, status, referralPartnerId }: ListStudentsParams) => {
    const where: Record<string | symbol, unknown> = {};
    if (referralPartnerId) where.referralPartnerId = referralPartnerId;
    if (plan !== "all") where.plan = plan;
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

  update: async (id: string, updates: Partial<CreateStudentInput>, requester: { id: string; role: string }): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    // Referral Admins can only edit applications that are still pending (per project rule)
    if (requester.role === "referral_admin" && student.status !== "pending") {
      throw ApiError.forbidden("Only pending applications can be edited");
    }

    await student.update(updates);
    return student;
  },

  /** Super Admin verifies an application - creates the commission record at this point. */
  verify: async (id: string, verifiedBy: string): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    if (student.status === "verified" || student.status === "completed") {
      throw ApiError.badRequest("This application has already been verified");
    }

    const commissionAmount = Number(student.plan) * COMMISSION_RATE;

    await student.update({ status: "verified", correctionNote: null });
    await StudentTimeline.create({ studentId: id, event: "verified", createdBy: verifiedBy });
    await Commission.findOrCreate({
      where: { studentId: id },
      defaults: { referralPartnerId: student.referralPartnerId, studentId: id, amount: commissionAmount, status: "pending" },
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
    await StudentTimeline.create({ studentId: id, event: "completed", createdBy: completedBy });

    return student;
  },

  updateScholarship: async (
    id: string,
    updates: { mysyRegistrationNumber?: string; mysyPassword?: string; scholarshipStatus?: "pending" | "approved" | "rejected" },
    requester: { id: string; role: string }
  ): Promise<Student> => {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound("Student not found");
    studentService.assertAccess(student, requester);

    await student.update(updates);
    return student;
  },

  addDocument: async (
    studentId: string,
    type: DocumentType,
    file: { url: string; fileName: string },
    uploadedBy: string
  ): Promise<StudentDocument> => {
    const student = await Student.findByPk(studentId);
    if (!student) throw ApiError.notFound("Student not found");

    // Replace any existing document of the same type (unique constraint on student_id+type)
    const existing = await StudentDocument.findOne({ where: { studentId, type } });
    if (existing) {
      await existing.update({ fileUrl: file.url, fileName: file.fileName, uploadedBy });
      return existing;
    }

    const document = await StudentDocument.create({ studentId, type, fileUrl: file.url, fileName: file.fileName, uploadedBy });
    await StudentTimeline.create({ studentId, event: "receipt_uploaded", note: `${type.replace(/_/g, " ")} uploaded`, createdBy: uploadedBy });

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
