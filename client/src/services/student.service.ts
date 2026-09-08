import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type {
  CreateStudentInput,
  StudentDetails,
  StudentListResult,
  DocumentType,
  PaymentItem,
  StudentDocumentItem,
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

  create: async (payload: CreateStudentInput): Promise<StudentDetails> => {
    const { data } = await api.post<ApiResponse<StudentDetails>>("/students", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateStudentInput>): Promise<StudentDetails> => {
    const { data } = await api.patch<ApiResponse<StudentDetails>>(`/students/${id}`, payload);
    return data.data;
  },

  verify: async (id: string): Promise<void> => {
    await api.post(`/students/${id}/verify`);
  },

  requestCorrection: async (id: string, note: string): Promise<void> => {
    await api.post(`/students/${id}/request-correction`, { note });
  },

  markCompleted: async (id: string): Promise<void> => {
    await api.post(`/students/${id}/complete`);
  },

  /** V2 NEW: Manually add a scholarship-progress timeline stage (replaces updateScholarship). */
  addTimelineStage: async (id: string, event: TimelineEvent, note?: string): Promise<TimelineItem> => {
    const { data } = await api.post<ApiResponse<TimelineItem>>(`/students/${id}/timeline-stage`, { event, note });
    return data.data;
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

  addPayment: async (id: string, amount: number, transactionId?: string): Promise<PaymentItem> => {
    const { data } = await api.post<ApiResponse<PaymentItem>>(`/students/${id}/payments`, { amount, transactionId });
    return data.data;
  },

  /** V2 NEW: activity log entries scoped to this student, for the Activity Logs tab. */
  getActivityLogs: async (id: string): Promise<ActivityLogItem[]> => {
    const { data } = await api.get<ApiResponse<ActivityLogItem[]>>(`/students/${id}/activity-logs`);
    return data.data;
  },

  updatePaymentStatus: async (id: string, paymentId: string, status: string): Promise<void> => {
    await api.patch(`/students/${id}/payments/${paymentId}/status`, { status });
  },

  /** V2 NEW: Mark a student's commission paid/pending - the button on Student Details. */
  updateCommissionStatus: async (id: string, status: "pending" | "paid"): Promise<void> => {
    await api.patch(`/students/${id}/commission/status`, { status });
  },
};
