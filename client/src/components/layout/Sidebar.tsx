import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Settings,
  ScrollText,
  History,
  UserCircle,
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

/** Sidebar - primary navigation, nav items differ entirely by role (Super Admin vs Referral Admin). */
export function Sidebar() {
  const { user } = useAuth();
  const navItems = user?.role === ROLES.SUPER_ADMIN ? superAdminNav : referralAdminNav;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white">
          <GraduationCap className="h-4.5 w-4.5" />
        </div>
        <span className="text-base font-semibold text-foreground">Scholarship CRM</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
