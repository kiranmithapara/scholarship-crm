import { Search, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { formatDateTime } from "@/lib/utils";

const actionLabels: Record<string, string> = {
  LOGIN: "Logged in",
  LOGOUT: "Logged out",
  EMAIL_VERIFIED: "Verified email",
  PASSWORD_CHANGED: "Changed password",
  PROFILE_UPDATED: "Updated profile",
  STUDENT_CREATED: "Created a student application",
  STUDENT_UPDATED: "Updated a student application",
  APPLICATION_VERIFIED: "Verified an application",
  CORRECTION_REQUESTED: "Requested a correction",
  APPLICATION_COMPLETED: "Marked an application completed",
  PARTNER_ACTIVATED: "Activated a referral partner",
  PARTNER_BLOCKED: "Blocked a referral partner",
  PARTNER_UPDATED: "Updated a referral partner",
  SETTINGS_UPDATED: "Updated settings",
  LOGO_UPDATED: "Updated the site logo",
};

/** ActivityLogsPage - Page 13. Super Admin only. "Who did what, when" audit trail. */
export default function ActivityLogsPage() {
  const { data, isLoading, error, setPage, search, setSearch, refetch } = useActivityLogs();

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load activity logs." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activity Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">A full audit trail of actions taken across the system.</p>
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by action..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={History} title="No activity recorded yet" />
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {data.items.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.user.fullName}</span> {actionLabels[log.action] ?? log.action.replace(/_/g, " ").toLowerCase()}
                      </p>
                      {log.ipAddress && <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-4 pt-4">
                <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
