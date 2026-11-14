/**
 * Session Supabase Auth (connexion Google via OAuth implicite).
 *
 * - La connexion ouvre le navigateur système (expo-web-browser), Supabase renvoie
 *   les jetons dans le fragment de l'URL de retour (luzzyai://auth-callback).
 * - Les jetons sont stockés dans secureStorage (Keychain / Keystore).
 * - Le renouvellement est sérialisé : les refresh tokens tournent, un appel concurrent
 *   ne doit jamais consommer un jeton déjà échangé.
 */

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { secureStorage } from '@/utils/secureStorage';
import { logger } from '@/utils/logger';
import { isJwtShape } from '@/utils/validation';
import { secureFetch } from '@/lib/network';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const EXPIRES_AT_KEY = 'access_expires_at';

/** Renouvelle le jeton 60 s avant expiration. */
const REFRESH_MARGIN_MS = 60_000;
const MAX_EXPIRES_IN_S = 60 * 60 * 24;
const REFRESH_TOKEN_MAX = 512;

export const AUTH_CALLBACK_PATH = 'auth-callback';

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'invalid' | 'provider_error' };

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let refreshInFlight: Promise<string | null> | null = null;

async function storeSession(session: StoredSession): Promise<void> {
  await secureStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  await secureStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  await secureStorage.setItem(EXPIRES_AT_KEY, String(session.expiresAt));
}

export async function clearSession(): Promise<void> {
  await secureStorage.removeItem(ACCESS_TOKEN_KEY);
  await secureStorage.removeItem(REFRESH_TOKEN_KEY);
  await secureStorage.removeItem(EXPIRES_AT_KEY);
}

async function readSession(): Promise<StoredSession | null> {
  const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresRaw = await secureStorage.getItem(EXPIRES_AT_KEY);
  const expiresAt = Number(expiresRaw);
  if (!isJwtShape(accessToken) || !refreshToken || !Number.isFinite(expiresAt)) return null;
  if (refreshToken.length > REFRESH_TOKEN_MAX) return null;
  return { accessToken, refreshToken, expiresAt };
}

/** Lit les paires clé=valeur du fragment d'URL (#a=b&c=d) sans dépendre d'URLSearchParams. */
function parseFragment(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};
  const out: Record<string, string> = {};
  for (const pair of url.slice(hashIndex + 1).split('&')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const key = decodeURIComponent(pair.slice(0, eq));
    const value = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
    out[key] = value;
  }
  return out;
}

/** Valide le fragment renvoyé par Supabase (#access_token=...&refresh_token=...) et l'enregistre. */
export async function storeSessionFromUrl(url: string): Promise<SignInResult> {
  const params = parseFragment(url);
  if (params.error) {
    logger.error('[Auth] Supabase callback error', { error: params.error });
    return { ok: false, reason: 'provider_error' };
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const expiresIn = Math.min(Math.max(Number(params.expires_in) || 3600, 60), MAX_EXPIRES_IN_S);

  if (!isJwtShape(accessToken) || !refreshToken || refreshToken.length > REFRESH_TOKEN_MAX) {
    return { ok: false, reason: 'invalid' };
  }

  await storeSession({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  return { ok: true };
}

/**
 * Ouvre la connexion Google.
 * - Web : redirection complète vers Supabase ; la route /auth-callback enregistre la session au retour.
 * - Natif : navigateur système, puis lecture du fragment de luzzyai://auth-callback.
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  const redirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
  const authUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectTo)}`;

  if (Platform.OS === 'web') {
    window.location.assign(authUrl);
    return { ok: false, reason: 'cancelled' };
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { ok: false, reason: 'cancelled' };
  }
  if (result.type !== 'success') {
    return { ok: false, reason: 'provider_error' };
  }
  return storeSessionFromUrl(result.url);
}

async function requestRefresh(refreshToken: string): Promise<string | null> {
  const response = await secureFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    // 400/401 : session révoquée ou expirée. Les autres erreurs (réseau, 5xx) gardent la session.
    if (response.status === 400 || response.status === 401) {
      await clearSession();
    }
    return null;
  }

  const body = (await response.json()) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
  };
  const accessToken = body.access_token;
  const nextRefresh = body.refresh_token;
  const expiresIn = Math.min(
    Math.max(Number(body.expires_in) || 3600, 60),
    MAX_EXPIRES_IN_S
  );

  if (!isJwtShape(accessToken) || typeof nextRefresh !== 'string' || nextRefresh.length > REFRESH_TOKEN_MAX) {
    await clearSession();
    return null;
  }

  await storeSession({
    accessToken,
    refreshToken: nextRefresh,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  return accessToken;
}

/** Renvoie un jeton d'accès valide, en le renouvelant si nécessaire. */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const session = await readSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > REFRESH_MARGIN_MS) return session.accessToken;

  if (!refreshInFlight) {
    refreshInFlight = requestRefresh(session.refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Révoque la session côté Supabase (meilleur effort) puis efface les jetons locaux. */
export async function signOutSupabase(): Promise<void> {
  const session = await readSession();
  if (session) {
    try {
      await secureFetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    } catch {
      // Hors ligne : la session locale est tout de même effacée.
    }
  }
  await clearSession();
}
