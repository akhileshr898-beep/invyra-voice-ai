import { NextRequest } from "next/server";

// In-memory rate limiting store: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware for serverless API endpoints
 * Allows a max number of requests per time window (in ms)
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetInSec: number } {
  // Extract client IP or fallback to header
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous-client";

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= limit) {
    const resetInSec = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetInSec };
  }

  entry.count += 1;
  const remaining = limit - entry.count;
  const resetInSec = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: true, remaining, resetInSec };
}

/**
 * Sanitize text inputs against XSS and injection
 */
export function sanitizeTextInput(input: string, maxLength: number = 1500): string {
  if (!input || typeof input !== "string") return "";

  // Truncate to maximum length
  let cleaned = input.slice(0, maxLength);

  // Strip dangerous HTML tags
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:[^"']*/gi, "");

  return cleaned.trim();
}

/**
 * Guardrail against Prompt Injection & Jailbreak attempts
 */
export function detectPromptInjection(input: string): { isSuspicious: boolean; reason?: string } {
  const lower = input.toLowerCase();

  const injectionPatterns = [
    /ignore (all )?previous instructions/i,
    /disregard (all )?previous instructions/i,
    /forget (all )?previous instructions/i,
    /you are now in developer mode/i,
    /reveal your (system )?prompt/i,
    /print your (system )?prompt/i,
    /what is your system instruction/i,
    /bypass safety guidelines/i,
    /act as DAN/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(lower)) {
      return {
        isSuspicious: true,
        reason: "Detected potential prompt override or jailbreak pattern.",
      };
    }
  }

  return { isSuspicious: false };
}

/**
 * Validate audio payload size and content type
 */
export function validateAudioUpload(
  buffer: Buffer,
  mimeType: string,
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB
): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Audio payload is empty." };
  }

  if (buffer.length > maxSizeBytes) {
    return { valid: false, error: `Audio file exceeds maximum size limit of ${maxSizeBytes / (1024 * 1024)}MB.` };
  }

  const allowedMimeTypes = [
    "audio/webm",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
  ];

  const cleanMime = mimeType.split(";")[0].trim().toLowerCase();
  const isAllowed = allowedMimeTypes.some((allowed) => cleanMime.includes(allowed) || allowed.includes(cleanMime));

  if (!isAllowed && !cleanMime.startsWith("audio/")) {
    return { valid: false, error: `Invalid audio format '${mimeType}'. Only audio files are accepted.` };
  }

  return { valid: true };
}
