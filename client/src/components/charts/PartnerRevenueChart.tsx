import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import type { PartnerReceiptSummary } from "@/types/dashboard.types";
import { formatCurrency } from "@/lib/utils";

interface PartnerRevenueChartProps {
  data: PartnerReceiptSummary[];
  isLoading?: boolean;
}

/**
 * V9 NEW: PartnerRevenueChart - horizontal bar chart showing admin revenue
 * earned from each referral partner's receipts. Tooltip shows prepaid/postpaid counts.
 */
export function PartnerRevenueChart({ data, isLoading }: PartnerRevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts by Referral Partner</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No receipts yet"
            description="When referral partners deliver receipts, they will appear here."
          />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(260, data.length * 55)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `₹${v}`}
              />
              <YAxis
                type="category"
                dataKey="partnerName"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 13, fill: "hsl(var(--foreground))" }}
                width={110}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--accent) / 0.3)" }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const first = payload[0];
                  if (!first) return null;
                  const item = first.payload as PartnerReceiptSummary;
                  if (!item) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                      <p className="font-semibold text-foreground mb-2">{item.partnerName}</p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>
                          Prepaid receipts:{" "}
                          <span className="font-medium text-foreground">{item.prepaidCount}</span>
                        </p>
                        <p>
                          Postpaid receipts:{" "}
                          <span className="font-medium text-foreground">{item.postpaidCount}</span>
                        </p>
                        <p>
                          Total receipts:{" "}
                          <span className="font-medium text-foreground">{item.totalReceipts}</span>
                        </p>
                        <p className="pt-1 border-t border-border mt-1">
                          Revenue:{" "}
                          <span className="font-semibold text-success">
                            {formatCurrency(item.totalRevenue)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="totalRevenue" radius={[0, 6, 6, 0]} barSize={22}>
                {data.map((_, i) => (
                  <Cell key={i} fill="hsl(var(--primary))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default PartnerRevenueChart;