// V2 UPGRADE: "plan" (2500/5000) -> "serviceType" (prepaid/postpaid). MYSY fields removed
// entirely - scholarship progress is now tracked via the 13-stage TimelineEvent below.
export type ServiceType = "prepaid" | "postpaid";
export type StudentStatus = "pending" | "verified" | "completed" | "correction_requested";
export type DocumentType = "aadhaar" | "hostel_receipt" | "twelfth_marksheet";

// V2 NEW: The full 13-stage manual scholarship-progress workflow, plus 2 operational
// stages carried over from V1 (correction_requested, receipt_uploaded).
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

// V2 NEW: The Scholarship Progress tab's manual "Add Progress Stage" picker was narrowed to
// just these 4 checkpoints (radio buttons). TimelineEvent above stays the full 15-value set
// since the Timeline tab still shows every stage (including ones written automatically).
export type ProgressStage = "application_filled" | "help_center_verification_completed" | "scholarship_approved" | "payment_received";

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
  // V2: financial fields replace MYSY fields
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
}

export interface CreateStudentInput {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName: string;
  course: string;
  semester: string;
  serviceType: ServiceType;
  sellingPrice: number;
}
