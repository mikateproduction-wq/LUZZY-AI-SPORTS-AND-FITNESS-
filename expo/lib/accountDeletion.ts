/**
 * Suppression définitive du compte (fonction Supabase `delete-account`).
 *
 * - Le client envoie prénom, nom et email saisis ; le serveur refait la comparaison
 *   avec les données de la base et ne fait jamais confiance à la vérification locale.
 * - Le jeton d'accès courant est envoyé en Bearer.
 * - Résultat typé : chaque échec a une raison distincte pour l'interface.
 */

import { getAccessToken } from '@/lib/supabase';
import { OfflineError, secureFetch } from '@/lib/network';
import { logger } from '@/utils/logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const DELETE_ACCOUNT_PATH = '/functions/v1/delete-account';

export interface DeleteAccountInput {
  firstName: string;
  lastName: string;
  email: string;
}

export type AccountDeletionFailure =
  | 'network'
  | 'confirmation_mismatch'
  | 'unauthorized'
  | 'server';

export type AccountDeletionResult = { ok: true } | { ok: false; reason: AccountDeletionFailure };

/** Même normalisation que la fonction serveur : NFC, sans espaces aux extrémités, minuscules. */
export function normalizeForMatch(value: string): string {
  return value.normalize('NFC').trim().toLowerCase();
}

/** Vrai si la saisie correspond à la valeur attendue après normalisation. */
export function matchesExpected(input: string, expected: string): boolean {
  const normalizedExpected = normalizeForMatch(expected);
  return normalizedExpected.length > 0 && normalizeForMatch(input) === normalizedExpected;
}

/**
 * Email du compte connecté, lu dans la claim `email` du JWT (décodage sans vérification).
 * Sert uniquement à la vérification locale du formulaire ; le serveur valide de son côté.
 */
export async function getSessionEmail(): Promise<string | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64)) as { email?: unknown };
    return typeof payload.email === 'string' && payload.email.length > 0 ? payload.email : null;
  } catch (err) {
    logger.error('[AccountDeletion] session email read failed', err);
    return null;
  }
}

/** Demande la suppression définitive du compte au serveur. */
export async function deleteAccount(input: DeleteAccountInput): Promise<AccountDeletionResult> {
  let token: string | null;
  try {
    token = await getAccessToken();
  } catch (err) {
    logger.error('[AccountDeletion] token read failed', err);
    return { ok: false, reason: 'unauthorized' };
  }
  if (!token) {
    return { ok: false, reason: 'unauthorized' };
  }

  let response: Response;
  try {
    response = await secureFetch(`${SUPABASE_URL}${DELETE_ACCOUNT_PATH}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      }),
    });
  } catch (err) {
    if (err instanceof OfflineError || err instanceof TypeError) {
      logger.error('[AccountDeletion] network error', { name: err.name });
      return { ok: false, reason: 'network' };
    }
    logger.error('[AccountDeletion] request could not be sent', err);
    return { ok: false, reason: 'server' };
  }

  if (response.ok) {
    return { ok: true };
  }

  let code: string | null = null;
  try {
    const body = (await response.json()) as { error?: unknown };
    code = typeof body.error === 'string' ? body.error : null;
  } catch (err) {
    logger.error('[AccountDeletion] error body unreadable', err);
  }
  logger.error('[AccountDeletion] server refused', { status: response.status, code });

  if (response.status === 400 && code === 'confirmation_mismatch') {
    return { ok: false, reason: 'confirmation_mismatch' };
  }
  if (response.status === 401) {
    return { ok: false, reason: 'unauthorized' };
  }
  return { ok: false, reason: 'server' };
}
