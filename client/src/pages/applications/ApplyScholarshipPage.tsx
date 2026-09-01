import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { studentService } from "@/services/student.service";
import { ROUTES, buildPath } from "@/constants/routes.constant";

const applyScholarshipSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short"),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  gender: z.enum(["male", "female", "other"], { message: "Please select a gender" }),
  collegeName: z.string().trim().min(2, "College name is required"),
  universityName: z.string().trim().min(2, "University name is required"),
  course: z.string().trim().min(2, "Course is required"),
  semester: z.string().trim().min(1, "Semester is required"),
  plan: z.enum(["2500", "5000"], { message: "Please select a plan" }),
  mysyRegistrationNumber: z.string().trim().optional(),
  mysyPassword: z.string().trim().optional(),
});
type ApplyScholarshipFormValues = z.infer<typeof applyScholarshipSchema>;

/** ApplyScholarshipPage - Page 8. Referral Admin submits a new scholarship application.
 * Document upload (Aadhaar + plan-specific doc) happens on the Student Details page right after,
 * since Firebase upload needs a student id to attach documents to. */
export default function ApplyScholarshipPage() {
  const navigate = useNavigate();

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
      collegeName: "",
      universityName: "",
      course: "",
      semester: "",
      mysyRegistrationNumber: "",
      mysyPassword: "",
    },
  });

  const selectedPlan = watch("plan");

  const onSubmit = async (values: ApplyScholarshipFormValues) => {
    try {
      const student = await studentService.create(values);
      toast.success("Application submitted! Now upload the required documents.");
      navigate(buildPath(ROUTES.STUDENT_DETAILS, { id: student.id }));
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not submit the application. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link to={ROUTES.MY_STUDENTS} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Students
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Apply for Scholarship</h1>
          <p className="text-sm text-muted-foreground">Fill in the student's details to submit a new application.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormInput label="Full Name" placeholder="Student's full name" error={errors.fullName?.message} {...register("fullName")} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput label="Mobile Number" type="tel" maxLength={10} placeholder="9876543210" error={errors.mobile?.message} {...register("mobile")} />
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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

            <FormInput label="College Name" placeholder="e.g. Government Engineering College" error={errors.collegeName?.message} {...register("collegeName")} />
            <FormInput label="University Name" placeholder="e.g. Gujarat Technological University" error={errors.universityName?.message} {...register("universityName")} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput label="Course" placeholder="e.g. B.Tech Computer Engineering" error={errors.course?.message} {...register("course")} />
              <FormInput label="Semester" placeholder="e.g. 5th Semester" error={errors.semester?.message} {...register("semester")} />
            </div>

            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Controller
                control={control}
                name="plan"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2500">₹2500 - Aadhaar + Hostel Receipt</SelectItem>
                      <SelectItem value="5000">₹5000 - Aadhaar + 12th Marksheet</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.plan && <p className="text-xs text-danger">{errors.plan.message}</p>}
            </div>

            {selectedPlan && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                You'll need to upload: <span className="font-medium text-foreground">Aadhaar Card</span> and{" "}
                <span className="font-medium text-foreground">{selectedPlan === "2500" ? "Hostel Receipt" : "12th Marksheet"}</span> after
                submitting this form.
              </div>
            )}

            <FormInput
              label="MYSY Registration Number (optional)"
              placeholder="Enter if already registered"
              error={errors.mysyRegistrationNumber?.message}
              {...register("mysyRegistrationNumber")}
            />
            <FormInput
              label="MYSY Password (optional)"
              type="password"
              placeholder="Enter if already registered"
              error={errors.mysyPassword?.message}
              {...register("mysyPassword")}
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
