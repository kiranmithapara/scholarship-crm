import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

/**
 * FormInput - Label + Input + error message, wired for react-hook-form's register() spread.
 * Used across every form in the app (Login, Register, Apply Scholarship, Profile, etc.)
 * so error styling and spacing stay 100% consistent.
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, rightElement, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="space-y-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            className={cn(error && "border-danger focus-visible:ring-danger", rightElement && "pr-10", className)}
            {...props}
          />
          {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";
