import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { AuthContextValue, LoginPayload, User } from "@/types/auth.types";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider - poore app ko user session provide karta hai.
 * App load hote hi localStorage se token check karta hai, agar mile to /auth/me
 * hit karke fresh user data leke aata hai (taaki stale role/status pe bharosa na ho).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const freshUser = await authService.getCurrentUser();
        setUserState(freshUser);
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
  }, []);

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
