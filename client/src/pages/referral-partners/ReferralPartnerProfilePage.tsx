import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { GraduationCap, Clock, CheckCircle2, ArrowLeft, IndianRupee, Save, Trash2, Wallet, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/FormInput";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { partnerService } from "@/services/partner.service";
import { getInitials, formatCurrency, formatDate } from "@/lib/utils";
import { ROUTES, buildPath } from "@/constants/routes.constant";
import type { CommissionItem } from "@/types/partner.types";

/** ReferralPartnerProfilePage - Page 5. Partner details, service-type/commission breakdown,
 * pricing editor (V2 NEW - only Super Admin can set a partner's buying cost), full student list. */
export default function ReferralPartnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePartnerProfile(id);

  const [prepaidCost, setPrepaidCost] = useState("");
  const [postpaidCost, setPostpaidCost] = useState("");
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // V3 NEW: per-partner commission list + mark-as-paid state (fixes the missing "paid" action)
  const [commissions, setCommissions] = useState<CommissionItem[] | null>(null);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [updatingCommissionId, setUpdatingCommissionId] = useState<string | null>(null);

  const fetchCommissions = () => {
    if (!id) return;
    setCommissionsLoading(true);
    partnerService
      .getCommissions(id)
      .then(setCommissions)
      .catch(() => setCommissions([]))
      .finally(() => setCommissionsLoading(false));
  };

  useEffect(() => {
    if (!data) return;
    setPrepaidCost(data.partner.prepaidCost ?? "");
    setPostpaidCost(data.partner.postpaidCost ?? "");
  }, [data]);

  useEffect(fetchCommissions, [id]);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load this partner's profile." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !data || !id) {
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

  const handleSavePricing = async () => {
    const prepaid = Number(prepaidCost);
    const postpaid = Number(postpaidCost);
    if (Number.isNaN(prepaid) || Number.isNaN(postpaid) || prepaid < 0 || postpaid < 0) {
      toast.error("Enter valid, non-negative prices for both service types");
      return;
    }
    setIsSavingPricing(true);
    try {
      await partnerService.updatePricing(id, prepaid, postpaid);
      toast.success("Pricing updated successfully");
      refetch();
    } catch {
      toast.error("Could not update pricing");
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await partnerService.delete(id);
      toast.success("Referral partner deleted successfully");
      navigate(ROUTES.REFERRAL_PARTNERS);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not delete referral partner");
      setIsDeleting(false);
    }
  };

  /** V3 NEW: toggles a commission between pending/paid - this is the fix for the previously-missing action. */
  const handleToggleCommission = async (commission: CommissionItem) => {
    if (!id) return;
    const nextStatus = commission.status === "pending" ? "paid" : "pending";
    setUpdatingCommissionId(commission.id);
    try {
      await partnerService.updateCommissionStatus(id, commission.id, nextStatus);
      toast.success(`Commission marked as ${nextStatus}`);
      fetchCommissions();
      refetch(); // also refresh the Commission Pending/Paid summary cards above
    } catch {
      toast.error("Could not update commission status");
    } finally {
      setUpdatingCommissionId(null);
    }
  };

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
          <div className="flex items-center gap-2">
            <QuickActions mobile={partner.mobile} whatsappMessage={`Hi ${partner.fullName}, `} />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsConfirmDeleteOpen(true)}
              disabled={students.length > 0}
              title={students.length > 0 ? "Cannot delete - this partner has students on record" : "Delete partner"}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Partner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">Prepaid Students</p>
            <p className="text-xl font-semibold text-foreground">{stats.prepaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">Postpaid Students</p>
            <p className="text-xl font-semibold text-foreground">{stats.postpaidCount}</p>
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

      {/* V2 NEW: Pricing editor - only Super Admin sets what this partner PAYS per service type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" /> Partner Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-4 text-xs text-muted-foreground">
            The buying (cost) price this partner pays per service type. This becomes the reference cost when they add a new student -
            their profit is automatically calculated as Selling Price minus this Buying Price.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Prepaid Service Cost (₹)"
              type="number"
              value={prepaidCost}
              onChange={(e) => setPrepaidCost(e.target.value)}
              placeholder="e.g. 2000"
            />
            <FormInput
              label="Postpaid Service Cost (₹)"
              type="number"
              value={postpaidCost}
              onChange={(e) => setPostpaidCost(e.target.value)}
              placeholder="e.g. 4000"
            />
          </div>
          <Button variant="gradient" size="sm" className="mt-4" onClick={handleSavePricing} isLoading={isSavingPricing}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save Pricing
          </Button>
        </CardContent>
      </Card>

      {/* V3 NEW: Commissions list - shows exactly what's owed per student, with a Mark as Paid
          action. This is the fix for the previously-missing pending->paid workflow. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Commissions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {commissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <EmptyState icon={Wallet} title="No commissions yet" description="Commissions are created automatically once an application is verified." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Service Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                      <td className="py-3">
                        <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: commission.student.id })} className="font-medium text-foreground hover:text-primary">
                          {commission.student.fullName}
                        </Link>
                      </td>
                      <td className="py-3 capitalize text-muted-foreground">{commission.student.serviceType}</td>
                      <td className="py-3 font-medium text-foreground">{formatCurrency(Number(commission.amount))}</td>
                      <td className="py-3">
                        <StatusBadge status={commission.status} />
                        {commission.paidAt && <p className="mt-0.5 text-xs text-muted-foreground">Paid {formatDate(commission.paidAt)}</p>}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant={commission.status === "pending" ? "gradient" : "outline"}
                          size="sm"
                          onClick={() => handleToggleCommission(commission)}
                          isLoading={updatingCommissionId === commission.id}
                        >
                          {commission.status === "pending" ? (
                            <>
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark as Paid
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Revert to Pending
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
                    <th className="pb-2 font-medium">Service Type</th>
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
                      <td className="py-3 capitalize text-muted-foreground">{student.serviceType}</td>
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

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title={`Delete ${partner.fullName}?`}
        description={
          students.length > 0
            ? `${partner.fullName} has ${students.length} student record(s). Student data is preserved permanently and cannot be deleted - block this partner instead to prevent further access.`
            : `This will permanently delete ${partner.fullName}'s account. This partner has no students on record, so this action is safe and cannot be undone.`
        }
        confirmLabel="Delete Partner"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeletePartner}
      />
    </div>
  );
}
