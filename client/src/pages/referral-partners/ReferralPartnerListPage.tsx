import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Pencil, Ban, CheckCircle, Users, UserCheck, UserX, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { QuickActions } from "@/components/common/QuickActions";
import { CreatePartnerDialog } from "@/components/partners/CreatePartnerDialog";
import { usePartners } from "@/hooks/usePartners";
import { partnerService } from "@/services/partner.service";
import { getInitials, formatCurrency } from "@/lib/utils";
import { ROUTES, buildPath } from "@/constants/routes.constant";
import type { ReferralPartner } from "@/types/partner.types";

/** ReferralPartnerListPage - Page 4. Table of all referral partners with search, status filter, and row actions. */
export default function ReferralPartnerListPage() {
  const { data, isLoading, error, setPage, search, setSearch, status, setStatus, refetch } = usePartners();
  const [actionTarget, setActionTarget] = useState<ReferralPartner | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleToggleStatus = async () => {
    if (!actionTarget) return;
    setIsUpdating(true);
    try {
      await partnerService.updateStatus(actionTarget.id, !actionTarget.isActive);
      toast.success(`Partner ${actionTarget.isActive ? "blocked" : "activated"} successfully`);
      setActionTarget(null);
      refetch();
    } catch {
      toast.error("Could not update partner status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load referral partners." onRetry={refetch} />
      </div>
    );
  }

  const activeCount = data?.items.filter((p) => p.isActive).length ?? 0;
  const blockedCount = data?.items.filter((p) => !p.isActive).length ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Referral Partners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all referral partners and their performance.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} variant="gradient">
          <UserPlus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Partners</p>
              <p className="text-xl font-semibold text-foreground">{data?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active (this page)</p>
              <p className="text-xl font-semibold text-foreground">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <UserX className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blocked (this page)</p>
              <p className="text-xl font-semibold text-foreground">{blockedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, email or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="No referral partners found" description="Try adjusting your search or filters." />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Partner</th>
                      <th className="px-4 py-3 font-medium">Mobile</th>
                      <th className="px-4 py-3 font-medium">Students</th>
                      <th className="px-4 py-3 font-medium">Commission</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((partner) => (
                      <tr key={partner.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={partner.photoUrl ?? undefined} alt={partner.fullName} />
                              <AvatarFallback>{getInitials(partner.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link to={buildPath(ROUTES.REFERRAL_PARTNER_DETAILS, { id: partner.id })} className="font-medium text-foreground hover:text-primary">
                                {partner.fullName}
                              </Link>
                              <p className="text-xs text-muted-foreground">{partner.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{partner.mobile}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{partner.studentCount}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{formatCurrency(partner.totalCommission)}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={partner.isActive ? "success" : "danger"}>{partner.isActive ? "Active" : "Blocked"}</Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <QuickActions mobile={partner.mobile} whatsappMessage={`Hi ${partner.fullName}, `} />
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link to={buildPath(ROUTES.REFERRAL_PARTNER_DETAILS, { id: partner.id })} aria-label="View">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={statusActionClasses(partner.isActive)}
                              onClick={() => setActionTarget(partner)}
                              aria-label={partner.isActive ? "Block" : "Activate"}
                            >
                              {partner.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 pb-4">
                <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
        title={actionTarget?.isActive ? "Block this partner?" : "Activate this partner?"}
        description={
          actionTarget?.isActive
            ? `${actionTarget?.fullName} will no longer be able to log in or manage students.`
            : `${actionTarget?.fullName} will regain access to their account.`
        }
        confirmLabel={actionTarget?.isActive ? "Block Partner" : "Activate Partner"}
        variant={actionTarget?.isActive ? "destructive" : "default"}
        isLoading={isUpdating}
        onConfirm={handleToggleStatus}
      />

      <CreatePartnerDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refetch}
      />
    </div>
  );
}

// Small local helper to keep the JSX above readable
function statusActionClasses(isActive: boolean): string {
  return isActive ? "h-8 w-8 text-danger hover:bg-danger/10" : "h-8 w-8 text-success hover:bg-success/10";
}
