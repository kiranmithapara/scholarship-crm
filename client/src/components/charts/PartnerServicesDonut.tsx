import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { GraduationCap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PartnerServicesDonutProps {
  title?: string;
  prepaidCount: number;
  postpaidCount: number;
  prepaidCommission?: number;
  postpaidCommission?: number;
  isLoading?: boolean;
}

const COLORS = {
  prepaid: "#6366f1", // Indigo
  postpaid: "#a855f7", // Purple
};

export function PartnerServicesDonut({
  title = "Service Applications Split",
  prepaidCount,
  postpaidCount,
  prepaidCommission = 0,
  postpaidCommission = 0,
  isLoading,
}: PartnerServicesDonutProps) {
  const totalStudents = prepaidCount + postpaidCount;

  const chartData = [
    { name: "Prepaid Service", value: prepaidCount, color: COLORS.prepaid, commission: prepaidCommission },
    { name: "Postpaid Service", value: postpaidCount, color: COLORS.postpaid, commission: postpaidCommission },
  ].filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          {totalStudents > 0 && (
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              {totalStudents} student{totalStudents === 1 ? "" : "s"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : totalStudents === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No applications yet"
            description="Service breakdown will appear here once students are added."
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
                        commission?: number;
                      } | undefined;
                      if (!item) return null;
                      const percent = totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(1) : "0";
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
                            Applications:{" "}
                            <span className="font-bold text-foreground">{item.value}</span>
                          </p>
                          {item.commission !== undefined && item.commission > 0 && (
                            <p className="text-muted-foreground">
                              Commission:{" "}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(item.commission)}
                              </span>
                            </p>
                          )}
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
                <p className="text-lg font-bold text-foreground">{totalStudents}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  application{totalStudents === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between text-xs p-1.5 rounded-md bg-accent/40">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: COLORS.prepaid }}
                  />
                  <span className="text-muted-foreground font-medium">Prepaid Service</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground">{prepaidCount} students</span>
                  {prepaidCommission > 0 && (
                    <span className="text-[11px] text-muted-foreground ml-1.5">
                      ({formatCurrency(prepaidCommission)})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-1.5 rounded-md bg-accent/40">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: COLORS.postpaid }}
                  />
                  <span className="text-muted-foreground font-medium">Postpaid Service</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground">{postpaidCount} students</span>
                  {postpaidCommission > 0 && (
                    <span className="text-[11px] text-muted-foreground ml-1.5">
                      ({formatCurrency(postpaidCommission)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PartnerServicesDonut;
