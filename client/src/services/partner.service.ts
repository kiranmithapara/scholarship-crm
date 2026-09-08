import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { PartnerListResult, PartnerProfile, ReferralPartner, CommissionItem } from "@/types/partner.types";

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

  /** V3 NEW: this partner's commissions (one per verified student). */
  getCommissions: async (id: string): Promise<CommissionItem[]> => {
    const { data } = await api.get<ApiResponse<CommissionItem[]>>(`/referral-partners/${id}/commissions`);
    return data.data;
  },

  /** V3 NEW: mark a commission paid/pending - fixes the previously-missing action. */
  updateCommissionStatus: async (partnerId: string, commissionId: string, status: "pending" | "paid"): Promise<void> => {
    await api.patch(`/referral-partners/${partnerId}/commissions/${commissionId}/status`, { status });
  },
};
