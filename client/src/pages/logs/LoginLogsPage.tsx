import { Search, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { useLoginLogs } from "@/hooks/useLoginLogs";
import { formatDateTime } from "@/lib/utils";

/** LoginLogsPage - Page 12. Super Admin only. Every login attempt, success or failed. */
export default function LoginLogsPage() {
  const { data, isLoading, error, setPage, search, setSearch, refetch } = useLoginLogs();

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load login logs." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Login Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every login attempt across the system.</p>
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by email or IP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <EmptyState icon={ScrollText} title="No login attempts found" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">IP Address</th>
                      <th className="px-4 py-3 font-medium">Browser</th>
                      <th className="px-4 py-3 font-medium">Device</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((log) => (
                      <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                        <td className="px-6 py-3">
                          <p className="font-medium text-foreground">{log.user?.fullName ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{log.emailAttempted}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{log.ipAddress}</td>
                        <td className="px-4 py-3 text-muted-foreground">{log.browser ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{log.device ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={log.status === "success" ? "success" : "danger"}>{log.status === "success" ? "Success" : "Failed"}</Badge>
                          {log.failureReason && <p className="mt-0.5 text-xs text-muted-foreground">{log.failureReason}</p>}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{formatDateTime(log.createdAt)}</td>
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
    </div>
  );
}
