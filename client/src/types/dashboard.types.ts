export interface DashboardCards {
  totalReferralPartners: number;
  totalStudents: number;
  plan2500Count: number;
  plan5000Count: number;
  pendingCount: number;
  completedCount: number;
  commission: {
    total: number;
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
  plan: "2500" | "5000";
  status: "pending" | "verified" | "completed" | "correction_requested";
  createdAt: string;
  referralPartner?: { id: string; fullName: string };
}
