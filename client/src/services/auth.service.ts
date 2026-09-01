import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types/auth.types";

/**
 * Auth service - saare authentication related API calls yaha centralize hain.
 * Pages/components kabhi bhi directly axios call nahi karte, hamesha service ke through.
 */
export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return data.data;
  },

  register: async (payload: RegisterPayload): Promise<{ email: string }> => {
    const { data } = await api.post<ApiResponse<{ email: string }>>("/auth/register", payload);
    return data.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/verify-otp", { email, otp });
    return data.data;
  },

  resendOtp: async (email: string): Promise<void> => {
    await api.post("/auth/resend-otp", { email });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await api.post("/auth/reset-password", { email, otp, newPassword });
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post("/auth/change-password", { currentPassword, newPassword, confirmNewPassword: newPassword });
  },
};
