import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { DashboardStats } from "@/types/dashboard.types";

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return data.data;
  },

  getSuperAdminStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return data.data;
  },
};
