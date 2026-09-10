import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  FileText,
  Wallet,
  StickyNote,
  User as UserIcon,
  Receipt as ReceiptIcon,
  History,
  TrendingUp,
  Plus,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
  Pencil,
  X,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormInput } from "@/components/forms/FormInput";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FileUploadCard } from "@/components/forms/FileUploadCard";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/student.service";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constant";
import { ROLES } from "@/constants/roles.constant";
import type { DocumentType, TimelineEvent } from "@/types/student.types";
import type { ActivityLogItem } from "@/types/logs.types";

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

const CORE_STAGES: TimelineEvent[] = [
  "application_filled",
  "application_locked_by_student",
  "documents_submitted",
  "help_center_verification_completed",
  "scholarship_approved",
  "payment_received",
];

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: student, isLoading, error, refetch } = useStudentDetails(id);

  // V6 NEW: Controlled tab state - keeps user on current tab after any action
  const [activeTab, setActiveTab] = useState("overview");

  const [selectedStage, setSelectedStage] = useState<TimelineEvent | "">("");
  const [stageNote, setStageNote] = useState("");
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);

  const [showEditBuyingPrice, setShowEditBuyingPrice] = useState(false);
  const [newBuyingPrice, setNewBuyingPrice] = useState("");
  const [isSavingBuyingPrice, setIsSavingBuyingPrice] = useState(false);

  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deletingTimelineId, setDeletingTimelineId] = useState<string | null>(null);
  const [isDeletingTimeline, setIsDeletingTimeline] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingInternalNoteId, setEditingInternalNoteId] = useState<string | null>(null);
  const [editingInternalNoteText, setEditingInternalNoteText] = useState("");
  const [isSavingInternalNote, setIsSavingInternalNote] = useState(false);
  const [deletingInternalNoteId, setDeletingInternalNoteId] = useState<string | null>(null);
  const [isDeletingInternalNote, setIsDeletingInternalNote] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);

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
  const isPrepaid = student.serviceType === "prepaid";
  const isPostpaid = student.serviceType === "postpaid";

  const requiredDocs: DocumentType[] = isPrepaid ? ["aadhaar"] : ["aadhaar", "twelfth_marksheet"];
  const docLabels: Record<DocumentType, string> = {
    aadhaar: "Aadhaar Card",
    hostel_receipt: "Hostel Receipt",
    twelfth_marksheet: "12th Marksheet",
  };

  const hostelReceiptDoc = student.documents.find((d) => d.type === "hostel_receipt");
  const reachedStages = student.timeline.map((t) => t.event).filter((e) => CORE_STAGES.includes(e as TimelineEvent));
  const currentStage = reachedStages.length > 0 ? (reachedStages[reachedStages.length - 1] as TimelineEvent) : null;

  const hasSellingPrice = student.sellingPrice !== null && student.sellingPrice !== "";

  const handleUploadDocument = async (type: DocumentType, file: File) => {
    await studentService.uploadDocument(student.id, type, file);
    refetch();
  };

  const handleAddStage = async () => {
    if (!selectedStage) {
      toast.error("Please select a stage");
      return;
    }
    setIsAddingStage(true);
    try {
      await studentService.addTimelineStage(student.id, selectedStage, stageNote || undefined);
      toast.success("Progress updated");
      setSelectedStage("");
      setStageNote("");
      refetch();
    } catch {
      toast.error("Could not update progress");
    } finally {
      setIsAddingStage(false);
    }
  };

  const handleToggleCommission = async () => {
    if (!student.commission) return;
    const nextStatus = student.commission.status === "pending" ? "paid" : "pending";
    setIsUpdatingCommission(true);
    try {
      await studentService.updateCommissionStatus(student.id, nextStatus);
      toast.success(`Commission marked as ${nextStatus}`);
      refetch();
    } catch {
      toast.error("Could not update commission status");
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  const handleSaveBuyingPrice = async () => {
    const val = Number(newBuyingPrice);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Enter a valid, non-negative buying price");
      return;
    }
    setIsSavingBuyingPrice(true);
    try {
      await studentService.update(student.id, { buyingPrice: val } as any);
      toast.success("Buying price updated");
      setShowEditBuyingPrice(false);
      setNewBuyingPrice("");
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update buying price");
    } finally {
      setIsSavingBuyingPrice(false);
    }
  };

  const handleSaveNote = async () => {
    if (!editingTimelineId) return;
    setIsSavingNote(true);
    try {
      await studentService.updateTimelineNote(student.id, editingTimelineId, editingNote || null);
      toast.success("Note updated");
      setEditingTimelineId(null);
      setEditingNote("");
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteTimelineEntry = async () => {
    if (!deletingTimelineId) return;
    setIsDeletingTimeline(true);
    try {
      await studentService.deleteTimelineEntry(student.id, deletingTimelineId);
      toast.success("Timeline entry deleted");
      setDeletingTimelineId(null);
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not delete entry");
    } finally {
      setIsDeletingTimeline(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setIsAddingNote(true);
    try {
      await studentService.addNote(student.id, newNote.trim());
      toast.success("Note added");
      setNewNote("");
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSaveInternalNote = async () => {
    if (!editingInternalNoteId) return;
    if (!editingInternalNoteText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    setIsSavingInternalNote(true);
    try {
      await studentService.updateNote(student.id, editingInternalNoteId, editingInternalNoteText.trim());
      toast.success("Note updated");
      setEditingInternalNoteId(null);
      setEditingInternalNoteText("");
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update note");
    } finally {
      setIsSavingInternalNote(false);
    }
  };

  const handleDeleteInternalNote = async () => {
    if (!deletingInternalNoteId) return;
    setIsDeletingInternalNote(true);
    try {
      await studentService.deleteNote(student.id, deletingInternalNoteId);
      toast.success("Note deleted");
      setDeletingInternalNoteId(null);
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not delete note");
    } finally {
      setIsDeletingInternalNote(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link
        to={isSuperAdmin ? ROUTES.STUDENTS : ROUTES.MY_STUDENTS}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold">{student.fullName}</h1>
              <StatusBadge status={student.status} />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {student.collegeName} • {student.serviceType} Service • Referred by {student.referralPartner.fullName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <QuickActions mobile={student.mobile} whatsappMessage={`Hi ${student.fullName}, `} />
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

      {/* V6: Controlled tabs - stays on current tab after actions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><UserIcon className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-1.5 h-3.5 w-3.5" />Documents</TabsTrigger>
          {isPostpaid && (
            <TabsTrigger value="progress"><TrendingUp className="mr-1.5 h-3.5 w-3.5" />Scholarship Progress</TabsTrigger>
          )}
          <TabsTrigger value="receipt"><ReceiptIcon className="mr-1.5 h-3.5 w-3.5" />Receipt</TabsTrigger>
          <TabsTrigger value="financial"><Wallet className="mr-1.5 h-3.5 w-3.5" />Financial Summary</TabsTrigger>
          <TabsTrigger value="timeline"><History className="mr-1.5 h-3.5 w-3.5" />Timeline</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="notes"><StickyNote className="mr-1.5 h-3.5 w-3.5" />Internal Notes</TabsTrigger>
          )}
          <TabsTrigger value="activity"><History className="mr-1.5 h-3.5 w-3.5" />Activity Logs</TabsTrigger>
        </TabsList>

        {/* Overview */}
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
                  <p className="mt-0.5 text-sm font-medium capitalize text-foreground">{value || "-"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
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

        {/* Scholarship Progress (postpaid only) */}
        {isPostpaid && (
          <TabsContent value="progress">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm text-muted-foreground">Current Stage</span>
                  <span className="text-sm font-semibold text-primary">
                    {currentStage ? timelineLabels[currentStage] : "Not started"}
                  </span>
                </div>

                {isSuperAdmin ? (
                  <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                    <p className="text-sm font-medium text-foreground">Add Progress Stage</p>
                    <div className="space-y-1.5">
                      <Label>Stage</Label>
                      <RadioGroup value={selectedStage} onValueChange={(v) => setSelectedStage(v as TimelineEvent)} className="rounded-lg border border-border p-3">
                        {CORE_STAGES.map((stage) => (
                          <label key={stage} htmlFor={`stage-${stage}`} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60">
                            <RadioGroupItem value={stage} id={`stage-${stage}`} />
                            <span className="text-foreground">{timelineLabels[stage]}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Note (optional - internal)</Label>
                      <Textarea value={stageNote} onChange={(e) => setStageNote(e.target.value)} rows={2} placeholder="Any internal detail about this stage..." />
                    </div>
                    <Button variant="gradient" size="sm" onClick={handleAddStage} isLoading={isAddingStage}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Stage
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    You can view the current scholarship progress, but only the Super Admin can update it.
                  </div>
                )}

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
        )}

        {/* Receipt */}
        <TabsContent value="receipt">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-xs text-muted-foreground">
                The Hostel Receipt is created physically by the admin and uploaded here after verification.
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

        {/* Financial Summary */}
        <TabsContent value="financial">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Buying Price</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-lg font-semibold text-foreground">
                    {student.buyingPrice ? formatCurrency(Number(student.buyingPrice)) : "-"}
                  </p>
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setNewBuyingPrice(student.buyingPrice ?? "");
                        setShowEditBuyingPrice(true);
                      }}
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {hasSellingPrice ? formatCurrency(Number(student.sellingPrice)) : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Partner Profit</p>
                <p className="mt-0.5 text-lg font-semibold text-success">
                  {hasSellingPrice && student.partnerProfit ? formatCurrency(Number(student.partnerProfit)) : "-"}
                </p>
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
                      {student.commission.status === "pending" ? (
                        <>
                          <CheckCheck className="mr-1 h-3 w-3" /> Mark as Paid
                        </>
                      ) : (
                        <>
                          <RotateCcw className="mr-1 h-3 w-3" /> Revert to Pending
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <p className="mt-0.5"><StatusBadge status={student.commission?.status ?? "pending"} /></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Date</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {student.commission?.paidAt ? formatDate(student.commission.paidAt) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receipt Uploaded</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{hostelReceiptDoc ? "Yes" : "No"}</p>
              </div>
              {isPostpaid && (
                <div>
                  <p className="text-xs text-muted-foreground">Scholarship Progress</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{currentStage ? timelineLabels[currentStage] : "Not started"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              {student.timeline.length === 0 ? (
                <EmptyState icon={History} title="No timeline entries yet" />
              ) : (
                <div className="space-y-6">
                  {student.timeline.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-4 pl-2">
                      {index !== student.timeline.length - 1 && (
                        <div className="absolute left-[7px] top-5 h-full w-px bg-border" />
                      )}
                      <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-primary" />
                      <div className="pb-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {timelineLabels[entry.event] ?? entry.event}
                          </p>
                          {isSuperAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Edit note"
                                onClick={() => {
                                  setEditingTimelineId(entry.id);
                                  setEditingNote(entry.note ?? "");
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {entry.event !== "application_filled" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-danger hover:bg-danger/10"
                                  title="Delete entry"
                                  onClick={() => setDeletingTimelineId(entry.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {entry.note && (
                          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                            {entry.note}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(entry.createdAt)} • {entry.actor?.fullName ?? "System"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Internal Notes tab */}
        {isSuperAdmin && (
          <TabsContent value="notes">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2 rounded-lg border border-dashed border-border p-4">
                  <Label>Add New Note</Label>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    placeholder="Write an internal note about this student (only Super Admin can see this)..."
                  />
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={handleAddInternalNote}
                    isLoading={isAddingNote}
                    disabled={!newNote.trim()}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Note
                  </Button>
                </div>

                {!student.notes || student.notes.length === 0 ? (
                  <EmptyState
                    icon={StickyNote}
                    title="No internal notes yet"
                    description="Add your first note above. These notes are private and only visible to Super Admin."
                  />
                ) : (
                  <div className="space-y-3">
                    {student.notes.map((note) => (
                      <div key={note.id} className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground whitespace-pre-wrap flex-1">
                            {note.note}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Edit note"
                              onClick={() => {
                                setEditingInternalNoteId(note.id);
                                setEditingInternalNoteText(note.note);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-danger hover:bg-danger/10"
                              title="Delete note"
                              onClick={() => setDeletingInternalNoteId(note.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(note.createdAt)} • {note.author?.fullName ?? "Unknown"}
                          {note.updatedAt !== note.createdAt && " • edited"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Activity Logs */}
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

      {/* Edit Buying Price Modal */}
      {showEditBuyingPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Buying Price</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowEditBuyingPrice(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <FormInput
                label="Buying Price (₹)"
                type="number"
                value={newBuyingPrice}
                onChange={(e) => setNewBuyingPrice(e.target.value)}
                placeholder="Enter new buying price"
              />
              <p className="text-xs text-muted-foreground">
                This will update the Super Admin's earning and, if the student has a selling price, will automatically recompute the partner's profit and commission.
              </p>
              <Button variant="gradient" className="w-full" onClick={handleSaveBuyingPrice} isLoading={isSavingBuyingPrice}>
                Save Buying Price
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timeline Note Modal */}
      {editingTimelineId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Timeline Note</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingTimelineId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  rows={4}
                  placeholder="Enter note..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingTimelineId(null)}>
                  Cancel
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleSaveNote} isLoading={isSavingNote}>
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Internal Note Modal */}
      {editingInternalNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Internal Note</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingInternalNoteId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea
                  value={editingInternalNoteText}
                  onChange={(e) => setEditingInternalNoteText(e.target.value)}
                  rows={5}
                  placeholder="Enter note..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingInternalNoteId(null)}>
                  Cancel
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleSaveInternalNote} isLoading={isSavingInternalNote}>
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Timeline Entry Confirmation */}
      <ConfirmDialog
        open={!!deletingTimelineId}
        onOpenChange={(open) => !open && setDeletingTimelineId(null)}
        title="Delete this timeline entry?"
        description="This will permanently remove this timeline entry. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeletingTimeline}
        onConfirm={handleDeleteTimelineEntry}
      />

      {/* Delete Internal Note Confirmation */}
      <ConfirmDialog
        open={!!deletingInternalNoteId}
        onOpenChange={(open) => !open && setDeletingInternalNoteId(null)}
        title="Delete this note?"
        description="This internal note will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeletingInternalNote}
        onConfirm={handleDeleteInternalNote}
      />
    </div>
  );
}