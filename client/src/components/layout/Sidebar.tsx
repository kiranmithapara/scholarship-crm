import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Settings,
  ScrollText,
  History,
  UserCircle,
  X,
  StickyNote,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles.constant";
import { ROUTES } from "@/constants/routes.constant";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const superAdminNav: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Referral Partners", href: ROUTES.REFERRAL_PARTNERS, icon: Users },
  { label: "Students", href: ROUTES.STUDENTS, icon: GraduationCap },
  { label: "Deleted Students", href: ROUTES.DELETED_STUDENTS, icon: Trash2 },
  { label: "My Notes", href: ROUTES.ADMIN_NOTES, icon: StickyNote },
  { label: "Login Logs", href: ROUTES.LOGIN_LOGS, icon: ScrollText },
  { label: "Activity Logs", href: ROUTES.ACTIVITY_LOGS, icon: History },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
];

const referralAdminNav: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "My Students", href: ROUTES.MY_STUDENTS, icon: GraduationCap },
  { label: "Apply Scholarship", href: ROUTES.APPLY_SCHOLARSHIP, icon: FileText },
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
];

interface SidebarContentProps {
  onNavClick?: () => void;
}

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user?.role === ROLES.SUPER_ADMIN ? superAdminNav : referralAdminNav;

  /**
   * Custom active check - resolves double-highlight issues (e.g., /students vs /students/deleted).
   */
  const isItemActive = (href: string): boolean => {
    const path = location.pathname;

    // Exact match
    if (path === href) return true;

    // Students is active for /students/:id (student detail) but NOT for /students/deleted
    if (href === ROUTES.STUDENTS) {
      return path.startsWith("/students/") && !path.startsWith(ROUTES.DELETED_STUDENTS);
    }

    // Referral Partners stays active when viewing a specific partner profile
    if (href === ROUTES.REFERRAL_PARTNERS) {
      return path.startsWith("/referral-partners/");
    }

    return false;
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white">
            <GraduationCap className="h-4.5 w-4.5" />
          </div>
          <span className="text-base font-semibold text-foreground">Scholarship CRM</span>
        </div>
        {onNavClick && (
          <button
            onClick={onNavClick}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

/** Desktop Sidebar - fixed on left for large screens (`lg:flex`). */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <SidebarContent />
    </aside>
  );
}

/** Mobile Sidebar - slide-over drawer for mobile and tablet screens (`lg:hidden`). */
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card shadow-soft-lg animate-fade-in">
        <SidebarContent onNavClick={onClose} />
      </div>
    </div>
  );
}