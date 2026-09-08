export interface ReferralPartner {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  studentCount: number;
  totalCommission: number;
}

export interface PartnerListResult {
  items: ReferralPartner[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CommissionItem {
  id: string;
  amount: string;
  status: "pending" | "paid";
  paidAt: string | null;
  createdAt: string;
  student: { id: string; fullName: string; serviceType: "prepaid" | "postpaid" };
}

export interface PartnerProfile {
  partner: {
    id: string;
    fullName: string;
    mobile: string;
    email: string;
    username: string;
    photoUrl: string | null;
    isActive: boolean;
    createdAt: string;
    // V2 NEW: per-partner buying cost for each service type, set only by Super Admin
    prepaidCost: string | null;
    postpaidCost: string | null;
  };
  stats: {
    prepaidCount: number;
    postpaidCount: number;
    commission: { pending: number; paid: number };
  };
  students: Array<{
    id: string;
    fullName: string;
    mobile: string;
    collegeName: string;
    serviceType: "prepaid" | "postpaid";
    status: string;
    createdAt: string;
  }>;
}
