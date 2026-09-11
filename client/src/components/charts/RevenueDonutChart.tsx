import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Wallet, LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueDonutChartProps {
  title: string;
  items: { name: string; value: number; students?: number }[];
  total: number;
  totalLabel?: string;       // e.g. "Total Paid", "Total Pending"
  studentsCount?: number;
  emptyTitle: string;
  emptyDescription: string;
  icon?: LucideIcon;
  palette?: string[];
  isLoading?: boolean;
}

// Modern vibrant palettes
const GREEN_PALETTE = ["#10b981", "#14b8a6", "#22c55e", "#84cc16", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#f97316"];
const AMBER_PALETTE = ["#f59e0b", "#f97316", "#fbbf24", "#fb923c", "#facc15", "#fde047", "#fb7185", "#f472b6", "#a78bfa", "#60a5fa"];

export function RevenueDonutChart({
  title,
  items,
  total,
  totalLabel = "Total",
  studentsCount,
  emptyTitle,
  emptyDescription,
  icon: Icon = Wallet,
  palette = GREEN_PALETTE,
  isLoading,
}: RevenueDonutChartProps) {
  const chartData = items.filter((d) => d.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />
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
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={palette[i % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as { name: string; value: number; students?: number } | undefined;
                      if (!item) return null;
                      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                          <p className="font-semibold text-foreground mb-1">{item.name}</p>
                          <p className="text-muted-foreground">
                            {totalLabel}:{" "}
                            <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
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
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{totalLabel}</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                {studentsCount !== undefined && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {studentsCount} student{studentsCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 w-full">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: palette[i % palette.length] }}
                  />
                  <span className="truncate text-muted-foreground" title={d.name}>
                    {d.name}
                  </span>
                  <span className="ml-auto font-medium text-foreground whitespace-nowrap">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueDonutChart;
export { GREEN_PALETTE, AMBER_PALETTE };