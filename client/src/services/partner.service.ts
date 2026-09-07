import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { PartnerListResult, PartnerProfile, ReferralPartner } from "@/types/partner.types";

export const partnerService = {
  list: async (params: { page: number; pageSize: number; search?: string; status?: string }): Promise<PartnerListResult> => {
    const { data } = await api.get<ApiResponse<PartnerListResult>>("/referral-partners", { params });
    return data.data;
  },

  getProfile: async (id: string): Promise<PartnerProfile> => {
    const { data } = await api.get<ApiResponse<PartnerProfile>>(`/referral-partners/${id}`);
    return data.data;
  },

  create: async (formData: FormData): Promise<ReferralPartner> => {
    const { data } = await api.post<ApiResponse<ReferralPartner>>("/referral-partners", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<void> => {
    await api.patch(`/referral-partners/${id}/status`, { isActive });
  },

  /** V2 NEW: Super Admin sets this partner's buying cost for each service type. */
  updatePricing: async (id: string, prepaidCost: number, postpaidCost: number): Promise<void> => {
    await api.patch(`/referral-partners/${id}/pricing`, { prepaidCost, postpaidCost });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/referral-partners/${id}`);
  },
};
