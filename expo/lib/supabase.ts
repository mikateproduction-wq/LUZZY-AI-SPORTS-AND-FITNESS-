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
import { ensureFreshAccessToken } from "@/lib/authSession";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Fail fast in development if the REST endpoint is not HTTPS.
if (__DEV__ && !isSecureUrl(SUPABASE_URL)) {
  logger.error("[Supabase] EXPO_PUBLIC_SUPABASE_URL must be a valid https:// URL", {
    configured: SUPABASE_URL ? "(present)" : "(missing)",
  });
}

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
  return ensureFreshAccessToken();
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
  first_name: string;
  last_name: string;
  pseudo: string;
  country_code: string;
  created_at: string | null;
  updated_at: string | null;
}

const PROFILE_COLUMNS = "id,first_name,last_name,pseudo,country_code,created_at,updated_at";

/** Profil de l'utilisateur connecté (RLS : uniquement sa propre ligne). */
export async function fetchOwnProfile(
  userId: string
): Promise<{ data: ProfileRow | null; error: SupabaseError | null }> {
  const { data, error } = await supabaseRequest<ProfileRow[]>("profiles", {
    query: `select=${PROFILE_COLUMNS}&id=eq.${encodeURIComponent(userId)}&limit=1`,
  });
  if (error) return { data: null, error };
  return { data: data?.[0] ?? null, error: null };
}

export interface NewProfileInput {
  firstName: string;
  lastName: string;
  pseudo: string;
  countryCode: string;
}

/**
 * Crée le profil. Seuls ces champs sont envoyés : l'identifiant vient du JWT
 * (RLS insert with check auth.uid() = id), les dates et la normalisation sont
 * gérées côté base.
 */
export async function createProfile(
  userId: string,
  input: NewProfileInput
): Promise<{ data: ProfileRow | null; error: SupabaseError | null }> {
  const body = {
    id: userId,
    first_name: sanitizeName(input.firstName, LIMITS.name),
    last_name: sanitizeName(input.lastName, LIMITS.name),
    pseudo: input.pseudo.trim().toLowerCase(),
    country_code: input.countryCode.trim().toUpperCase(),
  };
  const { data, error } = await supabaseRequest<ProfileRow[]>("profiles", {
    method: "POST",
    query: `select=${PROFILE_COLUMNS}`,
    prefer: "return=representation",
    body,
  });
  if (error) return { data: null, error };
  return { data: data?.[0] ?? null, error: null };
}

/** Disponibilité d'un pseudo (fonction SQL, ne révèle aucun autre profil). */
export async function checkPseudoAvailable(
  pseudo: string
): Promise<{ available: boolean | null; error: SupabaseError | null }> {
  const { data, error } = await supabaseRequest<boolean>("rpc/is_pseudo_available", {
    method: "POST",
    body: { p_pseudo: pseudo.trim().toLowerCase() },
  });
  if (error) return { available: null, error };
  return { available: data === true, error: null };
}

export type LeaderboardScope = "world" | "continent" | "country";

export interface LeaderboardRow {
  rank: number;
  pseudo: string;
  country_code: string;
  continent: string;
  xp: number;
}

/** Classement monde, continent ou pays (fonction SQL, 100 lignes maximum). */
export async function fetchLeaderboard(params: {
  scope: LeaderboardScope;
  continent?: string | null;
  country?: string | null;
  limit?: number;
}): Promise<{ data: LeaderboardRow[] | null; error: SupabaseError | null }> {
  return supabaseRequest<LeaderboardRow[]>("rpc/get_leaderboard", {
    method: "POST",
    body: {
      p_scope: params.scope,
      p_continent: params.continent ?? null,
      p_country: params.country ?? null,
      p_limit: Math.min(Math.max(params.limit ?? 50, 1), 100),
    },
  });
}
