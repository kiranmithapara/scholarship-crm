import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { StickyNote, Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { adminNoteService } from "@/services/adminNote.service";
import { formatDateTime } from "@/lib/utils";
import type { AdminNoteItem } from "@/types/adminNote.types";

/** AdminNotesPage - Super Admin's personal notepad. Notes are private to the logged-in user. */
export default function AdminNotesPage() {
  const [notes, setNotes] = useState<AdminNoteItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminNoteService.list();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load notes"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAdd = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setIsAdding(true);
    try {
      await adminNoteService.create(newNote.trim(), newTitle.trim() || null);
      toast.success("Note added");
      setNewTitle("");
      setNewNote("");
      fetchNotes();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not add note");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    setIsSavingEdit(true);
    try {
      await adminNoteService.update(editingId, editNote.trim(), editTitle.trim() || null);
      toast.success("Note updated");
      setEditingId(null);
      setEditTitle("");
      setEditNote("");
      fetchNotes();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update note");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await adminNoteService.delete(deletingId);
      toast.success("Note deleted");
      setDeletingId(null);
      fetchNotes();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotes = notes?.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.note.toLowerCase().includes(q) || (n.title ?? "").toLowerCase().includes(q);
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load your notes." onRetry={fetchNotes} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">My Notes</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Your personal notepad. These notes are private to you and never visible to referral partners.
        </p>
      </div>

      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add New Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-1.5">
            <Label>Title (optional)</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Follow-ups this week"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              placeholder="Write anything here — reminders, follow-ups, ideas..."
            />
          </div>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleAdd}
            isLoading={isAdding}
            disabled={!newNote.trim()}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Note
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      {notes && notes.length > 0 && (
        <div className="relative sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !filteredNotes || filteredNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={search ? "No notes match your search" : "No notes yet"}
          description={search ? "Try a different search term." : "Add your first note above to get started."}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="transition-shadow hover:shadow-soft-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {note.title && (
                      <p className="text-sm font-semibold text-foreground mb-1">{note.title}</p>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {note.note}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(note.createdAt)}
                      {note.updatedAt !== note.createdAt && " • edited"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit note"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditTitle(note.title ?? "");
                        setEditNote(note.note);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-danger hover:bg-danger/10"
                      title="Delete note"
                      onClick={() => setDeletingId(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Note</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title (optional)</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note title"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={6}
                  placeholder="Enter note..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleSaveEdit}
                  isLoading={isSavingEdit}
                  disabled={!editNote.trim()}
                >
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this note?"
        description="This note will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}