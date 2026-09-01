import { Badge } from "@/components/ui/badge";

type Status = "pending" | "verified" | "completed" | "correction_requested" | "approved" | "rejected" | "paid" | "failed";

const statusConfig: Record<Status, { label: string; variant: "default" | "success" | "warning" | "danger" }> = {
  pending: { label: "Pending", variant: "warning" },
  verified: { label: "Verified", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  correction_requested: { label: "Correction Requested", variant: "danger" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

/** StatusBadge - consistent status pill rendering across Students, Payments, Commissions tables. */
export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
