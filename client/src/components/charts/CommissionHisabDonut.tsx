import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Wallet, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CommissionHisabDonutProps {
  title?: string;
  paid: number;
  pending: number;
  paidStudents?: number;
  pendingStudents?: number;
  isLoading?: boolean;
}

const COLORS = {
  paid: "#10b981", // Emerald green
  pending: "#f59e0b", // Amber yellow
};

export function CommissionHisabDonut({
  title = "Commission Hisab Split",
  paid,
  pending,
  paidStudents,
  pendingStudents,
  isLoading,
}: CommissionHisabDonutProps) {
  const total = paid + pending;

  const chartData = [
    { name: "Paid Commission", value: paid, color: COLORS.paid, students: paidStudents },
    { name: "Pending Commission", value: pending, color: COLORS.pending, students: pendingStudents },
  ].filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          {total > 0 && (
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              {formatCurrency(total)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : total === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No commission yet"
            description="Commission hisab will appear here once applications are processed."
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
                        students?: number;
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
                            Amount:{" "}
                            <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                          </p>
                          {item.students !== undefined && (
                            <p className="text-muted-foreground">
                              Students: <span className="font-medium text-foreground">{item.students}</span>
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
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Hisab</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between text-xs p-1.5 rounded-md bg-accent/40">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: COLORS.paid }}
                  />
                  <span className="text-muted-foreground font-medium">Paid (Mil Chuka)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground">{formatCurrency(paid)}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    ({total > 0 ? ((paid / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-1.5 rounded-md bg-accent/40">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: COLORS.pending }}
                  />
                  <span className="text-muted-foreground font-medium">Pending (Baki Hai)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground">{formatCurrency(pending)}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    ({total > 0 ? ((pending / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CommissionHisabDonut;
