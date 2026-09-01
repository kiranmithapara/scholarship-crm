import { Users, GraduationCap, Wallet, Clock, CheckCircle2, Wallet2, FileText, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/common/StatCard";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { RecentStudentsTable } from "@/components/tables/RecentStudentsTable";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes.constant";
import { ROLES } from "@/constants/roles.constant";

/** DashboardPage - Role-aware home screen (Super Admin + Referral Partner). */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardStats();

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load your dashboard stats." onRetry={refetch} />
      </div>
    );
  }

  const cards = data?.cards;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {user?.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Here's what's happening across your scholarship program."
            : "Here's an overview of your referred students and earned commissions."}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {isSuperAdmin && (
          <StatCard label="Referral Partners" value={cards?.totalReferralPartners ?? 0} icon={Users} isLoading={isLoading} tone="primary" />
        )}
        <StatCard label={isSuperAdmin ? "Total Students" : "My Students"} value={cards?.totalStudents ?? 0} icon={GraduationCap} isLoading={isLoading} tone="primary" />
        <StatCard label="₹2500 Plan" value={cards?.plan2500Count ?? 0} icon={Wallet} isLoading={isLoading} tone="primary" />
        <StatCard label="₹5000 Plan" value={cards?.plan5000Count ?? 0} icon={Wallet2} isLoading={isLoading} tone="primary" />
        <StatCard label="Pending Applications" value={cards?.pendingCount ?? 0} icon={Clock} isLoading={isLoading} tone="warning" />
        <StatCard label="Completed" value={cards?.completedCount ?? 0} icon={CheckCircle2} isLoading={isLoading} tone="success" />
        <StatCard label="Commission (Pending)" value={cards?.commission.pending ?? 0} icon={Wallet} isLoading={isLoading} tone="warning" prefix="₹" />
        <StatCard label="Commission (Paid)" value={cards?.commission.paid ?? 0} icon={Wallet2} isLoading={isLoading} tone="success" prefix="₹" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyTrendChart title="Monthly Students" data={data?.charts.monthlyStudents ?? []} isLoading={isLoading} colorVar="--primary" />
        <MonthlyTrendChart title="Monthly Applications" data={data?.charts.monthlyApplications ?? []} isLoading={isLoading} colorVar="--success" />
      </div>

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
