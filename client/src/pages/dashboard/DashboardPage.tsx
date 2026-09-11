import { useEffect, useState } from "react";
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
import { PartnerReceiptsChart } from "@/components/charts/PartnerReceiptsChart";
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
    if (!isSuperAdmin) return;
    setReceiptsLoading(true);
    dashboardService
      .getPartnerReceipts({ period, partnerId: partnerFilter })
      .then(setReceiptsData)
      .catch(() => {
        toast.error("Could not load partner receipts");
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

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load your dashboard stats." onRetry={refetch} />
      </div>
    );
  }

  const cards = data?.cards;

  return (
    <div className="space-y-6 p-4 sm:p-6">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <StatCard label="Referral Partners" value={cards?.totalReferralPartners ?? 0} icon={Users} isLoading={isLoading} tone="primary" />
        )}
        <StatCard label={isSuperAdmin ? "Total Students" : "My Students"} value={cards?.totalStudents ?? 0} icon={GraduationCap} isLoading={isLoading} tone="primary" />
        <StatCard label="Prepaid Service" value={cards?.prepaidCount ?? 0} icon={Wallet} isLoading={isLoading} tone="primary" />
        <StatCard label="Postpaid Service" value={cards?.postpaidCount ?? 0} icon={Wallet2} isLoading={isLoading} tone="primary" />
        <StatCard label="Pending Applications" value={cards?.pendingCount ?? 0} icon={Clock} isLoading={isLoading} tone="warning" />
        <StatCard label="Completed" value={cards?.completedCount ?? 0} icon={CheckCircle2} isLoading={isLoading} tone="success" />
        <StatCard label="Commission (Pending)" value={cards?.commission.pending ?? 0} icon={Wallet} isLoading={isLoading} tone="warning" prefix="₹" />
        <StatCard label="Commission (Paid)" value={cards?.commission.paid ?? 0} icon={Wallet2} isLoading={isLoading} tone="success" prefix="₹" />
        {isSuperAdmin && (
          <>
            <StatCard label="My Revenue (Pending)" value={cards?.adminRevenue.pending ?? 0} icon={IndianRupee} isLoading={isLoading} tone="warning" prefix="₹" />
            <StatCard label="My Revenue (Received)" value={cards?.adminRevenue.paid ?? 0} icon={IndianRupee} isLoading={isLoading} tone="success" prefix="₹" />
          </>
        )}
      </div>

      {/* Receipts section */}
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
            <div className="flex flex-wrap gap-2">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending Revenue</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(receiptsData.totals.pendingRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Paid Revenue</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(receiptsData.totals.paidRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(receiptsData.totals.totalRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bar chart + Paid donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PartnerReceiptsChart data={receiptsData?.items ?? []} isLoading={receiptsLoading} />
            </div>
            <div className="lg:col-span-1">
              <RevenueDonutChart
                title="Paid Revenue Split"
                items={(receiptsData?.items ?? []).map((p) => ({
                  name: p.partnerName,
                  value: p.paidRevenue,
                  students: p.paidStudentsCount,
                }))}
                total={receiptsData?.totals.paidRevenue ?? 0}
                totalLabel="Total Paid"
                studentsCount={receiptsData?.totals.paidStudentsCount ?? 0}
                emptyTitle="No paid revenue yet"
                emptyDescription="When partner commissions are marked as paid, the split will appear here."
                palette={GREEN_PALETTE}
                isLoading={receiptsLoading}
              />
            </div>
          </div>

          {/* Pending donut + Postpaid applications donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RevenueDonutChart
              title="Pending Revenue Split"
              items={(receiptsData?.items ?? []).map((p) => ({
                name: p.partnerName,
                value: p.pendingRevenue,
              }))}
              total={receiptsData?.totals.pendingRevenue ?? 0}
              totalLabel="Total Pending"
              emptyTitle="No pending revenue"
              emptyDescription="Pending prepaid receipts will appear here."
              palette={AMBER_PALETTE}
              isLoading={receiptsLoading}
            />
            <PostpaidApplicationsDonut data={receiptsData?.items ?? []} isLoading={receiptsLoading} />
          </div>
        </motion.div>
      )}

      {/* Recent Students + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentStudentsTable students={data?.recentStudents ?? []} isLoading={isLoading} />
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-soft">
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
                  <Wallet className="mr-2 h-4 w-4" /> Total Commission: {formatCurrency(cards?.commission.total ?? 0)}
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