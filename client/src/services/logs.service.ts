import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { LoginLogListResult, ActivityLogListResult } from "@/types/logs.types";

export const logsService = {
  listLoginLogs: async (params: { page: number; pageSize: number; search?: string }): Promise<LoginLogListResult> => {
    const { data } = await api.get<ApiResponse<LoginLogListResult>>("/logs/login", { params });
    return data.data;
  },

  listActivityLogs: async (params: { page: number; pageSize: number; search?: string }): Promise<ActivityLogListResult> => {
    const { data } = await api.get<ApiResponse<ActivityLogListResult>>("/logs/activity", { params });
    return data.data;
  },
};
