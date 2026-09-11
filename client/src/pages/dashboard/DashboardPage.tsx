import { useEffect, useState, useMemo } from "react";
import {
  Users,
  GraduationCap,
  Wallet,
  Clock,
  CheckCircle2,
  Wallet2,
  FileText,
  UserCircle,
  IndianRupee,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/common/StatCard";
import { PartnerReceiptsChart, type ChartMode } from "@/components/charts/PartnerReceiptsChart";
import { PartnerCommissionBarChart } from "@/components/charts/PartnerCommissionBarChart";
import { CommissionHisabDonut } from "@/components/charts/CommissionHisabDonut";
import { PartnerServicesDonut } from "@/components/charts/PartnerServicesDonut";
import { ApplicationStatusDonut } from "@/components/charts/ApplicationStatusDonut";
import { RevenueDonutChart, GREEN_PALETTE, AMBER_PALETTE } from "@/components/charts/RevenueDonutChart";
import { PostpaidApplicationsDonut } from "@/components/charts/PostpaidApplicationsDonut";
import { RecentStudentsTable } from "@/components/tables/RecentStudentsTable";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/dashboard.service";
import { partnerService } from "@/services/partner.service";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes.constant";
import { ROLES } from "@/constants/roles.constant";
import type { PartnerReceiptsResponse } from "@/types/dashboard.types";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardStats();

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const [period, setPeriod] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [chartMode, setChartMode] = useState<ChartMode>("all");
  const [partners, setPartners] = useState<{ id: string; fullName: string }[]>([]);

  const [receiptsData, setReceiptsData] = useState<PartnerReceiptsResponse | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) return;
    partnerService
      .list({ page: 1, pageSize: 200, status: "all" })
      .then((res) => {
        const sorted = res.items
          .map((p) => ({ id: p.id, fullName: p.fullName }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        setPartners(sorted);
      })
      .catch(() => setPartners([]));
  }, [isSuperAdmin]);

  useEffect(() => {
    setReceiptsLoading(true);
    dashboardService
      .getPartnerReceipts({ period, partnerId: isSuperAdmin ? partnerFilter : undefined })
      .then(setReceiptsData)
      .catch(() => {
        toast.error("Could not load receipts analytics");
        setReceiptsData({
          items: [],
          totals: {
            totalReceipts: 0,
            pendingRevenue: 0,
            paidRevenue: 0,
            totalRevenue: 0,
            paidStudentsCount: 0,
          },
        });
      })
      .finally(() => setReceiptsLoading(false));
  }, [isSuperAdmin, period, partnerFilter]);

  const activeSummary = useMemo(() => {
    if (!receiptsData) {
      return { pending: 0, paid: 0, total: 0, labelPrefix: "" };
    }
    if (chartMode === "prepaid") {
      const pending = receiptsData.totals.prepaidPendingRevenue ?? 0;
      const paid = receiptsData.totals.prepaidPaidRevenue ?? 0;
      return {
        pending,
        paid,
        total: pending + paid,
        labelPrefix: "Prepaid ",
      };
    }
    if (chartMode === "postpaid") {
      const pending = receiptsData.totals.postpaidPendingRevenue ?? 0;
      const paid = receiptsData.totals.postpaidPaidRevenue ?? 0;
      return {
        pending,
        paid,
        total: pending + paid,
        labelPrefix: "Postpaid ",
      };
    }
    return {
      pending: receiptsData.totals.pendingRevenue,
      paid: receiptsData.totals.paidRevenue,
      total: receiptsData.totals.totalRevenue,
      labelPrefix: "",
    };
  }, [receiptsData, chartMode]);

  // Specific partner receipt item for referral admin role
  const partnerReceipt = useMemo(() => {
    if (isSuperAdmin) return null;
    return receiptsData?.items?.[0] ?? null;
  }, [isSuperAdmin, receiptsData]);

  // Referral Partner Commission Summary
  const partnerCommissionSummary = useMemo(() => {
    if (isSuperAdmin) {
      return { pending: 0, paid: 0, total: 0, labelPrefix: "" };
    }
    const item = partnerReceipt;
    let pending = item ? item.pendingCommission ?? 0 : (cards?.commission?.pending ?? 0);
    let paid = item ? item.paidCommission ?? 0 : (cards?.commission?.paid ?? 0);
    let labelPrefix = "";

    if (chartMode === "prepaid") {
      pending = item ? item.prepaidPendingCommission ?? 0 : (cards?.prepaidCommission?.pending ?? 0);
      paid = item ? item.prepaidPaidCommission ?? 0 : (cards?.prepaidCommission?.paid ?? 0);
      labelPrefix = "Prepaid ";
    } else if (chartMode === "postpaid") {
      pending = item ? item.postpaidPendingCommission ?? 0 : (cards?.postpaidCommission?.pending ?? 0);
      paid = item ? item.postpaidPaidCommission ?? 0 : (cards?.postpaidCommission?.paid ?? 0);
      labelPrefix = "Postpaid ";
    }

    return {
      pending,
      paid,
      total: pending + paid,
      labelPrefix,
    };
  }, [isSuperAdmin, partnerReceipt, cards, chartMode]);

  // Referral Partner Bar Chart Data
  const partnerBarChartData = useMemo(() => {
    const item = partnerReceipt;
    return {
      prepaid: {
        pending: item ? item.prepaidPendingCommission ?? 0 : (cards?.prepaidCommission?.pending ?? 0),
        paid: item ? item.prepaidPaidCommission ?? 0 : (cards?.prepaidCommission?.paid ?? 0),
        total: item
          ? (item.prepaidPendingCommission ?? 0) + (item.prepaidPaidCommission ?? 0)
          : (cards?.prepaidCommission?.total ?? 0),
        students: item ? item.prepaidCount : (cards?.prepaidCount ?? 0),
        paidStudents: item ? item.prepaidPaidStudentsCount ?? 0 : 0,
      },
      postpaid: {
        pending: item ? item.postpaidPendingCommission ?? 0 : (cards?.postpaidCommission?.pending ?? 0),
        paid: item ? item.postpaidPaidCommission ?? 0 : (cards?.postpaidCommission?.paid ?? 0),
        total: item
          ? (item.postpaidPendingCommission ?? 0) + (item.postpaidPaidCommission ?? 0)
          : (cards?.postpaidCommission?.total ?? 0),
        students: item ? item.postpaidCount : (cards?.postpaidCount ?? 0),
        paidStudents: item ? item.postpaidPaidStudentsCount ?? 0 : 0,
      },
    };
  }, [partnerReceipt, cards]);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load your dashboard stats." onRetry={refetch} />
      </div>
    );
  }

  const cards = data?.cards;

  return (
    <div className="space-y-6 p-3 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {user?.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Here's what's happening across your scholarship program."
            : "Here's an overview of your referred students and earned commissions."}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin ? (
          <>
            <StatCard label="Referral Partners" value={cards?.totalReferralPartners ?? 0} icon={Users} isLoading={isLoading} tone="primary" />
            <StatCard label="Total Students" value={cards?.totalStudents ?? 0} icon={GraduationCap} isLoading={isLoading} tone="primary" />
            <StatCard label="Prepaid Applications" value={cards?.prepaidCount ?? 0} icon={Wallet} isLoading={isLoading} tone="primary" />
            <StatCard label="Postpaid Applications" value={cards?.postpaidCount ?? 0} icon={Wallet2} isLoading={isLoading} tone="primary" />
            <StatCard label="Pending Applications" value={cards?.pendingCount ?? 0} icon={Clock} isLoading={isLoading} tone="warning" />
            <StatCard label="Completed Applications" value={cards?.completedCount ?? 0} icon={CheckCircle2} isLoading={isLoading} tone="success" />
            <StatCard label="Prepaid Revenue (Pending)" value={cards?.adminRevenue?.prepaid?.pending ?? 0} icon={Wallet} isLoading={isLoading} tone="warning" prefix="₹" />
            <StatCard label="Prepaid Revenue (Received)" value={cards?.adminRevenue?.prepaid?.paid ?? 0} icon={Wallet} isLoading={isLoading} tone="success" prefix="₹" />
            <StatCard label="Postpaid Revenue (Pending)" value={cards?.adminRevenue?.postpaid?.pending ?? 0} icon={Wallet2} isLoading={isLoading} tone="warning" prefix="₹" />
            <StatCard label="Postpaid Revenue (Received)" value={cards?.adminRevenue?.postpaid?.paid ?? 0} icon={Wallet2} isLoading={isLoading} tone="success" prefix="₹" />
            <StatCard label="Total Revenue (Pending)" value={cards?.adminRevenue?.pending ?? 0} icon={IndianRupee} isLoading={isLoading} tone="warning" prefix="₹" />
            <StatCard label="Total Revenue (Received)" value={cards?.adminRevenue?.paid ?? 0} icon={IndianRupee} isLoading={isLoading} tone="success" prefix="₹" />
          </>
        ) : (
          <>
            <StatCard label="My Students" value={cards?.totalStudents ?? 0} icon={GraduationCap} isLoading={isLoading} tone="primary" />
            <StatCard label="Prepaid Applications" value={cards?.prepaidCount ?? 0} icon={Wallet} isLoading={isLoading} tone="primary" />
            <StatCard label="Postpaid Applications" value={cards?.postpaidCount ?? 0} icon={Wallet2} isLoading={isLoading} tone="primary" />
            <StatCard label="Pending Applications" value={cards?.pendingCount ?? 0} icon={Clock} isLoading={isLoading} tone="warning" />
            <StatCard label="Completed Applications" value={cards?.completedCount ?? 0} icon={CheckCircle2} isLoading={isLoading} tone="success" />
            <StatCard label="My Commission (Pending)" value={cards?.commission?.pending ?? 0} icon={Clock} isLoading={isLoading} tone="warning" prefix="₹" />
            <StatCard label="My Commission (Paid)" value={cards?.commission?.paid ?? 0} icon={CheckCircle2} isLoading={isLoading} tone="success" prefix="₹" />
            <StatCard label="Total Commission" value={cards?.commission?.total ?? 0} icon={Wallet2} isLoading={isLoading} tone="primary" prefix="₹" />
          </>
        )}
      </div>

      {/* Super Admin Receipts section */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" /> Receipts Analytics
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Revenue breakdown across referral partners.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="All Partners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary mini cards */}
          {receiptsData && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {activeSummary.labelPrefix ? `${activeSummary.labelPrefix}Pending Revenue` : "Pending Revenue"}
                    </p>
                    <p className="text-lg font-semibold text-foreground truncate">
                      {formatCurrency(activeSummary.pending)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {activeSummary.labelPrefix ? `${activeSummary.labelPrefix}Paid Revenue` : "Paid Revenue"}
                    </p>
                    <p className="text-lg font-semibold text-foreground truncate">
                      {formatCurrency(activeSummary.paid)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary shrink-0">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {activeSummary.labelPrefix ? `${activeSummary.labelPrefix}Total Revenue` : "Total Revenue"}
                    </p>
                    <p className="text-lg font-semibold text-foreground truncate">
                      {formatCurrency(activeSummary.total)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bar chart + Paid donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 min-w-0">
              <PartnerReceiptsChart
                data={receiptsData?.items ?? []}
                isLoading={receiptsLoading}
                mode={chartMode}
                onModeChange={setChartMode}
              />
            </div>
            <div className="lg:col-span-1 min-w-0">
              <RevenueDonutChart
                title={
                  chartMode === "prepaid"
                    ? "Prepaid Paid Revenue Split"
                    : chartMode === "postpaid"
                    ? "Postpaid Paid Revenue Split"
                    : "Paid Revenue Split"
                }
                items={(receiptsData?.items ?? []).map((p) => ({
                  name: p.partnerName,
                  value:
                    chartMode === "prepaid"
                      ? p.prepaidPaidRevenue ?? 0
                      : chartMode === "postpaid"
                      ? p.postpaidPaidRevenue ?? 0
                      : p.paidRevenue,
                  students:
                    chartMode === "prepaid"
                      ? p.prepaidPaidStudentsCount ?? 0
                      : chartMode === "postpaid"
                      ? p.postpaidPaidStudentsCount ?? 0
                      : p.paidStudentsCount,
                }))}
                total={activeSummary.paid}
                totalLabel={
                  chartMode === "prepaid"
                    ? "Prepaid Paid"
                    : chartMode === "postpaid"
                    ? "Postpaid Paid"
                    : "Total Paid"
                }
                studentsCount={
                  chartMode === "prepaid"
                    ? receiptsData?.totals.prepaidPaidStudentsCount ?? 0
                    : chartMode === "postpaid"
                    ? receiptsData?.totals.postpaidPaidStudentsCount ?? 0
                    : receiptsData?.totals.paidStudentsCount ?? 0
                }
                emptyTitle="No paid revenue yet"
                emptyDescription="When partner commissions are marked as paid, the split will appear here."
                palette={GREEN_PALETTE}
                isLoading={receiptsLoading}
              />
            </div>
          </div>

          {/* Pending donut + Postpaid applications donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <RevenueDonutChart
                title={
                  chartMode === "prepaid"
                    ? "Prepaid Pending Revenue Split"
                    : chartMode === "postpaid"
                    ? "Postpaid Pending Revenue Split"
                    : "Pending Revenue Split"
                }
                items={(receiptsData?.items ?? []).map((p) => ({
                  name: p.partnerName,
                  value:
                    chartMode === "prepaid"
                      ? p.prepaidPendingRevenue ?? 0
                      : chartMode === "postpaid"
                      ? p.postpaidPendingRevenue ?? 0
                      : p.pendingRevenue,
                }))}
                total={activeSummary.pending}
                totalLabel={
                  chartMode === "prepaid"
                    ? "Prepaid Pending"
                    : chartMode === "postpaid"
                    ? "Postpaid Pending"
                    : "Total Pending"
                }
                emptyTitle="No pending revenue"
                emptyDescription="Pending receipts will appear here."
                palette={AMBER_PALETTE}
                isLoading={receiptsLoading}
              />
            </div>
            <div className="min-w-0">
              <PostpaidApplicationsDonut data={receiptsData?.items ?? []} isLoading={receiptsLoading} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Referral Partner Commission & Hisab Analytics Section */}
      {!isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" /> Commission & Earnings Analytics
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Complete graphical hisab of your earnings, paid commissions, and application distribution.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary mini cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {partnerCommissionSummary.labelPrefix
                      ? `${partnerCommissionSummary.labelPrefix}Pending Commission`
                      : "Pending Commission (Baki)"}
                  </p>
                  <p className="text-lg font-semibold text-foreground truncate">
                    {formatCurrency(partnerCommissionSummary.pending)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {partnerCommissionSummary.labelPrefix
                      ? `${partnerCommissionSummary.labelPrefix}Paid Commission`
                      : "Paid Commission (Mil Chuka)"}
                  </p>
                  <p className="text-lg font-semibold text-foreground truncate">
                    {formatCurrency(partnerCommissionSummary.paid)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary shrink-0">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {partnerCommissionSummary.labelPrefix
                      ? `${partnerCommissionSummary.labelPrefix}Total Earnings`
                      : "Total Earnings (Kul Kamai)"}
                  </p>
                  <p className="text-lg font-semibold text-foreground truncate">
                    {formatCurrency(partnerCommissionSummary.total)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart + Commission Hisab Donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 min-w-0">
              <PartnerCommissionBarChart
                data={partnerBarChartData}
                isLoading={receiptsLoading || isLoading}
                mode={chartMode}
                onModeChange={setChartMode}
              />
            </div>
            <div className="lg:col-span-1 min-w-0">
              <CommissionHisabDonut
                title="Commission Hisab Split"
                paid={partnerCommissionSummary.paid}
                pending={partnerCommissionSummary.pending}
                paidStudents={partnerReceipt ? partnerReceipt.paidStudentsCount : (cards?.completedCount ?? 0)}
                pendingStudents={
                  (cards?.totalStudents ?? 0) -
                  (partnerReceipt ? partnerReceipt.paidStudentsCount : (cards?.completedCount ?? 0))
                }
                isLoading={receiptsLoading || isLoading}
              />
            </div>
          </div>

          {/* Services Donut + Application Status Donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <PartnerServicesDonut
                title="Service Applications Split"
                prepaidCount={partnerReceipt ? partnerReceipt.prepaidCount : (cards?.prepaidCount ?? 0)}
                postpaidCount={partnerReceipt ? partnerReceipt.postpaidCount : (cards?.postpaidCount ?? 0)}
                prepaidCommission={
                  partnerReceipt
                    ? (partnerReceipt.prepaidPendingCommission ?? 0) +
                      (partnerReceipt.prepaidPaidCommission ?? 0)
                    : (cards?.prepaidCommission?.total ?? 0)
                }
                postpaidCommission={
                  partnerReceipt
                    ? (partnerReceipt.postpaidPendingCommission ?? 0) +
                      (partnerReceipt.postpaidPaidCommission ?? 0)
                    : (cards?.postpaidCommission?.total ?? 0)
                }
                isLoading={receiptsLoading || isLoading}
              />
            </div>
            <div className="min-w-0">
              <ApplicationStatusDonut
                title="Application Status Split"
                completed={cards?.statusCounts?.completed ?? cards?.completedCount ?? 0}
                verified={cards?.statusCounts?.verified ?? 0}
                pending={cards?.statusCounts?.pending ?? cards?.pendingCount ?? 0}
                correctionRequested={cards?.statusCounts?.correctionRequested ?? 0}
                isLoading={isLoading}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Students + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          <RecentStudentsTable students={data?.recentStudents ?? []} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1 min-w-0 space-y-3 rounded-lg border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
          {isSuperAdmin ? (
            <>
              <Button asChild variant="gradient" className="w-full justify-start">
                <Link to={ROUTES.REFERRAL_PARTNERS}>
                  <Users className="mr-2 h-4 w-4" /> View Referral Partners
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={ROUTES.STUDENTS}>
                  <GraduationCap className="mr-2 h-4 w-4" /> View All Students
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={ROUTES.SETTINGS}>
                  <IndianRupee className="mr-2 h-4 w-4" /> Total Revenue: {formatCurrency(cards?.adminRevenue?.total ?? ((cards?.adminRevenue?.pending ?? 0) + (cards?.adminRevenue?.paid ?? 0)))}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="gradient" className="w-full justify-start">
                <Link to={ROUTES.APPLY_SCHOLARSHIP}>
                  <FileText className="mr-2 h-4 w-4" /> Apply Scholarship
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={ROUTES.MY_STUDENTS}>
                  <GraduationCap className="mr-2 h-4 w-4" /> My Students
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={ROUTES.PROFILE}>
                  <UserCircle className="mr-2 h-4 w-4" /> My Profile
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}