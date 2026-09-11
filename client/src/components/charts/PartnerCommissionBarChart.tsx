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
import { Wallet, Wallet2, Layers, IndianRupee } from "lucide-react";
import { formatCurrency, formatCompactCurrency, cn } from "@/lib/utils";
import type { ChartMode } from "./PartnerReceiptsChart";

export interface PartnerCommissionChartData {
  prepaid: {
    pending: number;
    paid: number;
    total: number;
    students: number;
    paidStudents: number;
  };
  postpaid: {
    pending: number;
    paid: number;
    total: number;
    students: number;
    paidStudents: number;
  };
}

interface PartnerCommissionBarChartProps {
  data: PartnerCommissionChartData;
  isLoading?: boolean;
  mode?: ChartMode;
  onModeChange?: (mode: ChartMode) => void;
}

const COLORS = {
  pending: "#f59e0b",
  paid: "#10b981",
};

export function PartnerCommissionBarChart({
  data,
  isLoading,
  mode: controlledMode,
  onModeChange,
}: PartnerCommissionBarChartProps) {
  const [internalMode, setInternalMode] = useState<ChartMode>("all");
  const mode = controlledMode ?? internalMode;

  const handleModeChange = (newMode: ChartMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const chartData = useMemo(() => {
    const items = [];

    if (mode === "all" || mode === "prepaid") {
      items.push({
        category: "Prepaid Service",
        serviceType: "prepaid",
        pending: data.prepaid.pending,
        paid: data.prepaid.paid,
        total: data.prepaid.total,
        students: data.prepaid.students,
        paidStudents: data.prepaid.paidStudents,
      });
    }

    if (mode === "all" || mode === "postpaid") {
      items.push({
        category: "Postpaid Service",
        serviceType: "postpaid",
        pending: data.postpaid.pending,
        paid: data.postpaid.paid,
        total: data.postpaid.total,
        students: data.postpaid.students,
        paidStudents: data.postpaid.paidStudents,
      });
    }

    if (mode === "all") {
      items.push({
        category: "Combined Total",
        serviceType: "total",
        pending: data.prepaid.pending + data.postpaid.pending,
        paid: data.prepaid.paid + data.postpaid.paid,
        total: data.prepaid.total + data.postpaid.total,
        students: data.prepaid.students + data.postpaid.students,
        paidStudents: data.prepaid.paidStudents + data.postpaid.paidStudents,
      });
    }

    return items;
  }, [data, mode]);

  const activeTotal = useMemo(() => {
    if (mode === "prepaid") {
      return {
        pending: data.prepaid.pending,
        paid: data.prepaid.paid,
        total: data.prepaid.total,
        students: data.prepaid.students,
      };
    }
    if (mode === "postpaid") {
      return {
        pending: data.postpaid.pending,
        paid: data.postpaid.paid,
        total: data.postpaid.total,
        students: data.postpaid.students,
      };
    }
    return {
      pending: data.prepaid.pending + data.postpaid.pending,
      paid: data.prepaid.paid + data.postpaid.paid,
      total: data.prepaid.total + data.postpaid.total,
      students: data.prepaid.students + data.postpaid.students,
    };
  }, [data, mode]);

  const hasData = activeTotal.total > 0 || activeTotal.students > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>Commission Earnings Hisab</span>
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              {formatCurrency(activeTotal.total)}
            </span>
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {mode === "all"
              ? `Total earnings across all services (${activeTotal.students} students)`
              : mode === "prepaid"
              ? `Prepaid earnings (${activeTotal.students} students)`
              : `Postpaid earnings (${activeTotal.students} students)`}
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
          <Skeleton className="h-[280px] w-full" />
        ) : !hasData ? (
          <EmptyState
            icon={IndianRupee}
            title="No commission records"
            description={
              mode === "all"
                ? "Your commission hisab will appear here once applications are submitted."
                : `No ${mode} commission records found in this period.`
            }
          />
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 16, left: -8, bottom: 10 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.6)" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  width={46}
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
                          <p className="font-semibold text-foreground">{item.category}</p>
                          <span className="text-[10px] uppercase font-semibold tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {item.students} Students
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-sm"
                                style={{ background: COLORS.pending }}
                              />
                              Pending Commission:
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(item.pending)}
                            </span>
                          </p>
                          <p className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-sm"
                                style={{ background: COLORS.paid }}
                              />
                              Paid Commission:
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(item.paid)}
                            </span>
                          </p>
                          <p className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
                            <span className="text-muted-foreground font-medium">Total Hisab:</span>
                            <span className="font-bold text-foreground">
                              {formatCurrency(item.total)}
                            </span>
                          </p>
                          <div className="pt-1 mt-1 border-t border-border text-[11px] text-muted-foreground flex justify-between">
                            <span>Completed Students:</span>
                            <span className="font-medium text-foreground">{item.paidStudents}</span>
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
                  dataKey="pending"
                  name="Pending Commission"
                  stackId="commission"
                  fill={COLORS.pending}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="paid"
                  name="Paid Commission"
                  stackId="commission"
                  fill={COLORS.paid}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PartnerCommissionBarChart;
