import { Moon, Sun, LogOut, User as UserIcon, Menu, GraduationCap } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes.constant";

interface TopbarProps {
  onMenuClick?: () => void;
}

/** Topbar - mobile menu trigger, theme toggle + user menu, present on every dashboard page. */
export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/70 px-4 sm:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground sm:text-base">Scholarship CRM</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                <AvatarImage src={user?.photoUrl ?? undefined} alt={user?.fullName} />
                <AvatarFallback>{user ? getInitials(user.fullName) : ""}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-soft-lg animate-fade-in"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={() => navigate(ROUTES.PROFILE)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-accent"
              >
                <UserIcon className="h-4 w-4" /> Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={logout}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-danger outline-none hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
