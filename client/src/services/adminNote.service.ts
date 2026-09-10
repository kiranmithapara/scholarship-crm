import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { AdminNoteItem } from "@/types/adminNote.types";

export const adminNoteService = {
  list: async (): Promise<AdminNoteItem[]> => {
    const { data } = await api.get<ApiResponse<AdminNoteItem[]>>("/admin-notes");
    return data.data;
  },

  create: async (note: string, title?: string | null): Promise<AdminNoteItem> => {
    const { data } = await api.post<ApiResponse<AdminNoteItem>>("/admin-notes", { note, title });
    return data.data;
  },

  update: async (noteId: string, note: string, title?: string | null): Promise<AdminNoteItem> => {
    const { data } = await api.patch<ApiResponse<AdminNoteItem>>(`/admin-notes/${noteId}`, { note, title });
    return data.data;
  },

  delete: async (noteId: string): Promise<void> => {
    await api.delete(`/admin-notes/${noteId}`);
  },
};