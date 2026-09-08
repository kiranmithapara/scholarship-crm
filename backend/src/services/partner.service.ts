import { Op, fn, col, literal } from "sequelize";
import { User, Student, Commission, LoginLog, ActivityLog, Otp } from "@/models";
import { sequelize } from "@/config/database.config";
import { ApiError } from "@/utils/apiError";
import { hashPassword } from "@/helpers/password.helper";
import { mailService } from "./mail.service";
import { uploadService } from "./upload.service";

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
}

export const partnerService = {
  /** Create a new referral partner - Super Admin only. */
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
    });

    return partner;
  },
  /** Paginated referral partner list with student count + commission summary per partner (Page 4). */
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
        [fn("COALESCE", fn("SUM", col("commissions.amount")), 0), "totalCommission"],
      ],
      include: [
        { model: Student, as: "students", attributes: [], required: false },
        { model: Commission, as: "commissions", attributes: [], required: false },
      ],
      group: ["User.id"],
      subQuery: false,
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // findAndCountAll's `count` is unreliable with GROUP BY - recompute distinct partner count separately
    const total = await User.count({ where });

    return {
      items: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /** Full partner profile (Page 5) - service type breakdown, commission pending/paid, student list, pricing. */
  getProfile: async (id: string) => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const [prepaidCount, postpaidCount, commissionTotals, students] = await Promise.all([
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
    ]);

    const commissionRow = (commissionTotals[0] ?? { pending: 0, paid: 0 }) as unknown as { pending: string; paid: string };

    return {
      partner: partner.toSafeJSON(),
      stats: {
        prepaidCount,
        postpaidCount,
        commission: {
          pending: Number(commissionRow.pending),
          paid: Number(commissionRow.paid),
        },
      },
      students,
    };
  },

  /** V3 NEW: Lists every commission (one per verified student) for this partner, with the
   * student's name attached, so Super Admin can see exactly what's owed and to whom before
   * marking anything paid. */
  getCommissions: async (id: string) => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    return Commission.findAll({
      where: { referralPartnerId: id },
      include: [{ model: Student, as: "student", attributes: ["id", "fullName", "serviceType"] }],
      order: [["createdAt", "DESC"]],
    });
  },

  /**
   * V3 NEW: Marks a single commission as paid (or reverts it back to pending).
   * This was a genuine gap in V2 - commissions were created as "pending" on verification
   * but nothing anywhere could ever move them to "paid", so the Commission Paid figures on
   * the Dashboard and Partner Profile were permanently stuck at ₹0.
   */
  updateCommissionStatus: async (commissionId: string, status: "pending" | "paid") => {
    const commission = await Commission.findByPk(commissionId);
    if (!commission) throw ApiError.notFound("Commission record not found");

    await commission.update({ status, paidAt: status === "paid" ? new Date() : null });
    return commission;
  },

  /** V2 NEW: Super Admin sets what a partner PAYS (their buying cost) for each service type. */
  updatePricing: async (id: string, prepaidCost: number, postpaidCost: number): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    await partner.update({ prepaidCost: prepaidCost.toFixed(2), postpaidCost: postpaidCost.toFixed(2) });
    return partner;
  },

  /** Blocks or activates a partner - Super Admin only. Sends a notification email either way. */
  updateStatus: async (id: string, isActive: boolean): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    await partner.update({ isActive });
    await mailService.sendAccountStatusEmail(partner.email, isActive);

    return partner;
  },

  update: async (id: string, updates: { fullName?: string; mobile?: string; photoUrl?: string | null }): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    await partner.update(updates);
    return partner;
  },

  /** Deletes a referral partner and cascade deletes ALL associated data - Super Admin only. */
  /**
   * Deletes a Referral Partner account.
   *
   * BUSINESS RULE: student records must be preserved PERMANENTLY (per project spec - they
   * become a future marketing database, e.g. converting old students into new referral
   * partners later). A partner who has ever added students can therefore NEVER be deleted -
   * only blocked (see updateStatus). This also matches the `onDelete: RESTRICT` foreign key
   * already defined on students.referral_partner_id at the database level.
   *
   * Deletion is only permitted for partners with zero students on record (e.g. a duplicate
   * or mistakenly-created account that was never actually used).
   */
  delete: async (id: string): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const studentCount = await Student.count({ where: { referralPartnerId: id } });
    if (studentCount > 0) {
      throw ApiError.badRequest(
        `This partner has ${studentCount} student record${studentCount === 1 ? "" : "s"} on file. ` +
          "Student data must be preserved permanently and cannot be deleted. " +
          "Block this partner instead if you want to prevent further access."
      );
    }

    const partnerEmail = partner.email;
    const partnerPhotoUrl = partner.photoUrl;

    await sequelize.transaction(async (t) => {
      // No students exist for this partner, so there is nothing to cascade at the student
      // level - only the partner's own account-scoped records need cleaning up.
      await LoginLog.destroy({ where: { userId: id }, transaction: t });
      await ActivityLog.destroy({ where: { userId: id }, transaction: t });
      await Otp.destroy({ where: { email: partnerEmail }, transaction: t });
      await partner.destroy({ transaction: t });

      if (partnerPhotoUrl) {
        uploadService.deleteFile(partnerPhotoUrl).catch(() => {});
      }
    });

    return partner;
  },
};
