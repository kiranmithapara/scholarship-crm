import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  Trash2,
  RotateCcw,
  Search,
  Users,
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  Building2,
  Phone,
  UserCheck,
  Calendar,
  Undo2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { studentService } from "@/services/student.service";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constant";

interface DeletedStudentItem {
  id: string;
  fullName: string;
  mobile: string;
  collegeName: string;
  serviceType: "prepaid" | "postpaid";
  status: string;
  createdAt: string;
  deletedAt: string;
  referralPartner?: { id: string; fullName: string; mobile: string };
}

export default function DeletedStudentsPage() {
  const [students, setStudents] = useState<DeletedStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingPermanent, setIsDeletingPermanent] = useState(false);

  const fetchDeleted = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await studentService.getDeletedStudents({ page, pageSize: 12, search: search || undefined });
      setStudents(res.items as any);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load deleted students"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchDeleted, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await studentService.restoreStudent(id);
      toast.success("Student restored successfully");
      fetchDeleted();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not restore student");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deletingId) return;
    setIsDeletingPermanent(true);
    try {
      await studentService.permanentDeleteStudent(deletingId);
      toast.success("Student permanently deleted");
      setDeletingId(null);
      fetchDeleted();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not permanently delete student");
    } finally {
      setIsDeletingPermanent(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load deleted students." onRetry={fetchDeleted} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Back link */}
      <Link
        to={ROUTES.STUDENTS}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Deleted Students
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Students you deleted. Restore them or permanently remove them forever.
            </p>
          </div>
        </div>

        {/* Total count card */}
        <Card className="shrink-0 sm:min-w-[140px]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Deleted</p>
              <p className="text-xl font-semibold text-foreground">{total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
        <div className="text-xs sm:text-sm text-warning-foreground">
          <span className="font-semibold">Heads up:</span> Permanent deletion is irreversible — it will also remove all documents, payments, timeline entries, internal notes, and commission records for that student.
        </div>
      </div>

      {/* Search bar */}
      <div className="relative sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, mobile, or college..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12">
          <EmptyState
            icon={search ? Search : Trash2}
            title={search ? "No matching deleted students" : "No deleted students"}
            description={
              search
                ? "Try a different search term to find what you're looking for."
                : "When you delete a student, they will appear here. You can restore them anytime."
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card
                key={student.id}
                className="overflow-hidden border-danger/20 bg-gradient-to-br from-danger/[0.03] to-transparent transition-shadow hover:shadow-soft-md"
              >
                <CardContent className="p-0">
                  {/* Top strip */}
                  <div className="flex items-center justify-between gap-2 border-b border-danger/10 bg-danger/[0.04] px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-danger">
                      <Trash2 className="h-3 w-3" />
                      Deleted
                    </span>
                    <StatusBadge status={student.status} />
                  </div>

                  {/* Body */}
                  <div className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground" title={student.fullName}>
                          {student.fullName}
                        </p>
                        <p className="truncate text-xs capitalize text-muted-foreground">
                          {student.serviceType} Service
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 rounded-lg bg-muted/30 p-2.5 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate" title={student.collegeName}>
                          {student.collegeName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{student.mobile}</span>
                      </div>
                      {student.referralPartner && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">By {student.referralPartner.fullName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-danger">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Deleted {formatDate(student.deletedAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-9"
                        onClick={() => handleRestore(student.id)}
                        isLoading={restoringId === student.id}
                        disabled={isDeletingPermanent}
                      >
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs h-9"
                        onClick={() => setDeletingId(student.id)}
                        disabled={restoringId === student.id}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Permanent delete confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Permanently delete this student?"
        description="This action CANNOT be undone. All related documents, payments, timeline entries, internal notes, and commission records will also be deleted permanently."
        confirmLabel="Delete Forever"
        variant="destructive"
        isLoading={isDeletingPermanent}
        onConfirm={handlePermanentDelete}
      />
    </div>
  );
}