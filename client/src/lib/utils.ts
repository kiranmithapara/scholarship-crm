import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() - Merge Tailwind classes intelligently.
 * clsx handles conditional classes, twMerge resolves conflicting Tailwind utility clashes
 * (e.g. "px-2 px-4" -> keeps only "px-4"). Used everywhere instead of raw string concatenation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupee currency (₹2,500) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date as "12 Jan 2026" - used across tables, timelines, logs */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Format date with time - used in logs (login logs / activity logs) */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Build a clean wa.me link from any Indian mobile number format */
export function buildWhatsAppLink(mobile: string, message = ""): string {
  const digitsOnly = mobile.replace(/\D/g, "");
  const withCountryCode = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
  const base = `https://wa.me/${withCountryCode}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Build a tel: link for the mobile dialer */
export function buildTelLink(mobile: string): string {
  const digitsOnly = mobile.replace(/\D/g, "");
  return `tel:+91${digitsOnly.slice(-10)}`;
}

/** Get initials from a full name for Avatar fallback - "Ramesh Patel" -> "RP" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Resolve relative file/photo URLs (e.g. /uploads/...) to full server URL */
export function getFileUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const defaultApiUrl = import.meta.env.DEV ? "http://localhost:5000/api/v1" : "https://scholarship-crm.onrender.com/api/v1";
  const apiBase = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/api\/v1\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Format number as compact Indian Rupee (₹2k, ₹15k, ₹2.5L, ₹1.2Cr) */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₹${amount}`;
}