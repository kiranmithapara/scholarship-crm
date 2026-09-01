import { useState } from "react";
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
  Send,
  CheckCheck,
  UploadCloud,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FileUploadCard } from "@/components/forms/FileUploadCard";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/student.service";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constant";
import { ROLES } from "@/constants/roles.constant";
import type { DocumentType } from "@/types/student.types";

const timelineLabels: Record<string, string> = {
  application_submitted: "Application Submitted",
  verified: "Verified",
  receipt_uploaded: "Receipt Uploaded",
  correction_requested: "Correction Requested",
  completed: "Completed",
};

/** StudentDetailsPage - Page 7. Tabs: Overview, Documents, Scholarship, Payment, Timeline, Notes. */
export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: student, isLoading, error, refetch } = useStudentDetails(id);

  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [isActing, setIsActing] = useState(false);

  const [mysyNumber, setMysyNumber] = useState("");
  const [mysyPassword, setMysyPassword] = useState("");

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
  const requiredDocs: DocumentType[] = student.plan === "2500" ? ["aadhaar", "hostel_receipt"] : ["aadhaar", "twelfth_marksheet"];
  const docLabels: Record<DocumentType, string> = {
    aadhaar: "Aadhaar Card",
    hostel_receipt: "Hostel Receipt",
    twelfth_marksheet: "12th Marksheet",
  };

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

  const handleSaveScholarship = async () => {
    setIsActing(true);
    try {
      await studentService.updateScholarship(student.id, {
        mysyRegistrationNumber: mysyNumber || undefined,
        mysyPassword: mysyPassword || undefined,
      });
      toast.success("Scholarship details saved");
      refetch();
    } catch {
      toast.error("Could not save scholarship details");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Link to={isSuperAdmin ? ROUTES.STUDENTS : ROUTES.MY_STUDENTS} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{student.fullName}</h1>
              <StatusBadge status={student.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {student.collegeName} • ₹{student.plan} Plan • Referred by {student.referralPartner.fullName}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        <TabsList>
          <TabsTrigger value="overview"><UserIcon className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-1.5 h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="scholarship"><Send className="mr-1.5 h-3.5 w-3.5" />Scholarship</TabsTrigger>
          <TabsTrigger value="payment"><Wallet className="mr-1.5 h-3.5 w-3.5" />Payment</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="mr-1.5 h-3.5 w-3.5" />Timeline</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="mr-1.5 h-3.5 w-3.5" />Notes</TabsTrigger>
        </TabsList>

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
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-medium capitalize text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="scholarship">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <Label>MYSY Registration Number</Label>
                <Input
                  defaultValue={student.mysyRegistrationNumber ?? ""}
                  onChange={(e) => setMysyNumber(e.target.value)}
                  placeholder="Enter MYSY registration number"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>MYSY Password</Label>
                <Input
                  type="password"
                  defaultValue={student.mysyPassword ?? ""}
                  onChange={(e) => setMysyPassword(e.target.value)}
                  placeholder="Enter MYSY password"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm text-muted-foreground">Scholarship Status</span>
                <StatusBadge status={student.scholarshipStatus} />
              </div>
              <Button variant="gradient" size="sm" onClick={handleSaveScholarship} isLoading={isActing}>
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Save Scholarship Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardContent className="p-6">
              {student.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment records yet.</p>
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

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {student.timeline.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-4 pl-2">
                    {index !== student.timeline.length - 1 && (
                      <div className="absolute left-[7px] top-5 h-full w-px bg-border" />
                    )}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                {student.correctionNote ?? "No notes have been added to this application yet."}
              </p>
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
