export type ServiceType = "prepaid" | "postpaid";
export type StudentStatus = "pending" | "completed";
export type DocumentType = "aadhaar" | "hostel_receipt" | "twelfth_marksheet";

export type TimelineEvent =
  | "application_filled"
  | "application_locked_by_student"
  | "documents_submitted"
  | "help_center_verification_completed"
  | "commissioner_verification"
  | "query_raised"
  | "query_resolved"
  | "scholarship_approved"
  | "scholarship_amount_credited"
  | "payment_pending"
  | "payment_received"
  | "payment_verified"
  | "case_completed"
  | "correction_requested"
  | "receipt_uploaded";

export interface StudentListItem {
  id: string;
  fullName: string;
  mobile: string;
  collegeName: string;
  serviceType: ServiceType;
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
  event: TimelineEvent;
  note: string | null;
  createdAt: string;
  actor: { id: string; fullName: string };
}

// V5 NEW: internal note
export interface StudentNoteItem {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; fullName: string };
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
  serviceType: ServiceType;
  status: StudentStatus;
  buyingPrice: string | null;
  sellingPrice: string | null;
  partnerProfit: string | null;
  correctionNote: string | null;
  createdAt: string;
  updatedAt: string;
  referralPartner: { id: string; fullName: string; mobile: string; email: string };
  documents: StudentDocumentItem[];
  payments: PaymentItem[];
  timeline: TimelineItem[];
  commission: { id: string; amount: string; status: "pending" | "paid" } | null;
  // V5 NEW: notes only present for Super Admin
  notes?: StudentNoteItem[];
}

export interface CreateStudentInput {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName?: string;
  course?: string;
  semester?: string;
  serviceType: ServiceType;
  sellingPrice?: number;
}