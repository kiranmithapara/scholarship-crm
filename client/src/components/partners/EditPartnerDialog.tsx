import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Camera, Eye, EyeOff, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { partnerService } from "@/services/partner.service";
import type { ReferralPartner } from "@/types/partner.types";

const editPartnerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required (min 2 characters)"),
  email: z.string().trim().email("Enter a valid email address"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  username: z
    .string()
    .optional()
    .refine((val) => !val || (val.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(val.trim())), {
      message: "Username must be at least 3 characters and contain only letters, numbers and underscores",
    }),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters if provided",
    }),
  prepaidCost: z.string().optional(),
  postpaidCost: z.string().optional(),
});

type EditPartnerFormValues = z.infer<typeof editPartnerSchema>;

interface EditPartnerDialogProps {
  partner: ReferralPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPartnerDialog({ partner, open, onOpenChange, onSuccess }: EditPartnerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EditPartnerFormValues>({
    resolver: zodResolver(editPartnerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      username: "",
      password: "",
      prepaidCost: "",
      postpaidCost: "",
    },
  });

  useEffect(() => {
    if (partner && open) {
      form.reset({
        fullName: partner.fullName || "",
        email: partner.email || "",
        mobile: partner.mobile || "",
        username: partner.username || "",
        password: "",
        prepaidCost: partner.prepaidCost ? String(partner.prepaidCost) : "",
        postpaidCost: partner.postpaidCost ? String(partner.postpaidCost) : "",
      });
      setSelectedFile(null);
      setPreviewUrl(partner.photoUrl ?? null);
      setShowPassword(false);
    }
  }, [partner, open, form]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be under 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowPassword(false);
    onOpenChange(false);
  };

  const onSubmit = async (values: EditPartnerFormValues) => {
    if (!partner) return;
    try {
      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("email", values.email);
      formData.append("mobile", values.mobile);
      if (values.username && values.username.trim()) {
        formData.append("username", values.username.trim());
      }
      if (values.password && values.password.trim()) {
        formData.append("password", values.password.trim());
      }
      if (values.prepaidCost !== undefined) {
        formData.append("prepaidCost", values.prepaidCost);
      }
      if (values.postpaidCost !== undefined) {
        formData.append("postpaidCost", values.postpaidCost);
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await partnerService.update(partner.id, formData);
      toast.success("Referral partner updated successfully");
      handleClose();
      onSuccess();
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(message ?? "Could not update referral partner");
    }
  };

  const fullNameValue = form.watch("fullName");

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(val))}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> Edit Referral Partner
          </DialogTitle>
          <DialogDescription>
            Update account details, contact info, pricing, or reset login password for this partner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
          {/* Profile Photo */}
          <div className="flex flex-col items-center justify-center gap-2 pb-2">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={previewUrl ?? undefined} alt="Preview" />
                <AvatarFallback className="text-lg">
                  {fullNameValue ? getInitials(fullNameValue) : "RP"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary-700"
                aria-label="Upload photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">Change Profile Photo (Optional)</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              error={form.formState.errors.fullName?.message}
              {...form.register("fullName")}
            />
            <FormInput
              label="Mobile Number"
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile"
              error={form.formState.errors.mobile?.message}
              {...form.register("mobile")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Email Address"
              type="email"
              placeholder="partner@example.com"
              error={form.formState.errors.email?.message}
              {...form.register("email")}
            />
            <FormInput
              label="Username"
              placeholder="e.g. rahul_sharma"
              error={form.formState.errors.username?.message}
              {...form.register("username")}
            />
          </div>

          <FormInput
            label="New Password (Optional)"
            type={showPassword ? "text" : "password"}
            placeholder="Leave blank to keep existing password"
            error={form.formState.errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...form.register("password")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Prepaid Cost (₹)"
              type="number"
              step="any"
              placeholder="e.g. 5000"
              error={form.formState.errors.prepaidCost?.message}
              {...form.register("prepaidCost")}
            />
            <FormInput
              label="Postpaid Cost (₹)"
              type="number"
              step="any"
              placeholder="e.g. 8000"
              error={form.formState.errors.postpaidCost?.message}
              {...form.register("postpaidCost")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" isLoading={form.formState.isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
