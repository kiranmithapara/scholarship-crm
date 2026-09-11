export interface DashboardCards {
  totalReferralPartners: number;
  totalStudents: number;
  prepaidCount: number;
  postpaidCount: number;
  pendingCount: number;
  completedCount: number;
  commission: {
    total: number;
    pending: number;
    paid: number;
  };
  adminRevenue: {
    pending: number;
    paid: number;
  };
}

// V9 NEW: per-partner receipt summary (Super Admin only)
export interface PartnerReceiptSummary {
  partnerId: string;
  partnerName: string;
  prepaidCount: number;
  postpaidCount: number;
  totalReceipts: number;
  totalRevenue: number;
}

export interface DashboardStats {
  cards: DashboardCards;
  partnerReceipts: PartnerReceiptSummary[];
  recentStudents: RecentStudent[];
}

export interface RecentStudent {
  id: string;
  fullName: string;
  collegeName: string;
  serviceType: "prepaid" | "postpaid";
  status: "pending" | "verified" | "completed" | "correction_requested";
  createdAt: string;
  referralPartner?: { id: string; fullName: string };
}