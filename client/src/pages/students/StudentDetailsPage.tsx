import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wallet,
  Clock,
  StickyNote,
  User as UserIcon,
  CheckCheck,
  Receipt as ReceiptIcon,
  History,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadCard } from "@/components/forms/FileUploadCard";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/student.service";
import { partnerService } from "@/services/partner.service";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constant";
import { ROLES } from "@/constants/roles.constant";
import type { DocumentType, TimelineEvent } from "@/types/student.types";
import type { ActivityLogItem } from "@/types/logs.types";

/** Human-readable labels for all 15 timeline stages (13 spec stages + 2 operational carryovers). */
const timelineLabels: Record<TimelineEvent, string> = {
  application_filled: "Application Filled",
  application_locked_by_student: "Application Locked by Student",
  documents_submitted: "Documents Submitted at Help Center",
  help_center_verification_completed: "Help Center Verification Completed",
  commissioner_verification: "Commissioner Verification",
  query_raised: "Query Raised",
  query_resolved: "Query Resolved",
  scholarship_approved: "Scholarship Approved",
  scholarship_amount_credited: "Scholarship Amount Credited",
  payment_pending: "Payment Pending",
  payment_received: "Payment Received",
  payment_verified: "Payment Verified",
  case_completed: "Case Completed",
  correction_requested: "Correction Requested",
  receipt_uploaded: "Receipt Uploaded",
};

/** V4 CHANGE: simplified from 13 stages down to the 6 the business actually uses day-to-day,
 * selected via radio buttons (single choice) instead of the old dropdown. */
const CORE_STAGES: TimelineEvent[] = [
  "application_filled",
  "application_locked_by_student",
  "documents_submitted",
  "help_center_verification_completed",
  "scholarship_approved",
  "payment_received",
];

/** StudentDetailsPage - V2 redesign. 9 Tabs: Overview, Documents, Scholarship Progress, Receipt,
 * Financial Summary, Payment History, Timeline, Internal Notes, Activity Logs. */
