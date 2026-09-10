import { Op, fn, col, literal } from "sequelize";
import { User, Student, Commission, StudentTimeline, PartnerNote } from "@/models";
import { ApiError } from "@/utils/apiError";
import { hashPassword } from "@/helpers/password.helper";
import { mailService } from "./mail.service";

interface ListPartnersParams {
  page: number;
  pageSize: number;
  search?: string;
  status: "active" | "blocked" | "all";
}

export interface CreatePartnerInput {
  fullName: string;
  email: string;
  mobile: string;
  username: string;
  password: string;
  photoUrl?: string | null;
  prepaidCost?: number | string | null;
  postpaidCost?: number | string | null;
}

export const partnerService = {
  create: async (input: CreatePartnerInput): Promise<User> => {
    const existing = await User.findOne({
      where: { [Op.or]: [{ email: input.email }, { username: input.username }, { mobile: input.mobile }] },
    });

    if (existing) {
      if (existing.email === input.email) throw ApiError.conflict("Email is already registered");
      if (existing.username === input.username) throw ApiError.conflict("Username is already taken");
      throw ApiError.conflict("Mobile number is already registered");
    }

    const hashedPassword = await hashPassword(input.password);

    const partner = await User.create({
      fullName: input.fullName,
      mobile: input.mobile,
      email: input.email,
      username: input.username,
      password: hashedPassword,
      role: "referral_admin",
      isActive: true,
      isEmailVerified: true,
      photoUrl: input.photoUrl ?? null,
      prepaidCost: input.prepaidCost != null && input.prepaidCost !== "" ? Number(input.prepaidCost).toFixed(2) : "1500.00",
      postpaidCost: input.postpaidCost != null && input.postpaidCost !== "" ? Number(input.postpaidCost).toFixed(2) : "4500.00",
    });

    return partner;
  },

  list: async ({ page, pageSize, search, status }: ListPartnersParams) => {
    const where: Record<string | symbol, unknown> = { role: "referral_admin" };

    if (status === "active") where.isActive = true;
    if (status === "blocked") where.isActive = false;

    if (search) {
      where[Op.or as unknown as string] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows } = await User.findAndCountAll({
      where,
      attributes: [
        "id",
        "fullName",
        "mobile",
        "email",
        "photoUrl",
        "isActive",
        "createdAt",
        [fn("COUNT", fn("DISTINCT", col("students.id"))), "studentCount"],
      ],
      include: [{ model: Student, as: "students", attributes: [], required: false }],
      group: ["User.id"],
      subQuery: false,
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const partnerIds = rows.map((r) => (r as any).id);
    const commissionMap: Record<string, number> = {};

    if (partnerIds.length > 0) {
      const commissions = await Commission.findAll({
        where: { referralPartnerId: { [Op.in]: partnerIds } },
        attributes: [
          "referralPartnerId",
          [fn("COALESCE", fn("SUM", col("amount")), 0), "totalCommission"],
        ],
        group: ["referralPartnerId"],
        raw: true,
      });

      commissions.forEach((c: any) => {
        commissionMap[c.referralPartnerId] = Number(c.totalCommission);
      });
    }

    const items = rows.map((partner: any) => ({
      ...partner.toJSON(),
      totalCommission: commissionMap[partner.id] ?? 0,
    }));

    const total = await User.count({ where });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  getProfile: async (id: string) => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const [prepaidCount, postpaidCount, commissionTotals, students, notes] = await Promise.all([
      Student.count({ where: { referralPartnerId: id, serviceType: "prepaid" } }),
      Student.count({ where: { referralPartnerId: id, serviceType: "postpaid" } }),
      Commission.findAll({
        where: { referralPartnerId: id },
        attributes: [
          [fn("COALESCE", fn("SUM", literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 0), "pending"],
          [fn("COALESCE", fn("SUM", literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 0), "paid"],
        ],
        raw: true,
      }),
      Student.findAll({ where: { referralPartnerId: id }, order: [["createdAt", "DESC"]] }),
      // V6 NEW: include partner notes
      PartnerNote.findAll({
        where: { partnerId: id },
        include: [{ model: User, as: "author", attributes: ["id", "fullName"] }],
        order: [["createdAt", "DESC"]],
      }),
    ]);

    const commissionRow = (commissionTotals[0] ?? { pending: 0, paid: 0 }) as unknown as { pending: string; paid: string };

    const partnerSafe = partner.toSafeJSON();
    partnerSafe.prepaidCost = partnerSafe.prepaidCost ?? "1500.00";
    partnerSafe.postpaidCost = partnerSafe.postpaidCost ?? "4500.00";

    return {
      partner: partnerSafe,
      stats: {
        prepaidCount,
        postpaidCount,
        commission: {
          pending: Number(commissionRow.pending),
          paid: Number(commissionRow.paid),
        },
      },
      students,
      notes,
    };
  },

  getCommissions: async (id: string) => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    return Commission.findAll({
      where: { referralPartnerId: id },
      include: [{ model: Student, as: "student", attributes: ["id", "fullName", "serviceType"] }],
      order: [["createdAt", "DESC"]],
    });
  },

  updateCommissionStatus: async (commissionId: string, status: "pending" | "paid") => {
    const commission = await Commission.findByPk(commissionId);
    if (!commission) throw ApiError.notFound("Commission record not found");

    await commission.update({ status, paidAt: status === "paid" ? new Date() : null });

    if (status === "paid") {
      const student = await Student.findByPk(commission.studentId);
      if (student && student.status !== "completed") {
        await student.update({ status: "completed" });
        await StudentTimeline.create({
          studentId: student.id,
          event: "case_completed",
          createdBy: commission.referralPartnerId,
        });
      }
    }

    return commission;
  },

  markAllCommissionsPaid: async (partnerId: string): Promise<{ count: number }> => {
    const partner = await User.findOne({ where: { id: partnerId, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const pendingCommissions = await Commission.findAll({
      where: { referralPartnerId: partnerId, status: "pending" },
    });

    const now = new Date();
    let count = 0;

    for (const commission of pendingCommissions) {
      await commission.update({ status: "paid", paidAt: now });
      count++;

      const student = await Student.findByPk(commission.studentId);
      if (student && student.status !== "completed") {
        await student.update({ status: "completed" });
        await StudentTimeline.create({
          studentId: student.id,
          event: "case_completed",
          createdBy: partnerId,
        });
      }
    }

    return { count };
  },

  updatePricing: async (id: string, prepaidCost: number, postpaidCost: number): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    await partner.update({ prepaidCost: prepaidCost.toFixed(2), postpaidCost: postpaidCost.toFixed(2) });
    return partner;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    await partner.update({ isActive });
    await mailService.sendAccountStatusEmail(partner.email, isActive);

    return partner;
  },

  update: async (
    id: string,
    updates: {
      fullName?: string;
      mobile?: string;
      email?: string;
      username?: string;
      password?: string;
      prepaidCost?: number | string | null;
      postpaidCost?: number | string | null;
      photoUrl?: string | null;
    }
  ): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    if (updates.email && updates.email.trim().toLowerCase() !== partner.email.toLowerCase()) {
      const existingEmail = await User.findOne({
        where: { email: updates.email.trim().toLowerCase(), id: { [Op.ne]: id } },
      });
      if (existingEmail) throw ApiError.conflict("Email address is already registered");
      partner.email = updates.email.trim().toLowerCase();
    }

    if (updates.mobile && updates.mobile.trim() !== partner.mobile) {
      const existingMobile = await User.findOne({
        where: { mobile: updates.mobile.trim(), id: { [Op.ne]: id } },
      });
      if (existingMobile) throw ApiError.conflict("Mobile number is already registered");
      partner.mobile = updates.mobile.trim();
    }

    if (updates.username && updates.username.trim() !== partner.username) {
      const existingUsername = await User.findOne({
        where: { username: updates.username.trim(), id: { [Op.ne]: id } },
      });
      if (existingUsername) throw ApiError.conflict("Username is already taken");
      partner.username = updates.username.trim();
    }

    if (updates.fullName && updates.fullName.trim()) {
      partner.fullName = updates.fullName.trim();
    }

    if (updates.password && updates.password.trim().length > 0) {
      if (updates.password.trim().length < 6) {
        throw ApiError.badRequest("Password must be at least 6 characters");
      }
      partner.password = await hashPassword(updates.password.trim());
    }

    if (updates.prepaidCost !== undefined) {
      partner.prepaidCost = updates.prepaidCost !== null && updates.prepaidCost !== "" ? Number(updates.prepaidCost).toFixed(2) : null;
    }

    if (updates.postpaidCost !== undefined) {
      partner.postpaidCost = updates.postpaidCost !== null && updates.postpaidCost !== "" ? Number(updates.postpaidCost).toFixed(2) : null;
    }

    if (updates.photoUrl !== undefined) {
      partner.photoUrl = updates.photoUrl;
    }

    await partner.save();
    return partner;
  },

  delete: async (_id: string): Promise<User> => {
    throw ApiError.badRequest("Partner deletion is disabled to prevent permanent data loss. You can Block this partner instead to deactivate their account.");
  },

  // ============================================================
  // V6 NEW: Partner Notes methods
  // ============================================================

  /**
   * Add a new note for this partner. Super Admin only.
   */
  addPartnerNote: async (
    partnerId: string,
    note: string,
    requester: { id: string; role: string }
  ): Promise<PartnerNote> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can add partner notes");
    }

    const partner = await User.findOne({ where: { id: partnerId, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    return PartnerNote.create({
      partnerId,
      note: note.trim(),
      createdBy: requester.id,
    });
  },

  /**
   * Update an existing partner note. Super Admin only.
   */
  updatePartnerNote: async (
    partnerId: string,
    noteId: string,
    note: string,
    requester: { id: string; role: string }
  ): Promise<PartnerNote> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can edit partner notes");
    }

    const entry = await PartnerNote.findOne({ where: { id: noteId, partnerId } });
    if (!entry) throw ApiError.notFound("Note not found");

    await entry.update({ note: note.trim() });
    return entry;
  },

  /**
   * Delete a partner note. Super Admin only.
   */
  deletePartnerNote: async (
    partnerId: string,
    noteId: string,
    requester: { id: string; role: string }
  ): Promise<void> => {
    if (requester.role !== "super_admin") {
      throw ApiError.forbidden("Only Super Admin can delete partner notes");
    }

    const entry = await PartnerNote.findOne({ where: { id: noteId, partnerId } });
    if (!entry) throw ApiError.notFound("Note not found");

    await entry.destroy();
  },
};