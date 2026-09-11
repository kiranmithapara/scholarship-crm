import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  ArrowLeft,
  IndianRupee,
  Save,
  Trash2,
  Wallet,
  RotateCcw,
  Plus,
  X,
  CheckCheck,
  StickyNote,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { QuickActions } from "@/components/common/QuickActions";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormInput } from "@/components/forms/FormInput";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { SuggestionInput } from "@/components/forms/SuggestionInput";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EditPartnerDialog } from "@/components/partners/EditPartnerDialog";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { partnerService } from "@/services/partner.service";
import { studentService } from "@/services/student.service";
import { getInitials, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ROUTES, buildPath } from "@/constants/routes.constant";
import type { CommissionItem, ReferralPartner } from "@/types/partner.types";
import type { CreateStudentInput } from "@/types/student.types";

export default function ReferralPartnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = usePartnerProfile(id);

  const [prepaidCost, setPrepaidCost] = useState("");
  const [postpaidCost, setPostpaidCost] = useState("");
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isEditPartnerOpen, setIsEditPartnerOpen] = useState(false);

  const [commissions, setCommissions] = useState<CommissionItem[] | null>(null);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [updatingCommissionId, setUpdatingCommissionId] = useState<string | null>(null);

  // Add Student modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    mobile: "",
    gender: "male",
    collegeName: "",
    universityName: "",
    course: "",
    semester: "",
    serviceType: "prepaid",
    sellingPrice: "",
  });
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Partner Notes state
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const fetchCommissions = () => {
    if (!id) return;
    setCommissionsLoading(true);
    partnerService
      .getCommissions(id)
      .then(setCommissions)
      .catch(() => setCommissions([]))
      .finally(() => setCommissionsLoading(false));
  };

  useEffect(() => {
    if (!data) return;
    setPrepaidCost(data.partner.prepaidCost ? String(data.partner.prepaidCost) : "1500");
    setPostpaidCost(data.partner.postpaidCost ? String(data.partner.postpaidCost) : "4500");
  }, [data]);

  useEffect(fetchCommissions, [id]);

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState description="We couldn't load this partner's profile." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !data || !id) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { partner, stats, students } = data;

  const handleSavePricing = async () => {
    const prepaid = Number(prepaidCost);
    const postpaid = Number(postpaidCost);
    if (Number.isNaN(prepaid) || Number.isNaN(postpaid) || prepaid < 0 || postpaid < 0) {
      toast.error("Enter valid, non-negative prices for both service types");
      return;
    }
    setIsSavingPricing(true);
    try {
      await partnerService.updatePricing(id, prepaid, postpaid);
      toast.success("Pricing updated successfully");
      refetch();
    } catch {
      toast.error("Could not update pricing");
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleToggleCommission = async (commission: CommissionItem) => {
    if (!id) return;
    const nextStatus = commission.status === "pending" ? "paid" : "pending";
    setUpdatingCommissionId(commission.id);
    try {
      await partnerService.updateCommissionStatus(id, commission.id, nextStatus);
      toast.success(`Commission marked as ${nextStatus}`);
      fetchCommissions();
      refetch();
    } catch {
      toast.error("Could not update commission status");
    } finally {
      setUpdatingCommissionId(null);
    }
  };

  const handleMarkAllPaid = async () => {
    if (!id) return;
    setIsMarkingAll(true);
    try {
      const result = await partnerService.markAllCommissionsPaid(id);
      toast.success(`Marked ${result.count} commission(s) as paid`);
      fetchCommissions();
      refetch();
    } catch {
      toast.error("Could not mark all commissions as paid");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingStudent(true);
    try {
      const sellingPrice =
        studentForm.sellingPrice === "" || studentForm.sellingPrice == null
          ? undefined
          : Number(studentForm.sellingPrice);

      const payload: CreateStudentInput = {
        fullName: studentForm.fullName,
        mobile: studentForm.mobile,
        gender: studentForm.gender as "male" | "female" | "other",
        collegeName: studentForm.collegeName,
        universityName: studentForm.universityName,
        course: studentForm.course,
        semester: studentForm.semester,
        serviceType: studentForm.serviceType as "prepaid" | "postpaid",
        sellingPrice,
      };
      await studentService.create(payload, partner.id);
      toast.success("Student added successfully");
      setShowAddStudent(false);
      setStudentForm({
        fullName: "",
        mobile: "",
        gender: "male",
        collegeName: "",
        universityName: "",
        course: "",
        semester: "",
        serviceType: "prepaid",
        sellingPrice: "",
      });
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not add student");
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Partner Notes handlers
  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setIsAddingNote(true);
    try {
      await partnerService.addNote(id, newNote.trim());
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

  const handleSaveEditNote = async () => {
    if (!editingNoteId || !id) return;
    if (!editingNoteText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    setIsSavingNote(true);
    try {
      await partnerService.updateNote(id, editingNoteId, editingNoteText.trim());
      toast.success("Note updated");
      setEditingNoteId(null);
      setEditingNoteText("");
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingNoteId || !id) return;
    setIsDeletingNote(true);
    try {
      await partnerService.deleteNote(id, deletingNoteId);
      toast.success("Note deleted");
      setDeletingNoteId(null);
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not delete note");
    } finally {
      setIsDeletingNote(false);
    }
  };

  const hasPendingCommissions = commissions?.some((c) => c.status === "pending") ?? false;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <Link to={ROUTES.REFERRAL_PARTNERS} className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Referral Partners
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 border border-border">
              <AvatarImage src={partner.photoUrl ?? undefined} alt={partner.fullName} />
              <AvatarFallback className="text-base sm:text-lg">{getInitials(partner.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{partner.fullName}</h1>
                <Badge variant={partner.isActive ? "success" : "danger"}>{partner.isActive ? "Active" : "Blocked"}</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate" title={partner.email}>{partner.email}</p>
              <p className="text-xs text-muted-foreground">Joined {formatDate(partner.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t border-border/50 lg:border-t-0">
            <QuickActions mobile={partner.mobile} whatsappMessage={`Hi ${partner.fullName}, `} />
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsEditPartnerOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Partner
            </Button>
            <Button variant="gradient" size="sm" className="flex-1 sm:flex-none" onClick={() => setShowAddStudent(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Student
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="mb-2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <GraduationCap className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Prepaid Students</p>
            <p className="text-lg sm:text-xl font-semibold text-foreground">{stats.prepaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="mb-2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <GraduationCap className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Postpaid Students</p>
            <p className="text-lg sm:text-xl font-semibold text-foreground">{stats.postpaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="mb-2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Commission Pending</p>
            <p className="text-lg sm:text-xl font-semibold text-foreground">{formatCurrency(stats.commission.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="mb-2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Commission Paid</p>
            <p className="text-lg sm:text-xl font-semibold text-foreground">{formatCurrency(stats.commission.paid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing editor */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4" /> Partner Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            The buying (cost) price this partner pays per service type. This becomes the reference cost when they add a new student -
            their profit is automatically calculated as Selling Price minus this Buying Price.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
            <FormInput
              label="Prepaid Service Cost (₹)"
              type="number"
              value={prepaidCost}
              onChange={(e) => setPrepaidCost(e.target.value)}
              placeholder="1500"
            />
            <FormInput
              label="Postpaid Service Cost (₹)"
              type="number"
              value={postpaidCost}
              onChange={(e) => setPostpaidCost(e.target.value)}
              placeholder="4500"
            />
          </div>
          <Button variant="gradient" size="sm" className="mt-4 w-full sm:w-auto" onClick={handleSavePricing} isLoading={isSavingPricing}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save Pricing
          </Button>
        </CardContent>
      </Card>

      {/* Commissions list */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-1.5">
            <Wallet className="h-4 w-4" /> Commissions
          </CardTitle>
          {hasPendingCommissions && (
            <Button variant="gradient" size="sm" className="w-full sm:w-auto" onClick={handleMarkAllPaid} isLoading={isMarkingAll}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark All as Paid
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {commissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <EmptyState icon={Wallet} title="No commissions yet" description="Commissions are created automatically once an application is verified." />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Service Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                      <td className="py-3">
                        <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: commission.student.id })} className="font-medium text-foreground hover:text-primary">
                          {commission.student.fullName}
                        </Link>
                      </td>
                      <td className="py-3 capitalize text-muted-foreground">{commission.student.serviceType}</td>
                      <td className="py-3 font-medium text-foreground">{formatCurrency(Number(commission.amount))}</td>
                      <td className="py-3">
                        <StatusBadge status={commission.status} />
                        {commission.paidAt && <p className="mt-0.5 text-xs text-muted-foreground">Paid {formatDate(commission.paidAt)}</p>}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant={commission.status === "pending" ? "gradient" : "outline"}
                          size="sm"
                          className="text-xs h-8 px-2.5 whitespace-nowrap"
                          onClick={() => handleToggleCommission(commission)}
                          isLoading={updatingCommissionId === commission.id}
                        >
                          {commission.status === "pending" ? (
                            <>
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark as Paid
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Revert to Pending
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students list as CARDS */}
      <div>
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Students ({students.length})</h2>
        </div>

        {students.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students yet" description="This partner hasn't added any students." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id} className="transition-shadow hover:shadow-soft-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })} className="font-medium text-foreground hover:text-primary block truncate">
                        {student.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{student.collegeName}</p>
                    </div>
                    <StatusBadge status={student.status} />
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{student.serviceType} Service</span>
                    <span>•</span>
                    <span>{formatDate(student.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <QuickActions mobile={student.mobile} whatsappMessage={`Hi ${student.fullName}, `} />
                    <Button asChild variant="ghost" size="sm" className="text-xs h-8">
                      <Link to={buildPath(ROUTES.STUDENT_DETAILS, { id: student.id })}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Partner Notes section */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-1.5">
            <StickyNote className="h-4 w-4" /> Notes about {partner.fullName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="space-y-2 rounded-lg border border-dashed border-border p-3.5 sm:p-4">
            <Label className="text-xs sm:text-sm">Add New Note</Label>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder={`What did ${partner.fullName} say? e.g. "Spoke to 4 students yesterday about receipts"...`}
              className="text-sm"
            />
            <Button
              variant="gradient"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleAddNote}
              isLoading={isAddingNote}
              disabled={!newNote.trim()}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Note
            </Button>
          </div>

          {!data.notes || data.notes.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Add your first note about this partner above."
            />
          ) : (
            <div className="space-y-3">
              {data.notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border bg-muted/30 p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap flex-1 break-words">
                      {note.note}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit note"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingNoteText(note.note);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:bg-danger/10"
                        title="Delete note"
                        onClick={() => setDeletingNoteId(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] sm:text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)} • {note.author?.fullName ?? "Unknown"}
                    {note.updatedAt !== note.createdAt && " • edited"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">Add Student for {partner.fullName}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddStudent(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="Student's full name"
                  required
                />
                <PhoneInput
                  label="Mobile"
                  value={studentForm.mobile}
                  onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  required
                />
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={studentForm.gender || ""} onValueChange={(v) => setStudentForm({ ...studentForm, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SuggestionInput
                  label="College Name"
                  placeholder="Start typing college name..."
                  value={studentForm.collegeName}
                  onValueChange={(v) => setStudentForm({ ...studentForm, collegeName: v })}
                  fetchSuggestions={(s) => studentService.getFieldSuggestions("college", s)}
                  required
                />

                <SuggestionInput
                  label="University Name"
                  placeholder="Start typing university name..."
                  value={studentForm.universityName}
                  onValueChange={(v) => setStudentForm({ ...studentForm, universityName: v })}
                  fetchSuggestions={(s) => studentService.getFieldSuggestions("university", s)}
                />

                <SuggestionInput
                  label="Course"
                  placeholder="Start typing course..."
                  value={studentForm.course}
                  onValueChange={(v) => setStudentForm({ ...studentForm, course: v })}
                  fetchSuggestions={(s) => studentService.getFieldSuggestions("course", s)}
                />

                <SuggestionInput
                  label="Semester"
                  placeholder="Start typing semester..."
                  value={studentForm.semester}
                  onValueChange={(v) => setStudentForm({ ...studentForm, semester: v })}
                  fetchSuggestions={(s) => studentService.getFieldSuggestions("semester", s)}
                />

                <div className="space-y-1.5">
                  <Label>Service Type</Label>
                  <Select value={studentForm.serviceType || ""} onValueChange={(v) => setStudentForm({ ...studentForm, serviceType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prepaid Service</SelectItem>
                      <SelectItem value="postpaid">Postpaid Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FormInput
                  label="Selling Price (₹)"
                  type="number"
                  value={studentForm.sellingPrice}
                  onChange={(e) => setStudentForm({ ...studentForm, sellingPrice: e.target.value })}
                  placeholder="Leave blank if not decided yet"
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" isLoading={isAddingStudent}>
                Add Student
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Note Modal */}
      {editingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">Edit Note</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingNoteId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea
                  value={editingNoteText}
                  onChange={(e) => setEditingNoteText(e.target.value)}
                  rows={5}
                  placeholder="Enter note..."
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingNoteId(null)}>
                  Cancel
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleSaveEditNote} isLoading={isSavingNote}>
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Partner Note Confirmation */}
      <ConfirmDialog
        open={!!deletingNoteId}
        onOpenChange={(open) => !open && setDeletingNoteId(null)}
        title="Delete this note?"
        description="This note will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeletingNote}
        onConfirm={handleDeleteNote}
      />

      <EditPartnerDialog
        open={isEditPartnerOpen}
        partner={partner as unknown as ReferralPartner}
        onOpenChange={setIsEditPartnerOpen}
        onSuccess={refetch}
      />
    </div>
  );
}