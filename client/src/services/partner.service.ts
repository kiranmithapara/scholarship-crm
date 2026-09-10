import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { PartnerListResult, PartnerProfile, ReferralPartner, CommissionItem, PartnerNoteItem } from "@/types/partner.types";
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

  update: async (id: string, payload: FormData | { fullName?: string; email?: string; mobile?: string; username?: string; password?: string; prepaidCost?: number | string; postpaidCost?: number | string }): Promise<ReferralPartner> => {
    const isFormData = payload instanceof FormData;
    const { data } = await api.patch<ApiResponse<ReferralPartner>>(`/referral-partners/${id}`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data.data;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<void> => {
    await api.patch(`/referral-partners/${id}/status`, { isActive });
  },

  /** Super Admin sets this partner's buying cost for each service type. */
  updatePricing: async (id: string, prepaidCost: number, postpaidCost: number): Promise<void> => {
    await api.patch(`/referral-partners/${id}/pricing`, { prepaidCost, postpaidCost });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/referral-partners/${id}`);
  },

  /** This partner's commissions (one per verified student) */
  getCommissions: async (id: string): Promise<CommissionItem[]> => {
    const { data } = await api.get<ApiResponse<CommissionItem[]>>(`/referral-partners/${id}/commissions`);
    return data.data;
  },

  /** Mark a commission paid/pending */
  updateCommissionStatus: async (partnerId: string, commissionId: string, status: "pending" | "paid"): Promise<void> => {
    await api.patch(`/referral-partners/${partnerId}/commissions/${commissionId}/status`, { status });
  },

  /** Mark all pending commissions as paid for this partner */
  markAllCommissionsPaid: async (partnerId: string): Promise<{ count: number }> => {
    const { data } = await api.patch<ApiResponse<{ count: number }>>(`/referral-partners/${partnerId}/commissions/mark-all-paid`);
    return data.data;
  },

    /** V6 NEW: Partner Notes */
  addNote: async (partnerId: string, note: string): Promise<PartnerNoteItem> => {
    const { data } = await api.post<ApiResponse<PartnerNoteItem>>(`/referral-partners/${partnerId}/notes`, { note });
    return data.data;
  },

  updateNote: async (partnerId: string, noteId: string, note: string): Promise<PartnerNoteItem> => {
    const { data } = await api.patch<ApiResponse<PartnerNoteItem>>(`/referral-partners/${partnerId}/notes/${noteId}`, { note });
    return data.data;
  },

  deleteNote: async (partnerId: string, noteId: string): Promise<void> => {
    await api.delete(`/referral-partners/${partnerId}/notes/${noteId}`);
  },
};