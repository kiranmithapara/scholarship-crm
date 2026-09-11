import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

/**
 * Auto-sanitize Indian mobile numbers:
 *   "+91 74349 32393" -> "7434932393"
 *   "+917434932393"   -> "7434932393"
 *   "07434932393"     -> "7434932393"
 *   "74349 32393"     -> "7434932393"
 *   "7434932393"      -> "7434932393"
 */
function sanitizeIndianMobile(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length > 10) digits = digits.slice(0, 10);
  return digits;
}

/**
 * PhoneInput - Indian mobile input with fixed +91 prefix and auto-sanitization.
 * Works seamlessly with react-hook-form's register() spread.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, id, className, onChange, ...props }, ref) => {
    const inputId = id ?? props.name;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeIndianMobile(e.target.value);
      e.target.value = sanitized;
      onChange?.(e);
    };

    return (
      <div className="space-y-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-muted-foreground">
            +91
          </span>
          <Input
            id={inputId}
            ref={ref}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            onChange={handleChange}
            aria-invalid={!!error}
            className={cn("pl-12", error && "border-danger focus-visible:ring-danger", className)}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export default PhoneInput;