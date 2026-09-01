import { useParams, Link } from "react-router-dom";
import { GraduationCap, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { Badge } from "@/components/ui/badge";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { getInitials, formatCurrency, formatDate } from "@/lib/utils";
import { ROUTES, buildPath } from "@/constants/routes.constant";

/** ReferralPartnerProfilePage - Page 5. Partner details, plan/commission breakdown, full student list. */
export default function ReferralPartnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = usePartnerProfile(id);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load this partner's profile." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { partner, stats, students } = data;

  return (
    <div className="space-y-6 p-6">
      <Link to={ROUTES.REFERRAL_PARTNERS} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Referral Partners
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={partner.photoUrl ?? undefined} alt={partner.fullName} />
              <AvatarFallback className="text-lg">{getInitials(partner.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{partner.fullName}</h1>
                <Badge variant={partner.isActive ? "success" : "danger"}>{partner.isActive ? "Active" : "Blocked"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{partner.email}</p>
              <p className="text-sm text-muted-foreground">Joined {formatDate(partner.createdAt)}</p>
            </div>
          </div>
          <QuickActions mobile={partner.mobile} whatsappMessage={`Hi ${partner.fullName}, `} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">₹2500 Plan Students</p>
            <p className="text-xl font-semibold text-foreground">{stats.plan2500Count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">₹5000 Plan Students</p>
            <p className="text-xl font-semibold text-foreground">{stats.plan5000Count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">Commission Pending</p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(stats.commission.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">Commission Paid</p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(stats.commission.paid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Student list */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {students.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No students yet" description="This partner hasn't added any students." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">College</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                      <td className="py-3">
                        <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })} className="font-medium text-foreground hover:text-primary">
                          {student.fullName}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{student.collegeName}</td>
                      <td className="py-3 text-muted-foreground">₹{student.plan}</td>
                      <td className="py-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="py-3">
                        <QuickActions mobile={student.mobile} whatsappMessage={`Hi ${student.fullName}, `} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
