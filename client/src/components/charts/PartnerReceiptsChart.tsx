import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Users, Wallet, Wallet2, Layers } from "lucide-react";
import type { PartnerReceiptItem } from "@/types/dashboard.types";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ChartMode = "all" | "prepaid" | "postpaid";

interface PartnerReceiptsChartProps {
  data: PartnerReceiptItem[];
  isLoading?: boolean;
  mode?: ChartMode;
  onModeChange?: (mode: ChartMode) => void;
}

const COLORS = {
  pending: "#f59e0b",
  paid: "#10b981",
};

export function PartnerReceiptsChart({
  data,
  isLoading,
  mode: controlledMode,
  onModeChange,
}: PartnerReceiptsChartProps) {
  const [internalMode, setInternalMode] = useState<ChartMode>("all");
  const mode = controlledMode ?? internalMode;

  const handleModeChange = (newMode: ChartMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  // Filter and shape data based on selected mode
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((item) => {
        let pending = item.pendingRevenue;
        let paid = item.paidRevenue;
        let count = item.totalReceipts;

        if (mode === "prepaid") {
          pending = item.prepaidPendingRevenue ?? 0;
          paid = item.prepaidPaidRevenue ?? 0;
          count = item.prepaidCount;
        } else if (mode === "postpaid") {
          pending = item.postpaidPendingRevenue ?? 0;
          paid = item.postpaidPaidRevenue ?? 0;
          count = item.postpaidCount;
        }

        return {
          ...item,
          displayPending: pending,
          displayPaid: paid,
          displayTotal: pending + paid,
          displayCount: count,
        };
      })
      .filter((item) => (mode === "all" ? item.displayTotal >= 0 : item.displayCount > 0 || item.displayTotal > 0))
      .sort((a, b) => b.displayPaid - a.displayPaid || b.displayPending - a.displayPending);
  }, [data, mode]);

  // Compute total for the current active mode
  const activeModeTotal = useMemo(() => {
    return chartData.reduce(
      (acc, item) => ({
        pending: acc.pending + item.displayPending,
        paid: acc.paid + item.displayPaid,
        total: acc.total + item.displayTotal,
        count: acc.count + item.displayCount,
      }),
      { pending: 0, paid: 0, total: 0, count: 0 }
    );
  }, [chartData]);

  const minChartWidth = Math.max(340, chartData.length * 52);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>Revenue by Referral Partner</span>
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              {formatCurrency(activeModeTotal.total)}
            </span>
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {mode === "all"
              ? "Combined prepaid & postpaid revenue"
              : mode === "prepaid"
              ? `Prepaid applications (${activeModeTotal.count} students)`
              : `Postpaid applications (${activeModeTotal.count} students)`}
          </CardDescription>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeChange("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
              mode === "all"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("prepaid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
              mode === "prepaid"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Prepaid</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("postpaid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
              mode === "postpaid"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Wallet2 className="h-3.5 w-3.5" />
            <span>Postpaid</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2 flex-1">
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={Users}
            title={mode === "all" ? "No receipts yet" : `No ${mode} receipts found`}
            description={
              mode === "all"
                ? "Receipts from referral partners will appear here."
                : `No partner data available for ${mode} service in this period.`
            }
          />
        ) : (
          <div className="w-full overflow-x-auto scrollbar-thin">
            <div style={{ minWidth: `${minChartWidth}px`, height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -8, bottom: 20 }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.6)" />
                  <XAxis
                    dataKey="partnerName"
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(name: string) => {
                      if (!name) return "";
                      return name.length > 12 ? `${name.slice(0, 10)}...` : name;
                    }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={55}
                    dx={-4}
                    dy={4}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => formatCompactCurrency(v)}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as any;
                      if (!item) return null;

                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-xl text-xs max-w-xs z-50">
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border">
                            <p className="font-semibold text-foreground truncate">{item.partnerName}</p>
                            <span className="text-[10px] uppercase font-semibold tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {mode}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <p className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-sm"
                                  style={{ background: COLORS.pending }}
                                />
                                Pending:
                              </span>
                              <span className="font-semibold text-foreground">
                                {formatCurrency(item.displayPending)}
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-sm"
                                  style={{ background: COLORS.paid }}
                                />
                                Paid:
                              </span>
                              <span className="font-semibold text-foreground">
                                {formatCurrency(item.displayPaid)}
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
                              <span className="text-muted-foreground font-medium">Total:</span>
                              <span className="font-bold text-foreground">
                                {formatCurrency(item.displayTotal)}
                              </span>
                            </p>
                            <div className="pt-1.5 mt-1 border-t border-border text-[11px] text-muted-foreground space-y-0.5">
                              <p>
                                Total Applications:{" "}
                                <span className="font-medium text-foreground">
                                  {item.totalReceipts}
                                </span>{" "}
                                ({item.prepaidCount} prepaid, {item.postpaidCount} postpaid)
                              </p>
                              <p>
                                Paid Students:{" "}
                                <span className="font-medium text-foreground">
                                  {mode === "prepaid"
                                    ? item.prepaidPaidStudentsCount ?? 0
                                    : mode === "postpaid"
                                    ? item.postpaidPaidStudentsCount ?? 0
                                    : item.paidStudentsCount}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                    formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
                  />
                  <Bar
                    dataKey="displayPending"
                    name="Pending"
                    stackId="revenue"
                    fill={COLORS.pending}
                    radius={[0, 0, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="displayPaid"
                    name="Paid"
                    stackId="revenue"
                    fill={COLORS.paid}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PartnerReceiptsChart;