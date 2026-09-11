import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { GraduationCap } from "lucide-react";
import type { PartnerReceiptItem } from "@/types/dashboard.types";

interface PostpaidApplicationsDonutProps {
  data: PartnerReceiptItem[];
  isLoading?: boolean;
}

const PURPLE_PALETTE = [
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#6366f1", // indigo
  "#7c3aed", // violet dark
  "#c084fc", // purple light
  "#818cf8", // indigo light
  "#e879f9", // fuchsia
  "#d946ef", // fuchsia dark
  "#a78bfa", // lavender
  "#4f46e5", // indigo dark
];

export function PostpaidApplicationsDonut({ data, isLoading }: PostpaidApplicationsDonutProps) {
  const chartData = data
    .filter((d) => d.postpaidCount > 0)
    .map((d) => ({ name: d.partnerName, value: d.postpaidCount }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Postpaid Applications</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No postpaid applications"
            description="Postpaid students from partners will appear here."
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
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={PURPLE_PALETTE[i % PURPLE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as { name: string; value: number } | undefined;
                      if (!item) return null;
                      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                          <p className="font-semibold text-foreground mb-1">{item.name}</p>
                          <p className="text-muted-foreground">
                            Applications: <span className="font-semibold text-foreground">{item.value}</span>
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
                  application{total === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 w-full">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: PURPLE_PALETTE[i % PURPLE_PALETTE.length] }}
                  />
                  <span className="truncate text-muted-foreground" title={d.name}>
                    {d.name}
                  </span>
                  <span className="ml-auto font-medium text-foreground whitespace-nowrap">
                    {d.value}
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

export default PostpaidApplicationsDonut;