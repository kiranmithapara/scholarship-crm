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

export interface PartnerReceiptItem {
  partnerId: string;
  partnerName: string;
  prepaidCount: number;
  postpaidCount: number;
  totalReceipts: number;
  pendingRevenue: number;
  paidRevenue: number;
  totalRevenue: number;
  paidStudentsCount: number;
}

export interface PartnerReceiptsResponse {
  items: PartnerReceiptItem[];
  totals: {
    totalReceipts: number;
    pendingRevenue: number;
    paidRevenue: number;
    totalRevenue: number;
    paidStudentsCount: number;
  };
}

export interface DashboardStats {
  cards: DashboardCards;
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