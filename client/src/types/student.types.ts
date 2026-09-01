export type StudentPlan = "2500" | "5000";
export type StudentStatus = "pending" | "verified" | "completed" | "correction_requested";
export type ScholarshipStatus = "pending" | "approved" | "rejected";
export type DocumentType = "aadhaar" | "hostel_receipt" | "twelfth_marksheet";

export interface StudentListItem {
  id: string;
  fullName: string;
  mobile: string;
  collegeName: string;
  plan: StudentPlan;
  status: StudentStatus;
  createdAt: string;
  referralPartner: { id: string; fullName: string; mobile: string };
}

export interface StudentListResult {
  items: StudentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StudentDocumentItem {
  id: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

export interface PaymentItem {
  id: string;
  amount: string;
  status: "pending" | "completed" | "failed";
  transactionId: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  event: "application_submitted" | "verified" | "receipt_uploaded" | "correction_requested" | "completed";
  note: string | null;
  createdAt: string;
  actor: { id: string; fullName: string };
}

export interface StudentDetails {
  id: string;
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName: string;
  course: string;
  semester: string;
  plan: StudentPlan;
  status: StudentStatus;
  mysyRegistrationNumber: string | null;
  mysyPassword: string | null;
  scholarshipStatus: ScholarshipStatus;
  correctionNote: string | null;
  createdAt: string;
  referralPartner: { id: string; fullName: string; mobile: string; email: string };
  documents: StudentDocumentItem[];
  payments: PaymentItem[];
  timeline: TimelineItem[];
  commission: { id: string; amount: string; status: "pending" | "paid" } | null;
}

export interface CreateStudentInput {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName: string;
  course: string;
  semester: string;
  plan: StudentPlan;
  mysyRegistrationNumber?: string;
  mysyPassword?: string;
}
