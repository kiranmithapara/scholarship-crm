export interface DashboardCards {
  totalReferralPartners: number;
  totalStudents: number;
  // V2 UPGRADE: plan2500Count/plan5000Count -> prepaidCount/postpaidCount
  prepaidCount: number;
  postpaidCount: number;
  pendingCount: number;
  completedCount: number;
  commission: {
    total: number;
    pending: number;
    paid: number;
  };
  // V4 NEW: what the Super Admin personally keeps per application (buying price), separate
  // from the `commission` figures above which are what the Referral Partner earns.
  adminRevenue: {
    pending: number;
    paid: number;
  };
}

export interface MonthlyDataPoint {
  label: string;
  count: number;
}

export interface DashboardStats {
  cards: DashboardCards;
  charts: {
    monthlyStudents: MonthlyDataPoint[];
    monthlyApplications: MonthlyDataPoint[];
  };
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
