import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { FileText, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FormInput } from "@/components/forms/FormInput";
import { SuggestionInput } from "@/components/forms/SuggestionInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { studentService } from "@/services/student.service";
import { partnerService } from "@/services/partner.service";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles.constant";
import { ROUTES, buildPath } from "@/constants/routes.constant";

const applyScholarshipSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short"),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  gender: z.enum(["male", "female", "other"], { message: "Please select a gender" }),
  collegeName: z.string().trim().min(2, "College name is required"),
  universityName: z.string().trim().optional(),
  course: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  serviceType: z.enum(["prepaid", "postpaid"], { message: "Please select a service type" }),
  sellingPrice: z.union([z.coerce.number().positive(), z.literal(""), z.undefined()]).optional(),
  referralPartnerId: z.string().optional(),
});
type ApplyScholarshipFormValues = z.infer<typeof applyScholarshipSchema>;

export default function ApplyScholarshipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const [partners, setPartners] = useState<{ id: string; fullName: string }[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    partnerService
      .list({ page: 1, pageSize: 100, status: "active" })
      .then((res) => setPartners(res.items.map((p) => ({ id: p.id, fullName: p.fullName }))))
      .catch(() => setPartners([]));
  }, [isSuperAdmin]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplyScholarshipFormValues>({
    resolver: zodResolver(applyScholarshipSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      gender: "" as any,
      collegeName: "",
      universityName: "",
      course: "",
      semester: "",
      serviceType: "" as any,
      sellingPrice: "",
      referralPartnerId: "",
    },
  });

  const selectedServiceType = watch("serviceType");

  const onSubmit = async (values: ApplyScholarshipFormValues) => {
    try {
      if (isSuperAdmin && !values.referralPartnerId) {
        toast.error("Please select a referral partner");
        return;
      }

      const payload = { ...values };
      if (!isSuperAdmin) delete payload.referralPartnerId;

      const sellingPrice =
        payload.sellingPrice === "" || payload.sellingPrice == null ? undefined : Number(payload.sellingPrice);

      const student = await studentService.create(
        {
          fullName: payload.fullName,
          mobile: payload.mobile,
          gender: payload.gender,
          collegeName: payload.collegeName,
          universityName: payload.universityName,
          course: payload.course,
          semester: payload.semester,
          serviceType: payload.serviceType,
          sellingPrice,
        },
        isSuperAdmin ? payload.referralPartnerId : undefined
      );

      toast.success("Application submitted successfully!");
      navigate(buildPath(ROUTES.STUDENT_DETAILS, { id: student.id }));
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not submit the application. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <Link to={isSuperAdmin ? ROUTES.STUDENTS : ROUTES.MY_STUDENTS} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">New Student Application</h1>
          <p className="text-sm text-muted-foreground">Fill in the student's details to submit a new application.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label>Referral Partner *</Label>
                <Controller
                  control={control}
                  name="referralPartnerId"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select referral partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <FormInput label="Full Name" placeholder="Student's full name" error={errors.fullName?.message} {...register("fullName")} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput label="Mobile Number" type="tel" maxLength={10} placeholder="9876543210" error={errors.mobile?.message} {...register("mobile")} />
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-xs text-danger">{errors.gender.message}</p>}
              </div>
            </div>

            <Controller
              control={control}
              name="collegeName"
              render={({ field }) => (
                <SuggestionInput
                  label="College Name"
                  placeholder="Start typing college name..."
                  value={field.value}
                  onValueChange={field.onChange}
                  fetchSuggestions={(s) => studentService.getFieldSuggestions("college", s)}
                  error={errors.collegeName?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="universityName"
              render={({ field }) => (
                <SuggestionInput
                  label="University Name"
                  placeholder="Start typing university name..."
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  fetchSuggestions={(s) => studentService.getFieldSuggestions("university", s)}
                  error={errors.universityName?.message}
                />
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="course"
                render={({ field }) => (
                  <SuggestionInput
                    label="Course"
                    placeholder="Start typing course..."
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    fetchSuggestions={(s) => studentService.getFieldSuggestions("course", s)}
                    error={errors.course?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="semester"
                render={({ field }) => (
                  <SuggestionInput
                    label="Semester"
                    placeholder="Start typing semester..."
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    fetchSuggestions={(s) => studentService.getFieldSuggestions("semester", s)}
                    error={errors.semester?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Controller
                control={control}
                name="serviceType"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prepaid Service - student pays before receipt</SelectItem>
                      <SelectItem value="postpaid">Postpaid Service - payment after scholarship credited</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceType && <p className="text-xs text-danger">{errors.serviceType.message}</p>}
            </div>

            {selectedServiceType && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                You'll need to upload: <span className="font-medium text-foreground">Aadhaar Card</span>
                {selectedServiceType === "postpaid" && (
                  <>
                    {" "}
                    and <span className="font-medium text-foreground">12th Marksheet</span>
                  </>
                )}{" "}
                after submitting this form.
              </div>
            )}

            <FormInput
              label="Selling Price (₹)"
              type="number"
              placeholder="Leave blank if not decided yet"
              error={errors.sellingPrice?.message as string | undefined}
              {...register("sellingPrice")}
            />

            <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}