import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { OtpInput } from "@/components/forms/OtpInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/constants/routes.constant";

const RESEND_COOLDOWN_SECONDS = 30;

/** VerifyOtpPage - post-registration Email OTP verification, with resend cooldown. */
export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const email = (location.state as { email?: string })?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Guard: someone landing here directly without going through registration
  if (!email) {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Enter the complete 6-digit OTP");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { user, accessToken, refreshToken } = await authService.verifyOtp(email, otp);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      toast.success("Email verified! Welcome to Scholarship CRM.");
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(message ?? "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendOtp(email);
      toast.success("A new OTP has been sent to your email");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      toast.error("Could not resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We've sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-5">
        <OtpInput value={otp} onChange={setOtp} error={!!error} />
        {error && <p className="text-center text-xs text-danger">{error}</p>}

        <Button variant="gradient" size="lg" className="w-full" isLoading={isSubmitting} onClick={handleVerify}>
          Verify Email
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          {cooldown > 0 ? (
            <span className="text-muted-foreground/70">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}
        </p>
      </div>
    </AuthLayout>
  );
}
