import { Op, fn, col, literal, QueryTypes } from "sequelize";
import { Student, User, Commission } from "@/models";
import { sequelize } from "@/config/database.config";

export const dashboardService = {
  /**
   * Role-aware Dashboard stats (cards + recent students).
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
      recentStudents: recentStudents.map((s) => s.toJSON()),
    };
  },

  /**
   * V9 NEW: Partner-wise receipts with pending/paid breakdown, filterable by
   * period (7d/30d/90d/all) and specific partner.
   */
  getPartnerReceipts: async (filters: { period: string; partnerId?: string }) => {
    const { period, partnerId } = filters;

    const replacements: Record<string, any> = {};
    let dateCondition = "";
    if (period === "7d") {
      dateCondition = "AND s.created_at >= :dateFrom";
      replacements.dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      dateCondition = "AND s.created_at >= :dateFrom";
      replacements.dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === "90d") {
      dateCondition = "AND s.created_at >= :dateFrom";
      replacements.dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    let partnerCondition = "";
    if (partnerId && partnerId !== "all" && partnerId.trim() !== "") {
      partnerCondition = "AND u.id = :partnerId";
      replacements.partnerId = partnerId.trim();
    }

    const sql = `
      SELECT
        u.id AS "partnerId",
        u.full_name AS "partnerName",
        COUNT(DISTINCT s.id) AS "totalReceipts",
        COUNT(DISTINCT CASE WHEN s.service_type = 'prepaid' THEN s.id END) AS "prepaidCount",
        COUNT(DISTINCT CASE WHEN s.service_type = 'postpaid' THEN s.id END) AS "postpaidCount",
        COALESCE(SUM(CASE WHEN c.status = 'pending' THEN s.buying_price ELSE 0 END), 0) AS "pendingRevenue",
        COALESCE(SUM(CASE WHEN c.status = 'paid' THEN s.buying_price ELSE 0 END), 0) AS "paidRevenue",
        COUNT(DISTINCT CASE WHEN c.status = 'paid' THEN s.id END) AS "paidStudentsCount"
      FROM users u
      INNER JOIN students s ON s.referral_partner_id = u.id AND s.deleted_at IS NULL
      LEFT JOIN commissions c ON c.student_id = s.id
      WHERE u.role = 'referral_admin' ${dateCondition} ${partnerCondition}
      GROUP BY u.id, u.full_name
      HAVING COUNT(s.id) > 0
      ORDER BY "paidRevenue" DESC, "pendingRevenue" DESC;
    `;

    const rows = await sequelize.query<any>(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const items = rows.map((r) => {
      const pending = Number(r.pendingRevenue);
      const paid = Number(r.paidRevenue);
      return {
        partnerId: r.partnerId,
        partnerName: r.partnerName,
        prepaidCount: Number(r.prepaidCount),
        postpaidCount: Number(r.postpaidCount),
        totalReceipts: Number(r.totalReceipts),
        pendingRevenue: pending,
        paidRevenue: paid,
        totalRevenue: pending + paid,
        paidStudentsCount: Number(r.paidStudentsCount),
      };
    });

    const totals = items.reduce(
      (acc, r) => ({
        totalReceipts: acc.totalReceipts + r.totalReceipts,
        pendingRevenue: acc.pendingRevenue + r.pendingRevenue,
        paidRevenue: acc.paidRevenue + r.paidRevenue,
        totalRevenue: acc.totalRevenue + r.totalRevenue,
        paidStudentsCount: acc.paidStudentsCount + r.paidStudentsCount,
      }),
      { totalReceipts: 0, pendingRevenue: 0, paidRevenue: 0, totalRevenue: 0, paidStudentsCount: 0 }
    );

    return { items, totals };
  },

  getSuperAdminStats: async () => {
    return dashboardService.getStats({ id: "", role: "super_admin" });
  },
};