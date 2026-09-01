import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { Settings, UpdateSettingsInput } from "@/types/settings.types";

export const settingsService = {
  get: async (): Promise<Settings> => {
    const { data } = await api.get<ApiResponse<Settings>>("/settings");
    return data.data;
  },

  update: async (payload: UpdateSettingsInput): Promise<Settings> => {
    const { data } = await api.patch<ApiResponse<Settings>>("/settings", payload);
    return data.data;
  },

  uploadLogo: async (file: File): Promise<Settings> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<ApiResponse<Settings>>("/settings/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
};
