import bcrypt from "bcrypt";
import { env } from "@/config/env.config";

/** Hashes a plain-text password with bcrypt - the ONLY place password hashing happens in the app. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.bcrypt.saltRounds);
}

/** Compares a plain-text password against a stored bcrypt hash. */
export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
