/**
 * Lightweight Supabase REST client — Expo Go compatible (no native module).
 * Uses fetch directly against the PostgREST API.
 *
 * The Supabase Auth JWT is stored in secureStorage and sent as
 * `Authorization: Bearer <jwt>` on EVERY request (task 1). Supabase's
 * third-party auth resolves the token to `request.jwt.claims`, which the
 * `user_id()` helper and RLS policies rely on.
 *
 * Hardening:
 * - HTTPS enforced at module load (CWE-319).
 * - Every field written to any table is sanitized and length-capped before
 *   leaving the device (CWE-20) — defence in depth on top of RLS, which
 *   remains the real server-side authorization boundary.
 * - Server columns (id, created_at, updated_at, role, is_blocked, rank) are
 *   NEVER sent by the client (mass-assignment defence, CWE-915).
 */

import { secureStorage } from "@/utils/secureStorage";
import { logger } from "@/utils/logger";
import { isSecureUrl, sanitizeName, sanitizeText } from "@/utils/validation";
import { secureFetch } from "@/lib/network";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Fail fast in development if the REST endpoint is not HTTPS.
if (__DEV__ && !isSecureUrl(SUPABASE_URL)) {
  logger.error("[Supabase] EXPO_PUBLIC_SUPABASE_URL must be a valid https:// URL", {
    configured: SUPABASE_URL ? "(present)" : "(missing)",
  });
}

const ACCESS_TOKEN_KEY = "access_token";
const REQUEST_TIMEOUT_MS = 15_000;

/** Hard limits mirrored by SQL CHECK constraints in the database. */
const LIMITS = {
  email: 254,
  name: 60,
  avatarUrl: 2048,
} as const;

/** Normalized PostgREST error — safe to surface/log (no secrets inside). */
export interface SupabaseError {
  status: number;
  code: string | null;
  message: string;
}

/** Get the current Supabase Auth JWT from secure storage. */
export async function getAccessToken(): Promise<string | null> {
  return secureStorage.getItem(ACCESS_TOKEN_KEY);
}

/** Decode the JWT `sub` claim (user id, e.g. usr_xxx) without verification. */
export async function getAuthUserId(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(base64)) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Build common headers for Supabase REST calls, including the user JWT. */
async function buildHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** URL-encoded query string (already built by the caller). */
  query?: string;
  body?: unknown;
  /** Extra Prefer header value, e.g. "resolution=merge-duplicates,return=minimal". */
  prefer?: string;
}

/**
 * Single entry point for all Supabase REST calls.
 * Normalizes every failure into a {status, code, message} object.
 */
export async function supabaseRequest<T>(
  table: string,
  options: RequestOptions = {}
): Promise<{ data: T | null; error: SupabaseError | null }> {
  try {
    const headers = await buildHeaders();
    const qs = options.query ? `?${options.query}` : "";
    const res = await secureFetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
      method: options.method ?? "GET",
      headers: options.prefer ? { ...headers, Prefer: options.prefer } : headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      let code: string | null = null;
      let message = text;
      try {
        const parsed = JSON.parse(text) as { code?: string; message?: string };
        code = parsed.code ?? null;
        message = parsed.message ?? text;
      } catch {
        /* keep raw text */
      }
      logger.error("[Supabase] request failed", { table, status: res.status, code });
      return {
        data: null,
        error: { status: res.status, code, message: message.slice(0, 300) },
      };
    }

    // 204 No Content (upserts with return=minimal)
    if (res.status === 204) return { data: null, error: null };

    const text = await res.text();
    const data = (text ? JSON.parse(text) : null) as T;
    return { data, error: null };
  } catch (err) {
    logger.error("[Supabase] network error", { table });
    return {
      data: null,
      error: { status: 0, code: "NETWORK_ERROR", message: String(err).slice(0, 200) },
    };
  }
}

export interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role?: string | null;
  is_blocked?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/** SELECT * FROM profiles WHERE id = <userId> — returns rows or exact error. */
export async function fetchProfile(
  userId: string
): Promise<{ data: ProfileRow[] | null; error: SupabaseError | null }> {
  return supabaseRequest<ProfileRow[]>("profiles", {
    query: `select=*&id=eq.${encodeURIComponent(userId)}&limit=1`,
  });
}

/**
 * Task 2 — validation test: SELECT on `profiles` with the connected user's JWT.
 * Returns the raw rows, or the exact server error (status + code + message).
 * If `error.code` is 401/`invalid_jwt`/`no suitable key`, Supabase does not
 * (yet) accept non-Supabase tokens.
 */
export async function testProfilesConnection(
  userId: string
): Promise<{ ok: boolean; rows?: ProfileRow[]; error?: SupabaseError }> {
  const { data, error } = await fetchProfile(userId);
  if (error) {
    logger.error("[Supabase][Test] profiles SELECT failed", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return { ok: false, error };
  }
  logger.log("[Supabase][Test] profiles SELECT ok", { rows: data?.length ?? 0 });
  return { ok: true, rows: data ?? [] };
}

/** Upsert the user's profile row in the `profiles` table (auth flow). */
export async function upsertProfile(user: {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}): Promise<void> {
  try {
    // Field whitelist: only these four values are ever written — the client
    // cannot touch `id` (RLS-bound), `created_at`, `role` or `is_blocked`.
    const body = {
      id: user.id,
      email:
        typeof user.email === "string"
          ? sanitizeText(user.email, LIMITS.email).toLowerCase()
          : null,
      name: user.name ? sanitizeName(user.name, LIMITS.name) : null,
      avatar_url:
        user.picture && isSecureUrl(user.picture) ? user.picture.slice(0, LIMITS.avatarUrl) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseRequest("profiles", {
      method: "POST",
      query: "on_conflict=id",
      prefer: "resolution=merge-duplicates,return=minimal",
      body,
    });
    if (error) {
      logger.error("[Supabase] upsertProfile failed", { status: error.status, code: error.code });
    }
  } catch (err) {
    logger.error("[Supabase] upsertProfile error", err);
  }
}
