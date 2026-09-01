import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { User } from "@/types/auth.types";

export const userService = {
  updateProfile: async (payload: { fullName?: string; mobile?: string }): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>("/users/me", payload);
    return data.data;
  },

  uploadPhoto: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<ApiResponse<User>>("/users/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
};
