import { Op, QueryTypes } from "sequelize";
import { Student, User } from "@/models";
import { sequelize } from "@/config/database.config";

export const dashboardService = {
  /**
   * Role-aware Dashboard stats (cards + recent students).
   */
  getStats: async (user: { id: string; role: string }) => {
    const isSuperAdmin = user.role === "super_admin";
    const studentWhere: Record<string, unknown> = isSuperAdmin ? {} : { referralPartnerId: user.id };

    const [
      totalReferralPartners,
      totalStudents,
      prepaidCount,
      postpaidCount,
      pendingCount,
      completedCount,
      commissionStatsRows,
      recentStudents,
    ] = await Promise.all([
      isSuperAdmin ? User.count({ where: { role: "referral_admin" } }) : Promise.resolve(0),
      Student.count({ where: studentWhere }),
      Student.count({ where: { ...studentWhere, serviceType: "prepaid" } }),
      Student.count({ where: { ...studentWhere, serviceType: "postpaid" } }),
      Student.count({ where: { ...studentWhere, status: { [Op.in]: ["pending", "correction_requested"] } } }),
      Student.count({ where: { ...studentWhere, status: "completed" } }),
      sequelize.query<any>(
        `SELECT
           COALESCE(SUM(COALESCE(c.amount, s.partner_profit, 0)), 0) AS "total",
           COALESCE(SUM(CASE WHEN c.status = 'pending' OR c.status IS NULL THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "pending",
           COALESCE(SUM(CASE WHEN c.status = 'paid' OR s.status = 'completed' THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "paid",
           COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "postpaidTotal",
           COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'pending' OR c.status IS NULL) THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "postpaidPending",
           COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'paid' OR s.status = 'completed') THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "postpaidPaid",
           COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "prepaidTotal",
           COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'pending' OR c.status IS NULL) THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "prepaidPending",
           COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'paid' OR s.status = 'completed') THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "prepaidPaid"
         FROM students s
         LEFT JOIN commissions c ON c.student_id = s.id
         WHERE s.deleted_at IS NULL ${isSuperAdmin ? "" : "AND s.referral_partner_id = :userId"};`,
        {
          replacements: isSuperAdmin ? {} : { userId: user.id },
          type: QueryTypes.SELECT,
        }
      ),
      Student.findAll({
        where: studentWhere,
        limit: 8,
        order: [["createdAt", "DESC"]],
        include: [{ model: User, as: "referralPartner", attributes: ["id", "fullName"] }],
      }),
    ]);

    let revenueRow: any = {
      total: "0",
      pending: "0",
      paid: "0",
      postpaidTotal: "0",
      postpaidPending: "0",
      postpaidPaid: "0",
      prepaidTotal: "0",
      prepaidPending: "0",
      prepaidPaid: "0",
    };

    if (isSuperAdmin) {
      const revenueRows = await sequelize.query<any>(
        `SELECT
           COALESCE(SUM(s.buying_price), 0) AS total,
           COALESCE(SUM(CASE WHEN c.status = 'pending' OR c.status IS NULL THEN s.buying_price ELSE 0 END), 0) AS pending,
           COALESCE(SUM(CASE WHEN c.status = 'paid' OR s.status = 'completed' THEN s.buying_price ELSE 0 END), 0) AS paid,
           COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' THEN s.buying_price ELSE 0 END), 0) AS "postpaidTotal",
           COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'pending' OR c.status IS NULL) THEN s.buying_price ELSE 0 END), 0) AS "postpaidPending",
           COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'paid' OR s.status = 'completed') THEN s.buying_price ELSE 0 END), 0) AS "postpaidPaid",
           COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' THEN s.buying_price ELSE 0 END), 0) AS "prepaidTotal",
           COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'pending' OR c.status IS NULL) THEN s.buying_price ELSE 0 END), 0) AS "prepaidPending",
           COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'paid' OR s.status = 'completed') THEN s.buying_price ELSE 0 END), 0) AS "prepaidPaid"
         FROM students s
         LEFT JOIN commissions c ON c.student_id = s.id
         WHERE s.deleted_at IS NULL;`,
        { type: QueryTypes.SELECT }
      );
      if (revenueRows.length > 0) revenueRow = revenueRows[0];
    }

    const commissionRow = (commissionStatsRows[0] ?? {}) as any;

    return {
      cards: {
        totalReferralPartners,
        totalStudents,
        prepaidCount,
        postpaidCount,
        pendingCount,
        completedCount,
        commission: {
          total: Number(commissionRow.total ?? 0),
          pending: Number(commissionRow.pending ?? 0),
          paid: Number(commissionRow.paid ?? 0),
        },
        postpaidCommission: {
          total: Number(commissionRow.postpaidTotal ?? 0),
          pending: Number(commissionRow.postpaidPending ?? 0),
          paid: Number(commissionRow.postpaidPaid ?? 0),
        },
        prepaidCommission: {
          total: Number(commissionRow.prepaidTotal ?? 0),
          pending: Number(commissionRow.prepaidPending ?? 0),
          paid: Number(commissionRow.prepaidPaid ?? 0),
        },
        adminRevenue: {
          total: Number(revenueRow.total ?? 0),
          pending: Number(revenueRow.pending ?? 0),
          paid: Number(revenueRow.paid ?? 0),
          postpaid: {
            total: Number(revenueRow.postpaidTotal ?? 0),
            pending: Number(revenueRow.postpaidPending ?? 0),
            paid: Number(revenueRow.postpaidPaid ?? 0),
          },
          prepaid: {
            total: Number(revenueRow.prepaidTotal ?? 0),
            pending: Number(revenueRow.prepaidPending ?? 0),
            paid: Number(revenueRow.prepaidPaid ?? 0),
          },
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
        -- Total Admin Revenue (Partner to Admin price: s.buying_price)
        COALESCE(SUM(CASE WHEN c.status = 'pending' OR c.status IS NULL THEN s.buying_price ELSE 0 END), 0) AS "pendingRevenue",
        COALESCE(SUM(CASE WHEN c.status = 'paid' OR s.status = 'completed' THEN s.buying_price ELSE 0 END), 0) AS "paidRevenue",
        -- Prepaid Admin Revenue
        COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'pending' OR c.status IS NULL) THEN s.buying_price ELSE 0 END), 0) AS "prepaidPendingRevenue",
        COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'paid' OR s.status = 'completed') THEN s.buying_price ELSE 0 END), 0) AS "prepaidPaidRevenue",
        -- Postpaid Admin Revenue
        COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'pending' OR c.status IS NULL) THEN s.buying_price ELSE 0 END), 0) AS "postpaidPendingRevenue",
        COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'paid' OR s.status = 'completed') THEN s.buying_price ELSE 0 END), 0) AS "postpaidPaidRevenue",
        -- Commission breakdowns (Partner Share)
        COALESCE(SUM(CASE WHEN c.status = 'pending' OR c.status IS NULL THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "pendingCommission",
        COALESCE(SUM(CASE WHEN c.status = 'paid' OR s.status = 'completed' THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "paidCommission",
        COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'pending' OR c.status IS NULL) THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "postpaidPendingCommission",
        COALESCE(SUM(CASE WHEN s.service_type = 'postpaid' AND (c.status = 'paid' OR s.status = 'completed') THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "postpaidPaidCommission",
        COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'pending' OR c.status IS NULL) THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "prepaidPendingCommission",
        COALESCE(SUM(CASE WHEN s.service_type = 'prepaid' AND (c.status = 'paid' OR s.status = 'completed') THEN COALESCE(c.amount, s.partner_profit, 0) ELSE 0 END), 0) AS "prepaidPaidCommission",
        -- Student counts
        COUNT(DISTINCT CASE WHEN c.status = 'paid' OR s.status = 'completed' THEN s.id END) AS "paidStudentsCount",
        COUNT(DISTINCT CASE WHEN s.service_type = 'prepaid' AND (c.status = 'paid' OR s.status = 'completed') THEN s.id END) AS "prepaidPaidStudentsCount",
        COUNT(DISTINCT CASE WHEN s.service_type = 'postpaid' AND (c.status = 'paid' OR s.status = 'completed') THEN s.id END) AS "postpaidPaidStudentsCount"
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
      const pending = Number(r.pendingRevenue ?? 0);
      const paid = Number(r.paidRevenue ?? 0);
      const prepaidPending = Number(r.prepaidPendingRevenue ?? 0);
      const prepaidPaid = Number(r.prepaidPaidRevenue ?? 0);
      const postpaidPending = Number(r.postpaidPendingRevenue ?? 0);
      const postpaidPaid = Number(r.postpaidPaidRevenue ?? 0);

      const pendingComm = Number(r.pendingCommission ?? 0);
      const paidComm = Number(r.paidCommission ?? 0);
      const prepaidPendingComm = Number(r.prepaidPendingCommission ?? 0);
      const prepaidPaidComm = Number(r.prepaidPaidCommission ?? 0);
      const postpaidPendingComm = Number(r.postpaidPendingCommission ?? 0);
      const postpaidPaidComm = Number(r.postpaidPaidCommission ?? 0);

      return {
        partnerId: r.partnerId,
        partnerName: r.partnerName,
        prepaidCount: Number(r.prepaidCount ?? 0),
        postpaidCount: Number(r.postpaidCount ?? 0),
        totalReceipts: Number(r.totalReceipts ?? 0),
        // All Revenue
        pendingRevenue: pending,
        paidRevenue: paid,
        totalRevenue: pending + paid,
        // Prepaid Revenue
        prepaidPendingRevenue: prepaidPending,
        prepaidPaidRevenue: prepaidPaid,
        prepaidTotalRevenue: prepaidPending + prepaidPaid,
        // Postpaid Revenue
        postpaidPendingRevenue: postpaidPending,
        postpaidPaidRevenue: postpaidPaid,
        postpaidTotalRevenue: postpaidPending + postpaidPaid,
        // Commissions
        pendingCommission: pendingComm,
        paidCommission: paidComm,
        totalCommission: pendingComm + paidComm,
        prepaidPendingCommission: prepaidPendingComm,
        prepaidPaidCommission: prepaidPaidComm,
        prepaidTotalCommission: prepaidPendingComm + prepaidPaidComm,
        postpaidPendingCommission: postpaidPendingComm,
        postpaidPaidCommission: postpaidPaidComm,
        postpaidTotalCommission: postpaidPendingComm + postpaidPaidComm,
        // Paid counts
        paidStudentsCount: Number(r.paidStudentsCount ?? 0),
        prepaidPaidStudentsCount: Number(r.prepaidPaidStudentsCount ?? 0),
        postpaidPaidStudentsCount: Number(r.postpaidPaidStudentsCount ?? 0),
      };
    });

    const totals = items.reduce(
      (acc, r) => ({
        totalReceipts: acc.totalReceipts + r.totalReceipts,
        prepaidCount: acc.prepaidCount + r.prepaidCount,
        postpaidCount: acc.postpaidCount + r.postpaidCount,
        // All
        pendingRevenue: acc.pendingRevenue + r.pendingRevenue,
        paidRevenue: acc.paidRevenue + r.paidRevenue,
        totalRevenue: acc.totalRevenue + r.totalRevenue,
        // Prepaid
        prepaidPendingRevenue: acc.prepaidPendingRevenue + r.prepaidPendingRevenue,
        prepaidPaidRevenue: acc.prepaidPaidRevenue + r.prepaidPaidRevenue,
        prepaidTotalRevenue: acc.prepaidTotalRevenue + r.prepaidTotalRevenue,
        // Postpaid
        postpaidPendingRevenue: acc.postpaidPendingRevenue + r.postpaidPendingRevenue,
        postpaidPaidRevenue: acc.postpaidPaidRevenue + r.postpaidPaidRevenue,
        postpaidTotalRevenue: acc.postpaidTotalRevenue + r.postpaidTotalRevenue,
        // Commission
        pendingCommission: acc.pendingCommission + r.pendingCommission,
        paidCommission: acc.paidCommission + r.paidCommission,
        totalCommission: acc.totalCommission + r.totalCommission,
        prepaidPendingCommission: acc.prepaidPendingCommission + r.prepaidPendingCommission,
        prepaidPaidCommission: acc.prepaidPaidCommission + r.prepaidPaidCommission,
        prepaidTotalCommission: acc.prepaidTotalCommission + r.prepaidTotalCommission,
        postpaidPendingCommission: acc.postpaidPendingCommission + r.postpaidPendingCommission,
        postpaidPaidCommission: acc.postpaidPaidCommission + r.postpaidPaidCommission,
        postpaidTotalCommission: acc.postpaidTotalCommission + r.postpaidTotalCommission,
        // Counts
        paidStudentsCount: acc.paidStudentsCount + r.paidStudentsCount,
        prepaidPaidStudentsCount: acc.prepaidPaidStudentsCount + r.prepaidPaidStudentsCount,
        postpaidPaidStudentsCount: acc.postpaidPaidStudentsCount + r.postpaidPaidStudentsCount,
      }),
      {
        totalReceipts: 0,
        prepaidCount: 0,
        postpaidCount: 0,
        pendingRevenue: 0,
        paidRevenue: 0,
        totalRevenue: 0,
        prepaidPendingRevenue: 0,
        prepaidPaidRevenue: 0,
        prepaidTotalRevenue: 0,
        postpaidPendingRevenue: 0,
        postpaidPaidRevenue: 0,
        postpaidTotalRevenue: 0,
        pendingCommission: 0,
        paidCommission: 0,
        totalCommission: 0,
        prepaidPendingCommission: 0,
        prepaidPaidCommission: 0,
        prepaidTotalCommission: 0,
        postpaidPendingCommission: 0,
        postpaidPaidCommission: 0,
        postpaidTotalCommission: 0,
        paidStudentsCount: 0,
        prepaidPaidStudentsCount: 0,
        postpaidPaidStudentsCount: 0,
      }
    );

    return { items, totals };
  },

  getSuperAdminStats: async () => {
    return dashboardService.getStats({ id: "", role: "super_admin" });
  },
};