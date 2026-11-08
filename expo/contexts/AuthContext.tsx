import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Crypto from "expo-crypto";

import { secureStorage } from "@/utils/secureStorage";
import { logger } from "@/utils/logger";
import { upsertProfile, testProfilesConnection } from "@/lib/supabase";
import {
  isJwtShape,
  isSecureUrl,
  isValidAuthCode,
} from "@/utils/validation";

const AUTH_URL = process.env.EXPO_PUBLIC_RORK_AUTH_URL!;
const APP_KEY = process.env.EXPO_PUBLIC_RORK_APP_KEY!;
const PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID!;

// Fail fast (dev only) if the auth endpoint is not HTTPS — CWE-319.
if (__DEV__ && !isSecureUrl(AUTH_URL)) {
  logger.error("[Auth] EXPO_PUBLIC_RORK_AUTH_URL must be a valid https:// URL", {
    configured: AUTH_URL ? "(present)" : "(missing)",
  });
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const PKCE_VERIFIER_KEY = "oauth_pkce_verifier";

/** Every storage key this context owns — purged completely on sign-out. */
const OWNED_STORAGE_KEYS = [
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  PKCE_VERIFIER_KEY,
];

/**
 * Validate an OAuth callback URL before trusting any of its contents.
 *
 * Hardening (MASWE-0029, CWE-601):
 * - the scheme MUST be this app's registered deep-link scheme (an attacker
 *   app or a malicious web page cannot forge it);
 * - the host/path MUST match the expected callback shape;
 * - the authorization code MUST match the opaque-code charset (no URLs,
 *   no whitespace, no injection payloads);
 * - a code is only accepted while an OAuth flow is actually pending.
 */
function extractCallbackCode(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const expectedScheme = `rork-${PROJECT_ID}:`;
  const isAuthCallback =
    (url.hostname === "auth" && url.pathname === "/callback") ||
    url.pathname === "/auth/callback" ||
    url.pathname === "//auth/callback";
  if (!rawUrl.toLowerCase().startsWith(expectedScheme.toLowerCase())) {
    logger.warn("[Auth] deep link rejected — unexpected scheme");
    return null;
  }
  if (!isAuthCallback) return null;

  const code = url.searchParams.get("code");
  if (!code) return null;
  if (!isValidAuthCode(code)) {
    logger.warn("[Auth] deep link rejected — malformed code");
    return null;
  }
  return code;
}

/** True while an OAuth exchange can legitimately be in progress. */
async function hasPendingOAuthFlow(memoryVerifier: string | null): Promise<boolean> {
  if (memoryVerifier) return true;
  const stored = await secureStorage.getItem(PKCE_VERIFIER_KEY);
  return stored != null;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/** Decode a JWT payload (no verification — verification happens server-side). */
function userFromToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email ?? "",
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

/** Base64url-encode a random byte array (PKCE code verifier). */
function base64UrlEncode(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[b1 >> 2];
    result += chars[((b1 & 0x03) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 0x0f) << 2) | (b3 >> 6)] : "";
    result += i + 2 < bytes.length ? chars[b3 & 0x3f] : "";
  }
  return result;
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  Crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  // Convert standard base64 to base64url
  return digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeVerifierRef = useRef<string | null>(null);
  const signingInRef = useRef<boolean>(false);

  const clearError = useCallback(() => setError(null), []);

  /** Check stored tokens on app launch. */
  const checkAuth = useCallback(async () => {
    try {
      const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        const storedRefreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
        if (storedRefreshToken) {
          await doRefreshToken();
        }
        return;
      }

      const decoded = userFromToken(accessToken);
      if (decoded) {
        setUser(decoded);
        void upsertProfile(decoded);
        // Task 2 — connectivity test with the user's real JWT (exact error
        // surfaced in dev logs; generic in production).
        void testProfilesConnection(decoded.id);
      } else {
        await doRefreshToken();
      }
    } catch (err) {
      logger.error("[Auth] checkAuth failed", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  /** Listen for deep-link callbacks from the OAuth flow. */
  useEffect(() => {
    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  async function handleDeepLink(event: { url: string }) {
    try {
      // Ignore stray callbacks: no verifier means no legitimate pending flow.
      if (!(await hasPendingOAuthFlow(codeVerifierRef.current))) return;

      const code = extractCallbackCode(event.url);
      if (code) {
        await exchangeCode(code);
      }
    } catch (err) {
      logger.error("[Auth] deep link handling failed", err);
      setError("La connexion a échoué. Veuillez réessayer.");
    }
  }

  /** Initiate the OAuth flow for Google or Apple. */
  const signIn = useCallback(async (provider: "google" | "apple") => {
    if (signingInRef.current) return;
    signingInRef.current = true;
    setIsSigningIn(true);
    setError(null);
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      codeVerifierRef.current = verifier;
      await secureStorage.setItem(PKCE_VERIFIER_KEY, verifier);

      const isWeb = Platform.OS === "web";
      const target = "rn";
      const env = isWeb ? "preview" : "native";

      const response = await fetch(`${AUTH_URL}/oauth/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: APP_KEY,
          provider,
          code_challenge: challenge,
          target,
          env,
        }),
      });

      if (!response.ok) {
        codeVerifierRef.current = null;
        await secureStorage.removeItem(PKCE_VERIFIER_KEY);
        const body = await response.json().catch(() => ({}));
        // Details stay in the (dev-only) logger — the user gets a generic message (CWE-209).
        logger.error("[Auth] initiate failed", { status: response.status, detail: body.error });
        setError("La connexion a échoué. Veuillez réessayer.");
        return;
      }

      const { auth_url } = await response.json();

      // Never open a non-HTTPS or unexpected URL (CWE-601 open redirect).
      if (!isSecureUrl(auth_url)) {
        logger.error("[Auth] initiate returned an invalid auth_url");
        setError("La connexion a échoué. Veuillez réessayer.");
        return;
      }

      if (isWeb) {
        const popup = window.open(auth_url, "_blank", "width=500,height=650");

        await new Promise<void>((resolve, reject) => {
          const onMessage = (event: MessageEvent) => {
            if (event.data?.type !== "rork_auth_callback") return;
            window.removeEventListener("message", onMessage);
            clearInterval(pollTimer);
            const code = event.data.code;
            if (code) {
              exchangeCode(code).then(resolve, reject);
            } else {
              reject(new Error("No code received"));
            }
          };
          window.addEventListener("message", onMessage);

          const pollTimer = setInterval(() => {
            if (popup?.closed) {
              clearInterval(pollTimer);
              window.removeEventListener("message", onMessage);
              codeVerifierRef.current = null;
              void secureStorage.removeItem(PKCE_VERIFIER_KEY);
              resolve();
            }
          }, 500);
        });
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          auth_url,
          `rork-${PROJECT_ID}://auth/callback`
        );

        if (result.type === "success") {
          const code = extractCallbackCode(result.url);
          if (code) {
            await exchangeCode(code);
          } else {
            logger.warn("[Auth] auth session returned an unexpected URL");
          }
        }
      }
    } catch (err) {
      logger.error("[Auth] signIn failed", err);
      setError("La connexion a échoué. Veuillez réessayer.");
    } finally {
      signingInRef.current = false;
      setIsSigningIn(false);
    }
  }, []);

  /** Exchange the authorization code for access + refresh tokens. */
  async function exchangeCode(code: string) {
    const verifier =
      codeVerifierRef.current ?? (await secureStorage.getItem(PKCE_VERIFIER_KEY));
    if (!verifier) {
      setError("La session de connexion a expiré. Veuillez réessayer.");
      return;
    }
    codeVerifierRef.current = null;

    const response = await fetch(`${AUTH_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_key: APP_KEY, code, code_verifier: verifier }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      logger.error("[Auth] token exchange failed", { status: response.status, detail: body.error });
      setError("La connexion a échoué. Veuillez réessayer.");
      return;
    }

    const { access_token, refresh_token, user: userData } = await response.json();

    // Only store well-formed JWTs — never persist malformed payloads (CWE-347).
    if (!isJwtShape(access_token) || (refresh_token != null && typeof refresh_token !== "string")) {
      logger.error("[Auth] token exchange returned a malformed token");
      setError("La connexion a échoué. Veuillez réessayer.");
      return;
    }

    await secureStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    await secureStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    await secureStorage.removeItem(PKCE_VERIFIER_KEY);

    const decoded = userFromToken(access_token) ?? userData;
    setUser(decoded);

    // Sync profile to Supabase (fire-and-forget — RLS-protected)
    if (decoded?.id) {
      void upsertProfile(decoded);
      void testProfilesConnection(decoded.id);
    }
  }

  /** Refresh the access token using the stored refresh token. */
  async function doRefreshToken() {
    const storedRefreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      setUser(null);
      return;
    }

    const response = await fetch(`${AUTH_URL}/oauth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_key: APP_KEY, refresh_token: storedRefreshToken }),
    });

    if (!response.ok) {
      await signOut();
      return;
    }

    const { access_token, refresh_token: rotatedRefreshToken } = await response.json();
    if (!isJwtShape(access_token)) {
      logger.error("[Auth] refresh returned a malformed token");
      await signOut();
      return;
    }
    await secureStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (rotatedRefreshToken) {
      await secureStorage.setItem(REFRESH_TOKEN_KEY, rotatedRefreshToken);
    }

    const decoded = userFromToken(access_token);
    if (decoded) {
      setUser(decoded);
      void upsertProfile(decoded);
    }
  }

  /** Sign out: revoke nothing client-side exists, so wipe EVERY trace of the session. */
  const signOut = useCallback(async () => {
    await secureStorage.purgeAll(OWNED_STORAGE_KEYS);
    codeVerifierRef.current = null;
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isSigningIn,
    error,
    signIn,
    signOut,
    clearError,
  };
});
