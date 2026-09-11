import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { DashboardStats, PartnerReceiptsResponse } from "@/types/dashboard.types";

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return data.data;
  },

  // V9 NEW: partner-wise receipts with filters
  getPartnerReceipts: async (params: {
    period: string;
    partnerId?: string;
  }): Promise<PartnerReceiptsResponse> => {
    const { data } = await api.get<ApiResponse<PartnerReceiptsResponse>>("/dashboard/partner-receipts", {
      params,
    });
    return data.data;
  },
};