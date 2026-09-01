import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { KeyRound, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormInput } from "@/components/forms/FormInput";
import { OtpInput } from "@/components/forms/OtpInput";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/utils/validation.schemas";
import { ROUTES } from "@/constants/routes.constant";

type Step = "email" | "reset";

/** ForgotPasswordPage - Step 1: request OTP by email. Step 2: OTP + new password. */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmNewPassword: "" },
  });

  const onRequestOtp = async (values: ForgotPasswordFormValues) => {
    try {
      await authService.forgotPassword(values.email);
      setEmail(values.email);
      setStep("reset");
      toast.success("If an account exists, a reset OTP has been sent.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const onResetPassword = async (values: ResetPasswordFormValues) => {
    try {
      await authService.resetPassword(email, values.otp, values.newPassword);
      toast.success("Password reset successfully. Please log in.");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not reset password. The OTP may be invalid or expired.");
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {step === "email" ? "Forgot password?" : "Reset your password"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === "email"
            ? "Enter your email and we'll send you a reset code."
            : `Enter the code sent to ${email} and choose a new password.`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-4" noValidate>
          <FormInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register("email")}
          />
          <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={emailForm.formState.isSubmitting}>
            Send Reset Code
          </Button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Verification Code</label>
            <OtpInput
              value={resetForm.watch("otp")}
              onChange={(val) => resetForm.setValue("otp", val, { shouldValidate: true })}
              error={!!resetForm.formState.errors.otp}
            />
            {resetForm.formState.errors.otp && <p className="text-xs text-danger">{resetForm.formState.errors.otp.message}</p>}
          </div>

          <FormInput
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            error={resetForm.formState.errors.newPassword?.message}
            rightElement={
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...resetForm.register("newPassword")}
          />

          <FormInput
            label="Confirm New Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            error={resetForm.formState.errors.confirmNewPassword?.message}
            {...resetForm.register("confirmNewPassword")}
          />

          <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={resetForm.formState.isSubmitting}>
            Reset Password
          </Button>
        </form>
      )}

      <Link to={ROUTES.LOGIN} className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </Link>
    </AuthLayout>
  );
}
