/**
 * Server-only security helpers: TOTP (authenticator app), reCAPTCHA v3
 * verification, request IP extraction and a small DB-backed rate limiter.
 */
import { getRequest } from "@tanstack/react-start/server";

/* ------------------------------------------------------------------ base32 */

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += B32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/=+$/g, "").replace(/\s/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = B32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/* -------------------------------------------------------------------- TOTP */

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function buildOtpAuthUrl(secret: string, account: string, issuer = "Mazhalai Ulagam") {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function hotp(secret: string, counter: number): Promise<string> {
  const key = base32Decode(secret);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.slice().buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf));
  const offset = sig[sig.length - 1]! & 0x0f;
  const code =
    (((sig[offset]! & 0x7f) << 24) | ((sig[offset + 1]! & 0xff) << 16) | ((sig[offset + 2]! & 0xff) << 8) | (sig[offset + 3]! & 0xff)) %
    1_000_000;
  return code.toString().padStart(6, "0");
}

/** Verifies a 6-digit authenticator code, tolerating one 30s step of clock drift. */
export async function verifyTotp(secret: string, token: string, window = 1): Promise<boolean> {
  const clean = token.replace(/\D/g, "");
  if (clean.length !== 6) return false;
  const counter = Math.floor(Date.now() / 30_000);
  for (let i = -window; i <= window; i += 1) {
    const expected = await hotp(secret, counter + i);
    if (timingSafeEqualStr(expected, clean)) return true;
  }
  return false;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    codes.push(
      Array.from(bytes)
        .map((b) => b.toString(36).padStart(2, "0"))
        .join("")
        .slice(0, 10)
        .toUpperCase(),
    );
  }
  return codes;
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ---------------------------------------------------------------- requests */

export function requestMeta() {
  const request = getRequest();
  const headers = request?.headers;
  const ip =
    headers?.get("cf-connecting-ip") ??
    headers?.get("x-real-ip") ??
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  return { ip, userAgent: headers?.get("user-agent")?.slice(0, 300) ?? null };
}

/* --------------------------------------------------------------- reCAPTCHA */

export type CaptchaResult = { ok: boolean; skipped: boolean; score?: number; reason?: string };

/** Verifies a reCAPTCHA v3 token. Returns `skipped` when no secret is configured. */
export async function verifyRecaptcha(token: string | undefined, minScore = 0.5): Promise<CaptchaResult> {
  const secret = process.env["RECAPTCHA_SECRET_KEY"];
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false, reason: "Missing CAPTCHA token" };

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const body = (await res.json()) as { success?: boolean; score?: number; "error-codes"?: string[] };
    if (!body.success) return { ok: false, skipped: false, reason: body["error-codes"]?.join(", ") ?? "CAPTCHA failed" };
    const score = body.score ?? 1;
    return { ok: score >= minScore, skipped: false, score, reason: score < minScore ? "Low CAPTCHA score" : undefined };
  } catch (error) {
    console.error("reCAPTCHA verification error", error);
    // Never lock people out of the store because Google is unreachable.
    return { ok: true, skipped: true, reason: "CAPTCHA unavailable" };
  }
}

/* ------------------------------------------------------------ rate limiter */

/** Simple fixed-window limiter backed by the database. Returns true when allowed. */
export async function rateLimit(bucket: string, identifier: string, limit: number, windowSeconds: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();

  const { data: existing } = await supabaseAdmin
    .from("rate_limit_counters")
    .select("id, hits")
    .eq("bucket", bucket)
    .eq("identifier", identifier)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from("rate_limit_counters").insert({ bucket, identifier, window_start: windowStart, hits: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.hits >= limit) return { allowed: false, remaining: 0 };
  await supabaseAdmin.from("rate_limit_counters").update({ hits: existing.hits + 1 }).eq("id", existing.id);
  return { allowed: true, remaining: limit - existing.hits - 1 };
}
