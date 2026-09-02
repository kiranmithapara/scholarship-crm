import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: requireEnv("NODE_ENV", "development"),
  PORT: parseInt(requireEnv("PORT", "5000"), 10),
  API_PREFIX: requireEnv("API_PREFIX", "/api/v1"),
  CLIENT_URL: requireEnv("CLIENT_URL", "http://localhost:5173"),

  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",

  db: {
    host: requireEnv("DB_HOST", "localhost"),
    port: parseInt(requireEnv("DB_PORT", "5432"), 10),
    name: requireEnv("DB_NAME", "scholarship_crm_claude"),
    user: requireEnv("DB_USER", "postgres"),
    password: process.env.DB_PASSWORD ?? "",
    dialect: "postgres" as const,
    ssl: process.env.DB_SSL === "true",
  },

  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpiry: requireEnv("JWT_ACCESS_EXPIRY", "15m"),
    refreshExpiry: requireEnv("JWT_REFRESH_EXPIRY", "7d"),
    refreshExpiryRememberMe: requireEnv("JWT_REFRESH_EXPIRY_REMEMBER_ME", "30d"),
  },

  bcrypt: {
    saltRounds: parseInt(requireEnv("BCRYPT_SALT_ROUNDS", "12"), 10),
  },

  smtp: {
    host: requireEnv("SMTP_HOST", "smtp.gmail.com"),
    port: parseInt(requireEnv("SMTP_PORT", "587"), 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    fromName: requireEnv("SMTP_FROM_NAME", "Scholarship CRM"),
    fromEmail: process.env.SMTP_FROM_EMAIL ?? "",
  },

  resendApiKey: process.env.RESEND_API_KEY ?? "",
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  mailjetApiKey: process.env.MAILJET_API_KEY ?? "",
  mailjetSecretKey: process.env.MAILJET_SECRET_KEY ?? "",

  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID ?? "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
    refreshToken: process.env.GMAIL_REFRESH_TOKEN ?? "",
  },

  cloudinary: {
    cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
    folder: process.env.CLOUDINARY_FOLDER ?? "scholarship_crm",
  },

  otp: {
    expiryMinutes: parseInt(requireEnv("OTP_EXPIRY_MINUTES", "10"), 10),
    length: parseInt(requireEnv("OTP_LENGTH", "6"), 10),
  },

  rateLimit: {
    windowMinutes: parseInt(requireEnv("RATE_LIMIT_WINDOW_MINUTES", "15"), 10),
    maxRequests: parseInt(requireEnv("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
    authMaxRequests: parseInt(requireEnv("AUTH_RATE_LIMIT_MAX_REQUESTS", "10"), 10),
  },

  allowedIps: (process.env.ALLOWED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
};