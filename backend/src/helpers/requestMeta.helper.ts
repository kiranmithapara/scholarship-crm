import type { Request } from "express";

/**
 * Extracts client IP + a readable browser/device summary from the request.
 * Used by both login_logs and activity_logs so every audit entry has consistent metadata.
 * Kept dependency-free (no ua-parser-go through User-Agent regexes) - simple, fast, good enough
 * for admin-facing log tables.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? req.ip ?? "unknown";
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function parseUserAgent(req: Request): { browser: string; device: string } {
  const ua = req.headers["user-agent"] ?? "";

  let browser = "Unknown Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let device = "Desktop";
  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablet";

  return { browser, device };
}