export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: student, isLoading, error, refetch } = useStudentDetails(id);

  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [isActing, setIsActing] = useState(false);

  const [selectedStage, setSelectedStage] = useState<TimelineEvent | "">("");
  const [stageNote, setStageNote] = useState("");
  const [isAddingStage, setIsAddingStage] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);

  useEffect(() => {
    if (!id) return;
    setActivityLoading(true);
    studentService
      .getActivityLogs(id)
      .then(setActivityLogs)
      .catch(() => setActivityLogs([]))
      .finally(() => setActivityLoading(false));
  }, [id]);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load this student's details." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !student) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  // V2 UPGRADE: Prepaid needs Aadhaar only; Postpaid needs Aadhaar + 12th Marksheet.
  // Hostel Receipt is NEVER part of this list - it lives on its own "Receipt" tab, admin-only.
  const requiredDocs: DocumentType[] = student.serviceType === "prepaid" ? ["aadhaar"] : ["aadhaar", "twelfth_marksheet"];
  const docLabels: Record<DocumentType, string> = {
    aadhaar: "Aadhaar Card",
    hostel_receipt: "Hostel Receipt",
    twelfth_marksheet: "12th Marksheet",
  };

  const hostelReceiptDoc = student.documents.find((d) => d.type === "hostel_receipt");

  // Derive a friendly "scholarship status" label from the furthest core stage reached in the timeline
  const reachedStages = student.timeline.map((t) => t.event).filter((e) => CORE_STAGES.includes(e as TimelineEvent));
  const currentStage = reachedStages.length > 0 ? (reachedStages[reachedStages.length - 1] as TimelineEvent) : null;

  const handleVerify = async () => {
    setIsActing(true);
    try {
      await studentService.verify(student.id);
      toast.success("Application verified successfully");
      setShowVerifyConfirm(false);
      refetch();
    } catch {
      toast.error("Could not verify the application");
    } finally {
      setIsActing(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (correctionNote.trim().length < 5) {
      toast.error("Please describe what needs to be corrected");
      return;
    }
    setIsActing(true);
    try {
      await studentService.requestCorrection(student.id, correctionNote);
      toast.success("Correction requested");
      setShowCorrectionForm(false);
      setCorrectionNote("");
      refetch();
    } catch {
      toast.error("Could not request correction");
    } finally {
      setIsActing(false);
    }
  };

  const handleUploadDocument = async (type: DocumentType, file: File) => {
    await studentService.uploadDocument(student.id, type, file);
    refetch();
  };

  /** V4 NEW: toggles this student's commission between pending/paid, right from the Student
   * Details page (mirrors the same action already available on the Partner Profile page). */
  const handleToggleCommission = async () => {
    if (!student.commission) return;
    const nextStatus = student.commission.status === "pending" ? "paid" : "pending";
    setIsUpdatingCommission(true);
    try {
      await partnerService.updateCommissionStatus(student.referralPartner.id, student.commission.id, nextStatus);
      toast.success(`Commission marked as ${nextStatus}`);
      refetch();
    } catch {
      toast.error("Could not update commission status");
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  const handleAddStage = async () => {
    if (!selectedStage) {
      toast.error("Please select a stage");
      return;
    }
    setIsAddingStage(true);
    try {
      await studentService.addTimelineStage(student.id, selectedStage, stageNote || undefined);
      toast.success("Scholarship progress updated");
      setSelectedStage("");
      setStageNote("");
      refetch();
    } catch {
      toast.error("Could not update scholarship progress");
    } finally {
      setIsAddingStage(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link to={isSuperAdmin ? ROUTES.STUDENTS : ROUTES.MY_STUDENTS} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">{student.fullName}</h1>
              <StatusBadge status={student.status} />
            </div>
            <p className="mt-1 text-xs sm:text-sm capitalize text-muted-foreground">
              {student.collegeName} • {student.serviceType} Service • Referred by {student.referralPartner.fullName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QuickActions mobile={student.mobile} whatsappMessage={`Hi ${student.fullName}, `} />
            {isSuperAdmin && student.status !== "verified" && student.status !== "completed" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowCorrectionForm(true)}>
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Request Correction
                </Button>
                <Button variant="gradient" size="sm" onClick={() => setShowVerifyConfirm(true)}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Verify
                </Button>
              </>
            )}
            {isSuperAdmin && student.status === "verified" && (
              <Button
                variant="gradient"
                size="sm"
                onClick={async () => {
                  setIsActing(true);
                  try {
                    await studentService.markCompleted(student.id);
                    toast.success("Marked as completed");
                    refetch();
                  } catch {
                    toast.error("Could not mark as completed");
                  } finally {
                    setIsActing(false);
                  }
                }}
                isLoading={isActing}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark Completed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {student.correctionNote && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-danger">Correction Requested</p>
              <p className="text-sm text-muted-foreground">{student.correctionNote}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><UserIcon className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-1.5 h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="progress"><TrendingUp className="mr-1.5 h-3.5 w-3.5" />Scholarship Progress</TabsTrigger>
          <TabsTrigger value="receipt"><ReceiptIcon className="mr-1.5 h-3.5 w-3.5" />Receipt</TabsTrigger>
          <TabsTrigger value="financial"><Wallet className="mr-1.5 h-3.5 w-3.5" />Financial Summary</TabsTrigger>
          <TabsTrigger value="payments"><Wallet className="mr-1.5 h-3.5 w-3.5" />Payment History</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="mr-1.5 h-3.5 w-3.5" />Timeline</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="mr-1.5 h-3.5 w-3.5" />Internal Notes</TabsTrigger>
          <TabsTrigger value="activity"><History className="mr-1.5 h-3.5 w-3.5" />Activity Logs</TabsTrigger>
        </TabsList>

        {/* ---------- Overview ---------- */}
        <TabsContent value="overview">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              {[
                ["Full Name", student.fullName],
                ["Mobile", student.mobile],
                ["Gender", student.gender],
                ["College", student.collegeName],
                ["University", student.universityName],
                ["Course", student.course],
                ["Semester", student.semester],
                ["Referral Partner", student.referralPartner.fullName],
                ["Service Type", student.serviceType],
                ["Created Date", formatDate(student.createdAt)],
                ["Last Updated", formatDate(student.updatedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-medium capitalize text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Documents (Aadhaar / 12th Marksheet only - Hostel Receipt lives on its own tab) ---------- */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="space-y-3 p-6">
              {requiredDocs.map((type) => (
                <FileUploadCard
                  key={type}
                  type={type}
                  label={docLabels[type]}
                  existingDocument={student.documents.find((d) => d.type === type)}
                  onUpload={handleUploadDocument}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Scholarship Progress: the 13-stage MANUAL tracker ---------- */}
        <TabsContent value="progress">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm text-muted-foreground">Current Stage</span>
                <span className="text-sm font-semibold text-primary">
                  {currentStage ? timelineLabels[currentStage] : "Not started"}
                </span>
              </div>

              <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <p className="text-sm font-medium text-foreground">Add Progress Stage</p>
                <p className="text-xs text-muted-foreground">
                  Every stage is updated manually - there is no automation. Select the stage the case has reached and optionally add a note.
                </p>
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <RadioGroup value={selectedStage} onValueChange={(v) => setSelectedStage(v as TimelineEvent)} className="rounded-lg border border-border p-3">
                    {CORE_STAGES.map((stage) => (
                      <label
                        key={stage}
                        htmlFor={`stage-${stage}`}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60"
                      >
                        <RadioGroupItem value={stage} id={`stage-${stage}`} />
                        <span className="text-foreground">{timelineLabels[stage]}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <Textarea value={stageNote} onChange={(e) => setStageNote(e.target.value)} rows={2} placeholder="Any internal detail about this stage..." />
                </div>
                <Button variant="gradient" size="sm" onClick={handleAddStage} isLoading={isAddingStage}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Stage
                </Button>
              </div>

              {/* Progress checklist */}
              <div className="space-y-2">
                {CORE_STAGES.map((stage) => {
                  const reached = reachedStages.includes(stage);
                  return (
                    <div key={stage} className="flex items-center gap-2.5">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${reached ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
                        {reached && <CheckCheck className="h-3 w-3" />}
                      </div>
                      <span className={`text-sm ${reached ? "text-foreground" : "text-muted-foreground"}`}>{timelineLabels[stage]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Receipt: Hostel Receipt is Super-Admin-only, uploaded after physical creation offline ---------- */}
        <TabsContent value="receipt">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-xs text-muted-foreground">
                The Hostel Receipt is created physically by the admin and uploaded here after verification - it is never uploaded by the Referral Partner.
              </p>
              {isSuperAdmin ? (
                <FileUploadCard type="hostel_receipt" label="Hostel Receipt" existingDocument={hostelReceiptDoc} onUpload={handleUploadDocument} />
              ) : hostelReceiptDoc ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                      <ReceiptIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Hostel Receipt</p>
                      <p className="text-xs text-muted-foreground">Uploaded {formatDate(hostelReceiptDoc.createdAt)}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={hostelReceiptDoc.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                  </Button>
                </div>
              ) : (
                <EmptyState icon={ReceiptIcon} title="Receipt not uploaded yet" description="Super Admin will upload the hostel receipt once it's ready." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Financial Summary ---------- */}
        <TabsContent value="financial">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Buying Price</p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">{student.buyingPrice ? formatCurrency(Number(student.buyingPrice)) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">{student.sellingPrice ? formatCurrency(Number(student.sellingPrice)) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Partner Profit</p>
                <p className="mt-0.5 text-lg font-semibold text-success">{student.partnerProfit ? formatCurrency(Number(student.partnerProfit)) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commission Status</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <StatusBadge status={student.commission?.status ?? "pending"} />
                  {isSuperAdmin && student.commission && (
                    <Button
                      variant={student.commission.status === "pending" ? "gradient" : "outline"}
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={handleToggleCommission}
                      isLoading={isUpdatingCommission}
                    >
                      {student.commission.status === "pending" ? "Mark as Paid" : "Revert to Pending"}
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <p className="mt-0.5"><StatusBadge status={student.payments[0]?.status ?? "pending"} /></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Date</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{student.payments[0]?.paidAt ? formatDate(student.payments[0].paidAt) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receipt Uploaded</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{hostelReceiptDoc ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scholarship Progress</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{currentStage ? timelineLabels[currentStage] : "Not started"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Payment History ---------- */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-6">
              {student.payments.length === 0 ? (
                <EmptyState icon={Wallet} title="No payment records yet" />
              ) : (
                <div className="space-y-3">
                  {student.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.transactionId ?? "No transaction ID"} • {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Timeline: chronological, all 15 possible stages ---------- */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              {student.timeline.length === 0 ? (
                <EmptyState icon={Clock} title="No timeline entries yet" />
              ) : (
                <div className="space-y-6">
                  {student.timeline.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-4 pl-2">
                      {index !== student.timeline.length - 1 && <div className="absolute left-[7px] top-5 h-full w-px bg-border" />}
                      <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-primary" />
                      <div className="pb-2">
                        <p className="text-sm font-medium text-foreground">{timelineLabels[entry.event] ?? entry.event}</p>
                        {entry.note && <p className="mt-0.5 text-sm text-muted-foreground">{entry.note}</p>}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(entry.createdAt)} • {entry.actor.fullName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Internal Notes ---------- */}
        <TabsContent value="notes">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                {student.correctionNote ?? "No internal notes have been added to this application yet."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Activity Logs: system audit trail scoped to this student ---------- */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-6">
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !activityLogs || activityLogs.length === 0 ? (
                <EmptyState icon={History} title="No activity recorded yet" />
              ) : (
                <div className="divide-y divide-border">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{log.user.fullName}</span> {log.action.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showVerifyConfirm}
        onOpenChange={setShowVerifyConfirm}
        title="Verify this application?"
        description="This will mark the application as verified and generate a commission record for the referral partner."
        confirmLabel="Verify"
        isLoading={isActing}
        onConfirm={handleVerify}
      />

      <ConfirmDialog
        open={showCorrectionForm}
        onOpenChange={setShowCorrectionForm}
        title="Request Correction"
        description="Describe what needs to be corrected. This will be visible to the referral partner."
        confirmLabel="Send Request"
        isLoading={isActing}
        onConfirm={handleRequestCorrection}
      >
        <Textarea
          value={correctionNote}
          onChange={(e) => setCorrectionNote(e.target.value)}
          placeholder="e.g. Aadhaar card image is unclear, please re-upload"
          rows={3}
        />
      </ConfirmDialog>
    </div>
  );
}
