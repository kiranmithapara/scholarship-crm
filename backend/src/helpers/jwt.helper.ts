import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "@/config/env.config";

export interface JwtPayload {
  id: string;
  role: "super_admin" | "referral_admin";
  email: string;
}

/** Signs a short-lived access token - sent on every authenticated request */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
  } as SignOptions);
}

/** Signs a longer-lived refresh token. Expiry varies with "Remember Me" checkbox. */
export function signRefreshToken(payload: JwtPayload, rememberMe: boolean): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: rememberMe ? env.jwt.refreshExpiryRememberMe : env.jwt.refreshExpiry,
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}
