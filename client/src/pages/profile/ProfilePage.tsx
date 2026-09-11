import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Camera, KeyRound, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormInput } from "@/components/forms/FormInput";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { getInitials } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short"),
  email: z.string().trim().email("Enter a valid email address"),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  currentPassword: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain a letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      mobile: user?.mobile ?? "",
      currentPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        mobile: user.mobile || "",
        currentPassword: "",
      });
    }
  }, [user, profileForm]);

  const watchedEmail = profileForm.watch("email");
  const isEmailChanged =
    !!user?.email &&
    (watchedEmail || "").trim().toLowerCase() !== (user.email || "").trim().toLowerCase();

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const updatedUser = await userService.uploadPhoto(file);
      setUser(updatedUser);
      toast.success("Profile photo updated");
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not upload photo");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSaveProfile = async (values: ProfileFormValues) => {
    if (isEmailChanged && !values.currentPassword?.trim()) {
      profileForm.setError("currentPassword", {
        message: "Current password is required to change email address",
      });
      toast.error("Please enter your current password to change your email address");
      return;
    }

    try {
      const updatedUser = await userService.updateProfile({
        fullName: values.fullName,
        mobile: values.mobile,
        email: values.email,
        currentPassword: values.currentPassword?.trim() || undefined,
      });
      setUser(updatedUser);
      profileForm.reset({
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        currentPassword: "",
      });
      setShowEmailPw(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not update profile");
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not change password");
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">Manage your account details and security settings.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
          <div className="relative">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback className="text-base sm:text-lg">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary-700"
              aria-label="Change photo"
            >
              <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground truncate">{user.fullName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Edit Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4" noValidate>
            <FormInput label="Full Name" error={profileForm.formState.errors.fullName?.message} {...profileForm.register("fullName")} />

            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              <FormInput
                label="Email Address"
                type="email"
                error={profileForm.formState.errors.email?.message}
                {...profileForm.register("email")}
              />
              <PhoneInput
                label="Mobile Number"
                error={profileForm.formState.errors.mobile?.message}
                {...profileForm.register("mobile")}
              />
            </div>

            {isEmailChanged && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5 text-xs text-warning-foreground">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                  <div>
                    <span className="font-semibold text-warning">Security Verification: </span>
                    You are changing your email from <span className="font-medium text-foreground">{user.email}</span> to <span className="font-medium text-foreground">{watchedEmail}</span>. Enter your current password to confirm this change.
                  </div>
                </div>
                <FormInput
                  label="Current Password (Required for Email Change)"
                  type={showEmailPw ? "text" : "password"}
                  placeholder="Enter your current password"
                  error={profileForm.formState.errors.currentPassword?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowEmailPw((s) => !s)}
                      className="text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showEmailPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...profileForm.register("currentPassword")}
                />
              </div>
            )}

            <Button type="submit" variant="gradient" className="w-full sm:w-auto" isLoading={profileForm.formState.isSubmitting}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-1.5">
            <KeyRound className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4" noValidate>
            <FormInput
              label="Current Password"
              type={showCurrentPw ? "text" : "password"}
              error={passwordForm.formState.errors.currentPassword?.message}
              rightElement={
                <button type="button" onClick={() => setShowCurrentPw((s) => !s)} className="text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...passwordForm.register("currentPassword")}
            />
            <FormInput
              label="New Password"
              type={showNewPw ? "text" : "password"}
              error={passwordForm.formState.errors.newPassword?.message}
              rightElement={
                <button type="button" onClick={() => setShowNewPw((s) => !s)} className="text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...passwordForm.register("newPassword")}
            />
            <FormInput
              label="Confirm New Password"
              type={showNewPw ? "text" : "password"}
              error={passwordForm.formState.errors.confirmNewPassword?.message}
              {...passwordForm.register("confirmNewPassword")}
            />
            <Button type="submit" variant="outline" className="w-full sm:w-auto" isLoading={passwordForm.formState.isSubmitting}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}