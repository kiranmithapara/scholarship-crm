import crypto from "crypto";
import { env } from "@/config/env.config";

/**
 * AES-256-GCM encryption for sensitive settings fields (e.g. SMTP password) stored at rest.
 * Uses JWT access secret as key material via a hash (avoids needing yet another env var) -
 * derives a proper 32-byte key rather than using the secret directly.
 */
const ALGORITHM = "aes-256-gcm";
const KEY = crypto.createHash("sha256").update(env.jwt.accessSecret).digest();

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv:authTag:ciphertext all base64-joined so a single string column suffices
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [ivB64, authTagB64, dataB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !dataB64) throw new Error("Invalid encrypted payload format");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
