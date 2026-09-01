import { Op, fn, col, literal } from "sequelize";
import { Student, User, Commission } from "@/models";

/** Returns the last N months as { year, month, label } - used to build zero-filled chart series. */
function getLastNMonths(n: number): { year: number; month: number; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return months;
}

export const dashboardService = {
  /**
   * Role-aware Dashboard stats - Cards + Charts + Recent Students in one call.
   * If user is Super Admin -> returns overall CRM stats.
   * If user is Referral Admin -> returns stats scoped to their referrals.
   */
  getStats: async (user: { id: string; role: string }) => {
    const isSuperAdmin = user.role === "super_admin";
    const studentWhere: Record<string, unknown> = isSuperAdmin ? {} : { referralPartnerId: user.id };
    const commissionWhere: Record<string, unknown> = isSuperAdmin ? {} : { referralPartnerId: user.id };

    const [
      totalReferralPartners,
      totalStudents,
      plan2500Count,
      plan5000Count,
      pendingCount,
      completedCount,
      commissionTotals,
      monthlyStudentsRaw,
      monthlyApplicationsRaw,
      recentStudents,
    ] = await Promise.all([
      isSuperAdmin ? User.count({ where: { role: "referral_admin" } }) : Promise.resolve(0),
      Student.count({ where: studentWhere }),
      Student.count({ where: { ...studentWhere, plan: "2500" } }),
      Student.count({ where: { ...studentWhere, plan: "5000" } }),
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
      // Students created per month, last 6 months
      Student.findAll({
        attributes: [
          [fn("DATE_TRUNC", "month", col("created_at")), "month"],
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          ...studentWhere,
          createdAt: { [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) },
        },
        group: ["month"],
        order: [[literal("month"), "ASC"]],
        raw: true,
      }),
      // Applications (students) grouped by month + status=completed, last 6 months
      Student.findAll({
        attributes: [
          [fn("DATE_TRUNC", "month", col("created_at")), "month"],
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          ...studentWhere,
          status: "completed",
          createdAt: { [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) },
        },
        group: ["month"],
        order: [[literal("month"), "ASC"]],
        raw: true,
      }),
      Student.findAll({
        where: studentWhere,
        limit: 8,
        order: [["createdAt", "DESC"]],
        include: [{ model: User, as: "referralPartner", attributes: ["id", "fullName"] }],
      }),
    ]);

    // Zero-fill months that had no activity, so the chart never has gaps
    const months = getLastNMonths(6);
    const fillSeries = (raw: Array<{ month: string | Date; count: string | number }>) =>
      months.map(({ year, month, label }) => {
        const match = raw.find((r) => {
          const d = new Date(r.month);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
        return { label, count: match ? Number(match.count) : 0 };
      });

    const commissionRow = (commissionTotals[0] ?? { total: 0, pending: 0, paid: 0 }) as unknown as {
      total: string;
      pending: string;
      paid: string;
    };

    return {
      cards: {
        totalReferralPartners,
        totalStudents,
        plan2500Count,
        plan5000Count,
        pendingCount,
        completedCount,
        commission: {
          total: Number(commissionRow.total),
          pending: Number(commissionRow.pending),
          paid: Number(commissionRow.paid),
        },
      },
      charts: {
        monthlyStudents: fillSeries(monthlyStudentsRaw as unknown as Array<{ month: string; count: string }>),
        monthlyApplications: fillSeries(monthlyApplicationsRaw as unknown as Array<{ month: string; count: string }>),
      },
      recentStudents: recentStudents.map((s) => s.toJSON()),
    };
  },

  getSuperAdminStats: async () => {
    return dashboardService.getStats({ id: "", role: "super_admin" });
  },
};
