import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Wallet } from "lucide-react";
import type { PartnerReceiptItem } from "@/types/dashboard.types";
import { formatCurrency } from "@/lib/utils";

interface PaidRevenueDonutChartProps {
  data: PartnerReceiptItem[];
  totalPaid: number;
  paidStudentsCount: number;
  isLoading?: boolean;
}

// Modern vibrant palette
const PALETTE = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#ef4444", // red
  "#06b6d4", // cyan
];

export function PaidRevenueDonutChart({
  data,
  totalPaid,
  paidStudentsCount,
  isLoading,
}: PaidRevenueDonutChartProps) {
  // Only partners with paid > 0
  const chartData = data
    .filter((d) => d.paidRevenue > 0)
    .map((d) => ({ name: d.partnerName, value: d.paidRevenue, students: d.paidStudentsCount }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Paid Revenue Split</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No paid revenue yet"
            description="When partner commissions are marked as paid, the split will appear here."
          />
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as { name: string; value: number; students: number } | undefined;
                      if (!item) return null;
                      const percent = totalPaid > 0 ? ((item.value / totalPaid) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                          <p className="font-semibold text-foreground mb-1">{item.name}</p>
                          <p className="text-muted-foreground">
                            Paid:{" "}
                            <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Students:{" "}
                            <span className="font-medium text-foreground">{item.students}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Share:{" "}
                            <span className="font-medium text-foreground">{percent}%</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {paidStudentsCount} student{paidStudentsCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="truncate text-muted-foreground" title={d.name}>
                    {d.name}
                  </span>
                  <span className="ml-auto font-medium text-foreground">
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

export default PaidRevenueDonutChart;