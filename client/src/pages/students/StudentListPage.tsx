import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, GraduationCap, Wallet, Clock, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { useStudents } from "@/hooks/useStudents";
import { partnerService } from "@/services/partner.service";
import { ROUTES, buildPath } from "@/constants/routes.constant";

/** StudentListPage - Page 6. All students (Super Admin) with search, partner/service-type/status filters, summary cards. */
export default function StudentListPage() {
  const {
    data,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    serviceType,
    setServiceType,
    status,
    setStatus,
    referralPartnerId,
    setReferralPartnerId,
    refetch,
  } = useStudents();

  const [partners, setPartners] = useState<{ id: string; fullName: string }[]>([]);

  useEffect(() => {
    partnerService
      .list({ page: 1, pageSize: 200, status: "all" })
      .then((res) => {
        const sorted = res.items
          .map((p) => ({ id: p.id, fullName: p.fullName }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        setPartners(sorted);
      })
      .catch(() => setPartners([]));
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load the student list." onRetry={refetch} />
      </div>
    );
  }

  const prepaidCount = data?.items.filter((s) => s.serviceType === "prepaid").length ?? 0;
  const postpaidCount = data?.items.filter((s) => s.serviceType === "postpaid").length ?? 0;
  const pending = data?.items.filter((s) => s.status === "pending").length ?? 0;
  const completed = data?.items.filter((s) => s.status === "completed").length ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Students</h1>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">All scholarship applications across every referral partner.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2.5 sm:gap-3 p-3.5 sm:p-5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Prepaid Service</p>
              <p className="text-base sm:text-lg font-semibold text-foreground">{prepaidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2.5 sm:gap-3 p-3.5 sm:p-5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Postpaid Service</p>
              <p className="text-base sm:text-lg font-semibold text-foreground">{postpaidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2.5 sm:gap-3 p-3.5 sm:p-5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Pending</p>
              <p className="text-base sm:text-lg font-semibold text-foreground">{pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2.5 sm:gap-3 p-3.5 sm:p-5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Completed</p>
              <p className="text-base sm:text-lg font-semibold text-foreground">{completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, mobile or college..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Partner Filter */}
        <Select value={referralPartnerId} onValueChange={setReferralPartnerId}>
          <SelectTrigger className="w-full sm:w-48">
            <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="All Referral Partners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Referral Partners</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={serviceType} onValueChange={(v) => setServiceType(v as typeof serviceType)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="prepaid">Prepaid</SelectItem>
            <SelectItem value="postpaid">Postpaid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="correction_requested">Correction Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4 sm:p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState icon={GraduationCap} title="No students found" description="Try adjusting your search or filters." />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-4 sm:px-6 py-3 font-medium">Student</th>
                      <th className="px-3 sm:px-4 py-3 font-medium">College</th>
                      <th className="px-3 sm:px-4 py-3 font-medium">Service Type</th>
                      <th className="px-3 sm:px-4 py-3 font-medium">Referral Partner</th>
                      <th className="px-3 sm:px-4 py-3 font-medium">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((student) => (
                      <tr key={student.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                        <td className="px-4 sm:px-6 py-3.5">
                          <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })} className="font-medium text-foreground hover:text-primary">
                            {student.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{student.mobile}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3.5 text-muted-foreground">{student.collegeName}</td>
                        <td className="px-3 sm:px-4 py-3.5 text-muted-foreground capitalize">{student.serviceType}</td>
                        <td className="px-3 sm:px-4 py-3.5 text-muted-foreground">{student.referralPartner?.fullName ?? "-"}</td>
                        <td className="px-3 sm:px-4 py-3.5">
                          <StatusBadge status={student.status} />
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <QuickActions mobile={student.mobile} whatsappMessage={`Hi ${student.fullName}, `} />
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })} aria-label="View">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 sm:px-6 pb-4">
                <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
