import { AdminNote, User } from "@/models";
import { ApiError } from "@/utils/apiError";

export const adminNoteService = {
  /** List all notes for the logged-in user (typically Super Admin). */
  list: async (userId: string) => {
    return AdminNote.findAll({
      where: { userId },
      include: [{ model: User, as: "owner", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
    });
  },

  /** Create a new personal note. */
  create: async (userId: string, note: string, title?: string | null) => {
    return AdminNote.create({
      userId,
      note: note.trim(),
      title: title?.trim() || null,
    });
  },

  /** Update an existing note (only if owned by the user). */
  update: async (noteId: string, userId: string, note: string, title?: string | null) => {
    const entry = await AdminNote.findOne({ where: { id: noteId, userId } });
    if (!entry) throw ApiError.notFound("Note not found");

    await entry.update({
      note: note.trim(),
      title: title !== undefined ? (title?.trim() || null) : entry.title,
    });
    return entry;
  },

  /** Delete a note (only if owned by the user). */
  delete: async (noteId: string, userId: string) => {
    const entry = await AdminNote.findOne({ where: { id: noteId, userId } });
    if (!entry) throw ApiError.notFound("Note not found");
    await entry.destroy();
  },
};