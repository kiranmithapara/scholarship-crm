import { MessageCircle, Phone } from "lucide-react";
import { buildWhatsAppLink, buildTelLink } from "@/lib/utils";

interface QuickActionsProps {
  mobile: string;
  whatsappMessage?: string;
}

/** QuickActions - WhatsApp + Call icon buttons, used on every Partner/Student card and table row. */
export function QuickActions({ mobile, whatsappMessage }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={buildWhatsAppLink(mobile, whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex h-8 w-8 items-center justify-center rounded-md text-success transition-colors hover:bg-success/10"
        aria-label="Open WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={buildTelLink(mobile)}
        onClick={(e) => e.stopPropagation()}
        className="flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-50"
        aria-label="Call"
      >
        <Phone className="h-4 w-4" />
      </a>
    </div>
  );
}
