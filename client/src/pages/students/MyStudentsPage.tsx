import { Link } from "react-router-dom";
import { GraduationCap, Wallet, Clock, CheckCircle2, Users, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { useStudents } from "@/hooks/useStudents";
import { formatDate } from "@/lib/utils";
import { ROUTES, buildPath } from "@/constants/routes.constant";
import { Search } from "lucide-react";

/** MyStudentsPage - Page 9. Referral Admin's own students, card layout. Server already scopes by role. */
export default function MyStudentsPage() {
  const { data, isLoading, error, setPage, search, setSearch, refetch } = useStudents();

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load your students." onRetry={refetch} />
      </div>
    );
  }

  const plan2500 = data?.items.filter((s) => s.plan === "2500").length ?? 0;
  const plan5000 = data?.items.filter((s) => s.plan === "5000").length ?? 0;
  const pending = data?.items.filter((s) => s.status === "pending" || s.status === "correction_requested").length ?? 0;
  const completed = data?.items.filter((s) => s.status === "completed").length ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Students you've referred for scholarships.</p>
        </div>
        <Button asChild variant="gradient">
          <Link to={ROUTES.APPLY_SCHOLARSHIP}>
            <Plus className="mr-2 h-4 w-4" /> Apply Scholarship
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <Users className="mb-2 h-4.5 w-4.5 text-primary" />
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold text-foreground">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Wallet className="mb-2 h-4.5 w-4.5 text-primary" />
            <p className="text-xs text-muted-foreground">₹2500</p>
            <p className="text-lg font-semibold text-foreground">{plan2500}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Wallet className="mb-2 h-4.5 w-4.5 text-primary" />
            <p className="text-xs text-muted-foreground">₹5000</p>
            <p className="text-lg font-semibold text-foreground">{plan5000}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Clock className="mb-2 h-4.5 w-4.5 text-warning" />
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold text-foreground">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <CheckCircle2 className="mb-2 h-4.5 w-4.5 text-success" />
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-lg font-semibold text-foreground">{completed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search your students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 sm:max-w-sm" />
      </div>

      {/* Student cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students yet"
          description="Apply your first scholarship application to get started."
          action={
            <Button asChild variant="gradient" size="sm">
              <Link to={ROUTES.APPLY_SCHOLARSHIP}>
                <Plus className="mr-2 h-4 w-4" /> Apply Scholarship
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((student) => (
              <Card key={student.id} className="transition-shadow hover:shadow-soft-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })} className="font-medium text-foreground hover:text-primary">
                        {student.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{student.collegeName}</p>
                    </div>
                    <StatusBadge status={student.status} />
                  </div>
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>₹{student.plan} Plan</span>
                    <span>•</span>
                    <span>{formatDate(student.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <QuickActions mobile={student.mobile} whatsappMessage={`Hi ${student.fullName}, `} />
                    <Button asChild variant="ghost" size="sm">
                      <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
