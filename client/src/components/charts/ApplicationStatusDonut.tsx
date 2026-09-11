import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { CheckCircle2 } from "lucide-react";

interface ApplicationStatusDonutProps {
  title?: string;
  completed: number;
  verified?: number;
  pending: number;
  correctionRequested?: number;
  isLoading?: boolean;
}

const COLORS = {
  completed: "#10b981", // Emerald green
  verified: "#06b6d4", // Cyan
  pending: "#f59e0b", // Amber yellow
  correctionRequested: "#f43f5e", // Rose red
};

export function ApplicationStatusDonut({
  title = "Application Status Split",
  completed,
  verified = 0,
  pending,
  correctionRequested = 0,
  isLoading,
}: ApplicationStatusDonutProps) {
  const total = completed + verified + pending + correctionRequested;

  const chartData = [
    { name: "Completed", value: completed, color: COLORS.completed },
    { name: "Verified / In Progress", value: verified, color: COLORS.verified },
    { name: "Pending", value: pending, color: COLORS.pending },
    { name: "Correction Requested", value: correctionRequested, color: COLORS.correctionRequested },
  ].filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          {total > 0 && (
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              {total} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : total === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No status data"
            description="Status breakdown will appear once student applications are submitted."
          />
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as {
                        name: string;
                        value: number;
                        color: string;
                      } | undefined;
                      if (!item) return null;
                      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-sm"
                              style={{ background: item.color }}
                            />
                            <p className="font-semibold text-foreground">{item.name}</p>
                          </div>
                          <p className="text-muted-foreground">
                            Applications: <span className="font-bold text-foreground">{item.value}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Share: <span className="font-medium text-foreground">{percent}%</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">{total}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  student{total === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-md bg-accent/40">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: COLORS.completed }}
                  />
                  <span className="text-muted-foreground">Completed</span>
                </div>
                <span className="font-semibold text-foreground">{completed}</span>
              </div>

              {verified > 0 && (
                <div className="flex items-center justify-between p-1.5 rounded-md bg-accent/40">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: COLORS.verified }}
                    />
                    <span className="text-muted-foreground">Verified</span>
                  </div>
                  <span className="font-semibold text-foreground">{verified}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-1.5 rounded-md bg-accent/40">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: COLORS.pending }}
                  />
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <span className="font-semibold text-foreground">{pending}</span>
              </div>

              {correctionRequested > 0 && (
                <div className="flex items-center justify-between p-1.5 rounded-md bg-accent/40">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: COLORS.correctionRequested }}
                    />
                    <span className="text-muted-foreground">Correction</span>
                  </div>
                  <span className="font-semibold text-foreground">{correctionRequested}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ApplicationStatusDonut;
