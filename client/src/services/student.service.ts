import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type {
  CreateStudentInput,
  StudentDetails,
  StudentListResult,
  DocumentType,
  PaymentItem,
  StudentDocumentItem,
  StudentNoteItem,
  TimelineEvent,
  TimelineItem,
} from "@/types/student.types";
import type { ActivityLogItem } from "@/types/logs.types";

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  serviceType?: string;
  status?: string;
  referralPartnerId?: string;
}

export const studentService = {
  list: async (params: ListParams): Promise<StudentListResult> => {
    const { data } = await api.get<ApiResponse<StudentListResult>>("/students", { params });
    return data.data;
  },

  getById: async (id: string): Promise<StudentDetails> => {
    const { data } = await api.get<ApiResponse<StudentDetails>>(`/students/${id}`);
    return data.data;
  },

  create: async (payload: CreateStudentInput, referralPartnerId?: string): Promise<StudentDetails> => {
    const body = referralPartnerId ? { ...payload, referralPartnerId } : payload;
    const { data } = await api.post<ApiResponse<StudentDetails>>("/students", body);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateStudentInput> & { buyingPrice?: number }): Promise<StudentDetails> => {
    const { data } = await api.patch<ApiResponse<StudentDetails>>(`/students/${id}`, payload);
    return data.data;
  },

  addTimelineStage: async (id: string, event: TimelineEvent, note?: string): Promise<TimelineItem> => {
    const { data } = await api.post<ApiResponse<TimelineItem>>(`/students/${id}/timeline-stage`, { event, note });
    return data.data;
  },

  updateTimelineNote: async (studentId: string, timelineId: string, note: string | null): Promise<TimelineItem> => {
    const { data } = await api.patch<ApiResponse<TimelineItem>>(`/students/${studentId}/timeline/${timelineId}`, { note });
    return data.data;
  },

  deleteTimelineEntry: async (studentId: string, timelineId: string): Promise<void> => {
    await api.delete(`/students/${studentId}/timeline/${timelineId}`);
  },

  // V5 NEW: internal notes
  addNote: async (studentId: string, note: string): Promise<StudentNoteItem> => {
    const { data } = await api.post<ApiResponse<StudentNoteItem>>(`/students/${studentId}/notes`, { note });
    return data.data;
  },

  updateNote: async (studentId: string, noteId: string, note: string): Promise<StudentNoteItem> => {
    const { data } = await api.patch<ApiResponse<StudentNoteItem>>(`/students/${studentId}/notes/${noteId}`, { note });
    return data.data;
  },

  deleteNote: async (studentId: string, noteId: string): Promise<void> => {
    await api.delete(`/students/${studentId}/notes/${noteId}`);
  },

  uploadDocument: async (id: string, type: DocumentType, file: File): Promise<StudentDocumentItem> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const { data } = await api.post<ApiResponse<StudentDocumentItem>>(`/students/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  getActivityLogs: async (id: string): Promise<ActivityLogItem[]> => {
    const { data } = await api.get<ApiResponse<ActivityLogItem[]>>(`/students/${id}/activity-logs`);
    return data.data;
  },

  updateCommissionStatus: async (id: string, status: "pending" | "paid"): Promise<void> => {
    await api.patch(`/students/${id}/commission/status`, { status });
  },

  addPayment: async (id: string, amount: number, transactionId?: string): Promise<PaymentItem> => {
    const { data } = await api.post<ApiResponse<PaymentItem>>(`/students/${id}/payments`, { amount, transactionId });
    return data.data;
  },

  updatePaymentStatus: async (id: string, paymentId: string, status: string): Promise<void> => {
    await api.patch(`/students/${id}/payments/${paymentId}/status`, { status });
  },

  getFieldSuggestions: async (
    field: "college" | "university" | "course" | "semester",
    search: string
  ): Promise<string[]> => {
    const { data } = await api.get<ApiResponse<string[]>>("/students/suggestions", {
      params: { field, search },
    });
    return data.data;
  },
};