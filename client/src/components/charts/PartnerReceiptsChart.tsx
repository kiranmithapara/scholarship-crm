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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import type { PartnerReceiptItem } from "@/types/dashboard.types";
import { formatCurrency } from "@/lib/utils";

interface PartnerReceiptsChartProps {
  data: PartnerReceiptItem[];
  isLoading?: boolean;
}

const COLORS = {
  pending: "#f59e0b", // amber
  paid: "#10b981",    // emerald
};

export function PartnerReceiptsChart({ data, isLoading }: PartnerReceiptsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Referral Partner</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No receipts yet"
            description="Receipts from referral partners will appear here."
          />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 60)}>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="partnerName"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--accent) / 0.3)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0]?.payload as PartnerReceiptItem | undefined;
                  if (!item) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                      <p className="font-semibold text-foreground mb-2">{label}</p>
                      <div className="space-y-1">
                        <p className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.pending }} />
                          <span className="text-muted-foreground">Pending:</span>
                          <span className="font-semibold text-foreground">{formatCurrency(item.pendingRevenue)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.paid }} />
                          <span className="text-muted-foreground">Paid:</span>
                          <span className="font-semibold text-foreground">{formatCurrency(item.paidRevenue)}</span>
                        </p>
                        <div className="pt-1 mt-1 border-t border-border text-muted-foreground">
                          <p>Receipts: <span className="font-medium text-foreground">{item.totalReceipts}</span> ({item.prepaidCount} prepaid, {item.postpaidCount} postpaid)</p>
                          <p>Paid students: <span className="font-medium text-foreground">{item.paidStudentsCount}</span></p>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                formatter={(value) => <span className="text-muted-foreground">{value}</span>}
              />
              <Bar dataKey="pendingRevenue" name="Pending" stackId="revenue" fill={COLORS.pending} radius={[0, 0, 0, 0]} barSize={36} />
              <Bar dataKey="paidRevenue" name="Paid" stackId="revenue" fill={COLORS.paid} radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default PartnerReceiptsChart;