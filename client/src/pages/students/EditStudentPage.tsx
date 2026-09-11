import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ArrowLeft, Save, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormInput } from "@/components/forms/FormInput";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { SuggestionInput } from "@/components/forms/SuggestionInput";
import { ErrorState } from "@/components/common/ErrorState";
import { studentService } from "@/services/student.service";
import { ROUTES, buildPath } from "@/constants/routes.constant";

interface FormState {
  fullName: string;
  mobile: string;
  gender: "male" | "female" | "other";
  collegeName: string;
  universityName: string;
  course: string;
  semester: string;
  serviceType: "prepaid" | "postpaid";
  sellingPrice: string;
  buyingPrice: string;
}

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    mobile: "",
    gender: "male",
    collegeName: "",
    universityName: "",
    course: "",
    semester: "",
    serviceType: "prepaid",
    sellingPrice: "",
    buyingPrice: "",
  });

  const [originalServiceType, setOriginalServiceType] = useState<"prepaid" | "postpaid">("prepaid");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudent = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const student = await studentService.getById(id);
      setForm({
        fullName: student.fullName,
        mobile: student.mobile,
        gender: student.gender,
        collegeName: student.collegeName,
        universityName: student.universityName || "",
        course: student.course || "",
        semester: student.semester || "",
        serviceType: student.serviceType,
        sellingPrice: student.sellingPrice ?? "",
        buyingPrice: student.buyingPrice ?? "",
      });
      setOriginalServiceType(student.serviceType);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load student"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSaving(true);
    try {
      const payload: any = {
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        collegeName: form.collegeName.trim(),
        universityName: form.universityName.trim() || undefined,
        course: form.course.trim() || undefined,
        semester: form.semester.trim() || undefined,
        serviceType: form.serviceType,
        sellingPrice: form.sellingPrice === "" ? null : Number(form.sellingPrice),
        buyingPrice: form.buyingPrice === "" ? undefined : Number(form.buyingPrice),
      };
      await studentService.update(id, payload);
      toast.success("Student updated successfully");
      navigate(buildPath(ROUTES.STUDENT_DETAILS, { id }));
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update student");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load this student's details." onRetry={fetchStudent} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const serviceTypeChanging = form.serviceType !== originalServiceType;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
      <Link
        to={buildPath(ROUTES.STUDENT_DETAILS, { id: id! })}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Student
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Edit Student
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Update student details, service type, and pricing. Super Admin only.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-0">
            <FormInput
              label="Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <PhoneInput
              label="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
            />
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender || ""} onValueChange={(v) => setForm({ ...form, gender: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* College Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">College Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-0">
            <SuggestionInput
              label="College Name"
              value={form.collegeName}
              onValueChange={(v) => setForm({ ...form, collegeName: v })}
              fetchSuggestions={(s) => studentService.getFieldSuggestions("college", s)}
              required
            />
            <SuggestionInput
              label="University Name"
              value={form.universityName}
              onValueChange={(v) => setForm({ ...form, universityName: v })}
              fetchSuggestions={(s) => studentService.getFieldSuggestions("university", s)}
            />
            <SuggestionInput
              label="Course"
              value={form.course}
              onValueChange={(v) => setForm({ ...form, course: v })}
              fetchSuggestions={(s) => studentService.getFieldSuggestions("course", s)}
            />
            <SuggestionInput
              label="Semester"
              value={form.semester}
              onValueChange={(v) => setForm({ ...form, semester: v })}
              fetchSuggestions={(s) => studentService.getFieldSuggestions("semester", s)}
            />
          </CardContent>
        </Card>

        {/* Service + Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select
                value={form.serviceType || ""}
                onValueChange={(v) => setForm({ ...form, serviceType: v as any })}
              >
                <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Prepaid Service</SelectItem>
                  <SelectItem value="postpaid">Postpaid Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serviceTypeChanging && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2.5 text-xs text-warning-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                <div>
                  <p className="font-semibold">Service type is changing</p>
                  <p className="mt-0.5">
                    From <span className="font-medium">{originalServiceType}</span> to{" "}
                    <span className="font-medium">{form.serviceType}</span>. The buying price will be
                    recalculated from the partner's rate for the new service type. Any pending commission
                    will also be updated accordingly.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                label="Selling Price (₹)"
                type="number"
                step="any"
                placeholder="Leave blank if not decided yet"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              />
              <FormInput
                label="Buying Price (₹)"
                type="number"
                step="any"
                placeholder={serviceTypeChanging ? "Will auto-update from partner rate" : "Override if needed"}
                value={form.buyingPrice}
                onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(buildPath(ROUTES.STUDENT_DETAILS, { id: id! }))}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSaving}>
            {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}