export interface AdminNoteItem {
  id: string;
  title: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; fullName: string };
}