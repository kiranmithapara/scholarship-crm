import { Op } from "sequelize";
import { LoginLog, ActivityLog, User } from "@/models";

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export const logsService = {
  listLoginLogs: async ({ page, pageSize, search }: ListParams) => {
    const where: Record<string | symbol, unknown> = {};
    if (search) {
      where[Op.or as unknown as string] = [{ emailAttempted: { [Op.iLike]: `%${search}%` } }, { ipAddress: { [Op.iLike]: `%${search}%` } }];
    }

    const { rows, count } = await LoginLog.findAndCountAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { items: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
  },

  listActivityLogs: async ({ page, pageSize, search }: ListParams) => {
    const where: Record<string | symbol, unknown> = {};
    if (search) where.action = { [Op.iLike]: `%${search}%` };

    const { rows, count } = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { items: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
  },
};
