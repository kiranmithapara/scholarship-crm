import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Camera, KeyRound, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { getInitials } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short"),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
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

/** ProfilePage - Page 10. Photo, Name, Email, Mobile, Username, Edit + Change Password. */
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? "", mobile: user?.mobile ?? "" },
  });

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
    try {
      const updatedUser = await userService.updateProfile(values);
      setUser(updatedUser);
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
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details and security settings.</p>
      </div>

      {/* Photo + basic info */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback className="text-lg">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary-700"
              aria-label="Change photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4" noValidate>
            <FormInput label="Full Name" error={profileForm.formState.errors.fullName?.message} {...profileForm.register("fullName")} />
            <FormInput
              label="Mobile Number"
              type="tel"
              maxLength={10}
              error={profileForm.formState.errors.mobile?.message}
              {...profileForm.register("mobile")}
            />
            <Button type="submit" variant="gradient" isLoading={profileForm.formState.isSubmitting}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
            <Button type="submit" variant="outline" isLoading={passwordForm.formState.isSubmitting}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
