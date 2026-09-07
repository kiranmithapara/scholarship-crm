import { Op, fn, col, literal } from "sequelize";
import { User, Student, Commission, StudentDocument, Payment, StudentTimeline, LoginLog, ActivityLog, Otp } from "@/models";
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
  delete: async (id: string): Promise<User> => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const partnerEmail = partner.email;
    const partnerPhotoUrl = partner.photoUrl;

    await sequelize.transaction(async (t) => {
      // 1. Get all students created by this referral partner
      const students = await Student.findAll({
        where: { referralPartnerId: id },
        attributes: ["id"],
        transaction: t,
      });
      const studentIds = students.map((s) => s.id);

      // Collect document file names for cleanup
      const docFileNames: string[] = [];
      if (studentIds.length > 0) {
        const docs = await StudentDocument.findAll({
          where: {
            [Op.or]: [{ studentId: { [Op.in]: studentIds } }, { uploadedBy: id }],
          },
          attributes: ["fileName"],
          transaction: t,
        });
        docs.forEach((d) => {
          if (d.fileName) docFileNames.push(d.fileName);
        });

        // Delete Student Documents
        await StudentDocument.destroy({
          where: {
            [Op.or]: [{ studentId: { [Op.in]: studentIds } }, { uploadedBy: id }],
          },
          transaction: t,
        });

        // Delete Student Payments
        await Payment.destroy({
          where: { studentId: { [Op.in]: studentIds } },
          transaction: t,
        });

        // Delete Student Timeline Entries
        await StudentTimeline.destroy({
          where: {
            [Op.or]: [{ studentId: { [Op.in]: studentIds } }, { createdBy: id }],
          },
          transaction: t,
        });

        // Delete Commissions
        await Commission.destroy({
          where: {
            [Op.or]: [{ studentId: { [Op.in]: studentIds } }, { referralPartnerId: id }],
          },
          transaction: t,
        });

        // Delete Students
        await Student.destroy({
          where: { referralPartnerId: id },
          transaction: t,
        });
      }

      // Cleanup any remaining orphan records where partner was actor/owner
      await StudentDocument.destroy({ where: { uploadedBy: id }, transaction: t });
      await StudentTimeline.destroy({ where: { createdBy: id }, transaction: t });
      await Commission.destroy({ where: { referralPartnerId: id }, transaction: t });
      await LoginLog.destroy({ where: { userId: id }, transaction: t });
      await ActivityLog.destroy({ where: { userId: id }, transaction: t });
      await Otp.destroy({ where: { email: partnerEmail }, transaction: t });

      // Delete the partner User record
      await partner.destroy({ transaction: t });

      // Clean up physical file storage after DB transaction completes successfully
      docFileNames.forEach((fileName) => {
        uploadService.deleteFile(fileName).catch(() => {});
      });
      if (partnerPhotoUrl) {
        uploadService.deleteFile(partnerPhotoUrl).catch(() => {});
      }
    });

    return partner;
  },
};
