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
  };
  stats: {
    plan2500Count: number;
    plan5000Count: number;
    commission: { pending: number; paid: number };
  };
  students: Array<{
    id: string;
    fullName: string;
    mobile: string;
    collegeName: string;
    plan: "2500" | "5000";
    status: string;
    createdAt: string;
  }>;
}
