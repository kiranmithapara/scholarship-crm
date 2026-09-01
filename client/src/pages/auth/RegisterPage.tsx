import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { registerSchema, type RegisterFormValues } from "@/utils/validation.schemas";
import { ROUTES } from "@/constants/routes.constant";

/** RegisterPage - Page 2. Full Name, Mobile, Email, Username, Password, Confirm Password -> Email OTP. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", mobile: "", email: "", username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const { email } = await authService.register(values);
      toast.success("Account created! Please verify your email.");
      navigate(ROUTES.VERIFY_OTP, { state: { email } });
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Registration failed. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Register as a Referral Partner to get started.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormInput label="Full Name" placeholder="Ramesh Patel" error={errors.fullName?.message} {...register("fullName")} />

        <FormInput
          label="Mobile Number"
          type="tel"
          placeholder="9876543210"
          maxLength={10}
          error={errors.mobile?.message}
          {...register("mobile")}
        />

        <FormInput label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />

        <FormInput label="Username" placeholder="ramesh_p" error={errors.username?.message} {...register("username")} />

        <FormInput
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          error={errors.password?.message}
          rightElement={
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("password")}
        />

        <FormInput
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("confirmPassword")}
        />

        <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={isSubmitting}>
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}
