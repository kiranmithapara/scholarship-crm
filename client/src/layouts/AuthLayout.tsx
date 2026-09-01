import { GraduationCap, ShieldCheck, Users2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * AuthLayout - split screen used by Login/Register/Forgot Password/OTP pages.
 * Left = brand + gradient illustration (hidden on mobile, shown lg+).
 * Right = the actual form, always full width on small screens.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left - Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-primary p-12 text-white lg:flex">
        {/* Decorative radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Scholarship CRM</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative space-y-8"
        >
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Manage every scholarship application in one place.
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Users2 className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm">Track referral partners and their students in real time</p>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm">Secure document uploads and application verification</p>
            </div>
          </div>
        </motion.div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Scholarship CRM. All rights reserved.</p>
      </div>

      {/* Right - Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-sm">
          {children}
        </motion.div>
      </div>
    </div>
  );
}
