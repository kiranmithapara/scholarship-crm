import { Op, fn, col, literal, QueryTypes } from "sequelize";
import { Student, User, Commission } from "@/models";
import { sequelize } from "@/config/database.config";

export const dashboardService = {
  /**
   * Role-aware Dashboard stats.
   * - Super Admin: overall CRM stats + per-partner receipt summary
   * - Referral Admin: stats scoped to their own students
   */
  getStats: async (user: { id: string; role: string }) => {
    const isSuperAdmin = user.role === "super_admin";
    const studentWhere: Record<string, unknown> = isSuperAdmin ? {} : { referralPartnerId: user.id };
    const commissionWhere: Record<string, unknown> = isSuperAdmin ? {} : { referralPartnerId: user.id };

    const [
      totalReferralPartners,
      totalStudents,
      prepaidCount,
      postpaidCount,
      pendingCount,
      completedCount,
      commissionTotals,
      recentStudents,
    ] = await Promise.all([
      isSuperAdmin ? User.count({ where: { role: "referral_admin" } }) : Promise.resolve(0),
      Student.count({ where: studentWhere }),
      Student.count({ where: { ...studentWhere, serviceType: "prepaid" } }),
      Student.count({ where: { ...studentWhere, serviceType: "postpaid" } }),
      Student.count({ where: { ...studentWhere, status: { [Op.in]: ["pending", "correction_requested"] } } }),
      Student.count({ where: { ...studentWhere, status: "completed" } }),
      Commission.findAll({
        where: commissionWhere,
        attributes: [
          [fn("COALESCE", fn("SUM", col("amount")), 0), "total"],
          [fn("COALESCE", fn("SUM", literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 0), "pending"],
          [fn("COALESCE", fn("SUM", literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 0), "paid"],
        ],
        raw: true,
      }),
      Student.findAll({
        where: studentWhere,
        limit: 8,
        order: [["createdAt", "DESC"]],
        include: [{ model: User, as: "referralPartner", attributes: ["id", "fullName"] }],
      }),
    ]);

    // ============================================================
    // Admin Revenue (Super Admin only)
    // ============================================================
    let revenueRow: { pending: string; paid: string } = { pending: "0", paid: "0" };

    if (isSuperAdmin) {
      const revenueRows = await sequelize.query<{ pending: string; paid: string }>(
        `SELECT
           COALESCE(SUM(CASE WHEN c.status = 'pending' THEN s.buying_price ELSE 0 END), 0) AS pending,
           COALESCE(SUM(CASE WHEN c.status = 'paid' THEN s.buying_price ELSE 0 END), 0) AS paid
         FROM commissions c
         JOIN students s ON s.id = c.student_id
         WHERE s.deleted_at IS NULL;`,
        { type: QueryTypes.SELECT }
      );
      if (revenueRows.length > 0) revenueRow = revenueRows[0];
    }

    // ============================================================
    // V9 NEW: Partner-wise receipt summary (Super Admin only)
    // ============================================================
    let partnerReceipts: Array<{
      partnerId: string;
      partnerName: string;
      prepaidCount: number;
      postpaidCount: number;
      totalReceipts: number;
      totalRevenue: number;
    }> = [];

    if (isSuperAdmin) {
      const rows = await sequelize.query<{
        partnerId: string;
        partnerName: string;
        prepaidCount: string;
        postpaidCount: string;
        totalReceipts: string;
        totalRevenue: string;
      }>(
        `SELECT
           u.id AS "partnerId",
           u.full_name AS "partnerName",
           COUNT(CASE WHEN s.service_type = 'prepaid' THEN 1 END) AS "prepaidCount",
           COUNT(CASE WHEN s.service_type = 'postpaid' THEN 1 END) AS "postpaidCount",
           COUNT(s.id) AS "totalReceipts",
           COALESCE(SUM(s.buying_price), 0) AS "totalRevenue"
         FROM users u
         LEFT JOIN students s ON s.referral_partner_id = u.id AND s.deleted_at IS NULL
         WHERE u.role = 'referral_admin'
         GROUP BY u.id, u.full_name
         HAVING COUNT(s.id) > 0
         ORDER BY "totalRevenue" DESC;`,
        { type: QueryTypes.SELECT }
      );

      partnerReceipts = rows.map((r) => ({
        partnerId: r.partnerId,
        partnerName: r.partnerName,
        prepaidCount: Number(r.prepaidCount),
        postpaidCount: Number(r.postpaidCount),
        totalReceipts: Number(r.totalReceipts),
        totalRevenue: Number(r.totalRevenue),
      }));
    }

    const commissionRow = (commissionTotals[0] ?? { total: 0, pending: 0, paid: 0 }) as unknown as {
      total: string;
      pending: string;
      paid: string;
    };

    return {
      cards: {
        totalReferralPartners,
        totalStudents,
        prepaidCount,
        postpaidCount,
        pendingCount,
        completedCount,
        commission: {
          total: Number(commissionRow.total),
          pending: Number(commissionRow.pending),
          paid: Number(commissionRow.paid),
        },
        adminRevenue: {
          pending: Number(revenueRow.pending ?? 0),
          paid: Number(revenueRow.paid ?? 0),
        },
      },
      partnerReceipts,
      recentStudents: recentStudents.map((s) => s.toJSON()),
    };
  },

  getSuperAdminStats: async () => {
    return dashboardService.getStats({ id: "", role: "super_admin" });
  },
};