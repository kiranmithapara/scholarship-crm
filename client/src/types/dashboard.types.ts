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
  postpaidCommission: {
    total: number;
    pending: number;
    paid: number;
  };
  prepaidCommission: {
    total: number;
    pending: number;
    paid: number;
  };
  adminRevenue: {
    total?: number;
    pending: number;
    paid: number;
    postpaid?: {
      total: number;
      pending: number;
      paid: number;
    };
    prepaid?: {
      total: number;
      pending: number;
      paid: number;
    };
  };
}

export interface PartnerReceiptItem {
  partnerId: string;
  partnerName: string;
  prepaidCount: number;
  postpaidCount: number;
  totalReceipts: number;
  // All Revenue
  pendingRevenue: number;
  paidRevenue: number;
  totalRevenue: number;
  // Prepaid Revenue
  prepaidPendingRevenue?: number;
  prepaidPaidRevenue?: number;
  prepaidTotalRevenue?: number;
  // Postpaid Revenue
  postpaidPendingRevenue?: number;
  postpaidPaidRevenue?: number;
  postpaidTotalRevenue?: number;
  // Commissions
  pendingCommission?: number;
  paidCommission?: number;
  totalCommission?: number;
  prepaidPendingCommission?: number;
  prepaidPaidCommission?: number;
  prepaidTotalCommission?: number;
  postpaidPendingCommission?: number;
  postpaidPaidCommission?: number;
  postpaidTotalCommission?: number;
  // Counts
  paidStudentsCount: number;
  prepaidPaidStudentsCount?: number;
  postpaidPaidStudentsCount?: number;
}

export interface PartnerReceiptsResponse {
  items: PartnerReceiptItem[];
  totals: {
    totalReceipts: number;
    prepaidCount?: number;
    postpaidCount?: number;
    pendingRevenue: number;
    paidRevenue: number;
    totalRevenue: number;
    prepaidPendingRevenue?: number;
    prepaidPaidRevenue?: number;
    prepaidTotalRevenue?: number;
    postpaidPendingRevenue?: number;
    postpaidPaidRevenue?: number;
    postpaidTotalRevenue?: number;
    pendingCommission?: number;
    paidCommission?: number;
    totalCommission?: number;
    prepaidPendingCommission?: number;
    prepaidPaidCommission?: number;
    prepaidTotalCommission?: number;
    postpaidPendingCommission?: number;
    postpaidPaidCommission?: number;
    postpaidTotalCommission?: number;
    paidStudentsCount: number;
    prepaidPaidStudentsCount?: number;
    postpaidPaidStudentsCount?: number;
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