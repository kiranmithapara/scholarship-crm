import { Op, fn, col, literal } from "sequelize";
import { User, Student, Commission } from "@/models";
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

  /** Full partner profile (Page 5) - plan breakdown, commission pending/paid, student list. */
  getProfile: async (id: string) => {
    const partner = await User.findOne({ where: { id, role: "referral_admin" } });
    if (!partner) throw ApiError.notFound("Referral partner not found");

    const [plan2500Count, plan5000Count, commissionTotals, students] = await Promise.all([
      Student.count({ where: { referralPartnerId: id, plan: "2500" } }),
      Student.count({ where: { referralPartnerId: id, plan: "5000" } }),
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
        plan2500Count,
        plan5000Count,
        commission: {
          pending: Number(commissionRow.pending),
          paid: Number(commissionRow.paid),
        },
      },
      students,
    };
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
};
