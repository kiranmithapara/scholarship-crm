import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import type { AuthContextValue, LoginPayload, User } from "@/types/auth.types";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider - poore app ko user session provide karta hai.
 * App load hote hi localStorage se token check karta hai, agar mile to /auth/me
 * hit karke fresh user data leke aata hai (taaki stale role/status pe bharosa na ho).
 *
 * Agar super admin user ko block kar deta hai, to immediate session verification se user
 * automatically log out ho jata hai aur koi unauthorized action nahi kar sakta.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasShownBlockedToast = useRef(false);

  const handleBlockedUser = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUserState(null);
    if (!hasShownBlockedToast.current) {
      hasShownBlockedToast.current = true;
      toast.error("Your account has been deactivated or blocked by administrator.", {
        id: "account-blocked-alert",
      });
      setTimeout(() => {
        hasShownBlockedToast.current = false;
      }, 5000);
    }
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  const verifyActiveSession = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const freshUser = await authService.getCurrentUser();
      if (!freshUser.isActive) {
        handleBlockedUser();
        return;
      }
      setUserState(freshUser);
    } catch (err: any) {
      const msg = ((err?.response?.data?.message ?? "") as string).toLowerCase();
      if (
        err?.response?.status === 403 ||
        err?.response?.status === 401 ||
        msg.includes("block") ||
        msg.includes("deactivated")
      ) {
        handleBlockedUser();
      }
    }
  }, [handleBlockedUser]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const freshUser = await authService.getCurrentUser();
        if (!freshUser.isActive) {
          handleBlockedUser();
        } else {
          setUserState(freshUser);
        }
      } catch {
        // Token invalid/expired aur refresh bhi fail - clean slate
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAuth();
  }, [handleBlockedUser]);

  // Periodic heartbeat (every 10s) and on window focus/tab switch while logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      verifyActiveSession();
    }, 10000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        verifyActiveSession();
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [user, verifyActiveSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: loggedInUser, accessToken, refreshToken } = await authService.login(payload);

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUserState(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    authService.logout().catch(() => {
      // Server call fail ho bhi jaye, client side session hamesha clear karo
    });
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUserState(null);
    window.location.href = "/login";
  }, []);

  const setUser = useCallback((updatedUser: User) => {
    setUserState(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      setUser,
    }),
    [user, isLoading, login, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
