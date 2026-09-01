import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { CreateStudentInput, StudentDetails, StudentListResult, DocumentType, PaymentItem, StudentDocumentItem } from "@/types/student.types";

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  plan?: string;
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

  updateScholarship: async (
    id: string,
    payload: { mysyRegistrationNumber?: string; mysyPassword?: string; scholarshipStatus?: string }
  ): Promise<void> => {
    await api.patch(`/students/${id}/scholarship`, payload);
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

  updatePaymentStatus: async (id: string, paymentId: string, status: string): Promise<void> => {
    await api.patch(`/students/${id}/payments/${paymentId}/status`, { status });
  },
};
