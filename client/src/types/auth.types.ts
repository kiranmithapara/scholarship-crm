import type { Role } from "@/constants/roles.constant";

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  username: string;
  role: Role;
  photoUrl: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterPayload {
  fullName: string;
  mobile: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}
