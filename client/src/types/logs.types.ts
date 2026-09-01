export interface LoginLogItem {
  id: string;
  emailAttempted: string;
  ipAddress: string;
  browser: string | null;
  device: string | null;
  status: "success" | "failed";
  failureReason: string | null;
  createdAt: string;
  user: { id: string; fullName: string } | null;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; fullName: string };
}

export interface LoginLogListResult {
  items: LoginLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivityLogListResult {
  items: ActivityLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
