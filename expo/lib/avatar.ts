/**
 * Photo de profil : stockage Supabase Storage dans le bucket privé `avatars`.
 *
 * - Chemin unique par utilisateur : `<auth.uid()>/avatar.<jpg|png|webp>`. Les policies RLS
 *   (migration 004) n'autorisent que le dossier de l'utilisateur connecté.
 * - Aucune URL publique : l'affichage passe par une URL signée valable 60 minutes, générée
 *   à la demande. Une URL signée n'est jamais stockée en base ni dans le stockage local.
 * - Validation côté client : MIME déclaré, taille (2 Mo), puis signature binaire réelle.
 *   Le serveur reste l'autorité (bucket : limite de taille et types MIME identiques).
 * - Toutes les fonctions renvoient un résultat typé ; aucune erreur n'est avalée.
 */

import { logger } from '@/utils/logger';
import { detectImageType, type DetectedImageType } from '@/utils/imageSignature';
import { isSecureUrl } from '@/utils/validation';
import { OfflineError, secureFetch } from '@/lib/network';
import { ensureFreshAccessToken } from '@/lib/authSession';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const BUCKET = 'avatars';
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const SIGNED_URL_TTL_SECONDS = 3600;

export type AvatarExtension = 'jpg' | 'png' | 'webp';

/** Ordre de recherche lors de la lecture (un seul fichier doit exister, voir uploadAvatar). */
const AVATAR_EXTENSIONS: readonly AvatarExtension[] = ['jpg', 'png', 'webp'];

const EXTENSION_BY_TYPE: Record<DetectedImageType, AvatarExtension> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

const CONTENT_TYPE_BY_EXTENSION: Record<AvatarExtension, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AvatarFailure =
  | 'invalid_user'
  | 'unsupported_type'
  | 'too_large'
  | 'invalid_signature'
  | 'type_mismatch'
  | 'read_failed'
  | 'network'
  | 'unauthorized'
  | 'server';

export type UploadAvatarResult = { ok: true; path: string } | { ok: false; reason: AvatarFailure };
export type SignedAvatarResult = { ok: true; url: string | null } | { ok: false; reason: AvatarFailure };
export type DeleteAvatarResult = { ok: true } | { ok: false; reason: AvatarFailure };

function isValidUserId(userId: string): boolean {
  return UUID_PATTERN.test(userId);
}

/** Type réel déduit d'un MIME déclaré (image/jpg accepté comme image/jpeg). */
function typeFromMime(mimeType: string): DetectedImageType | null {
  switch (mimeType.trim().toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpeg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

/** Devine le MIME à partir de l'extension de l'URI, quand le sélecteur ne le fournit pas. */
export function mimeTypeFromUri(uri: string): string | null {
  const clean = uri.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  return null;
}

/** Erreur réseau (hors ligne, fetch rejeté) ou erreur de configuration. */
function failureFromThrown(err: unknown, step: string): AvatarFailure {
  if (err instanceof OfflineError || err instanceof TypeError) {
    logger.error('[Avatar] network error', { step, name: (err as Error).name });
    return 'network';
  }
  logger.error('[Avatar] request could not be sent', { step });
  return 'server';
}

async function getToken(step: string): Promise<string | null> {
  try {
    return await ensureFreshAccessToken();
  } catch (err) {
    logger.error('[Avatar] token read failed', { step, err });
    return null;
  }
}

function authHeaders(token: string): Record<string, string> {
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };
}

/** Lit l'objet local, vérifie taille et signature, puis l'envoie dans le dossier de l'utilisateur. */
export async function uploadAvatar(
  userId: string,
  localUri: string,
  mimeType: string | null
): Promise<UploadAvatarResult> {
  if (!isValidUserId(userId)) return { ok: false, reason: 'invalid_user' };

  const declared = mimeType ? typeFromMime(mimeType) : null;
  if (!declared) return { ok: false, reason: 'unsupported_type' };

  let buffer: ArrayBuffer;
  try {
    // Lecture d'un fichier local (URI file://) : pas une requête réseau, donc pas de secureFetch.
    const fileResponse = await fetch(localUri);
    buffer = await fileResponse.arrayBuffer();
  } catch (err) {
    logger.error('[Avatar] local file read failed', err);
    return { ok: false, reason: 'read_failed' };
  }

  if (buffer.byteLength === 0) return { ok: false, reason: 'read_failed' };
  if (buffer.byteLength > MAX_AVATAR_BYTES) return { ok: false, reason: 'too_large' };

  const bytes = new Uint8Array(buffer);
  const actual = detectImageType(bytes);
  if (!actual) return { ok: false, reason: 'invalid_signature' };
  if (actual !== declared) return { ok: false, reason: 'type_mismatch' };

  const token = await getToken('upload');
  if (!token) return { ok: false, reason: 'unauthorized' };

  const extension = EXTENSION_BY_TYPE[actual];
  const path = `${userId}/avatar.${extension}`;

  let response: Response;
  try {
    response = await secureFetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': CONTENT_TYPE_BY_EXTENSION[extension],
        'x-upsert': 'true',
      },
      body: buffer,
    });
  } catch (err) {
    return { ok: false, reason: failureFromThrown(err, 'upload') };
  }

  if (!response.ok) {
    logger.error('[Avatar] upload refused', { status: response.status });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'unauthorized' };
    return { ok: false, reason: 'server' };
  }

  // Un seul fichier doit subsister : on retire les anciennes extensions (ex. avatar.png après avatar.jpg).
  const others = AVATAR_EXTENSIONS.filter((ext) => ext !== extension);
  const removed = await deleteAvatarFiles(userId, others);
  if (!removed.ok) return { ok: false, reason: removed.reason };

  return { ok: true, path };
}

/** URL signée (60 min) de la photo de l'utilisateur, ou url null si aucune photo. */
export async function getAvatarSignedUrl(userId: string): Promise<SignedAvatarResult> {
  if (!isValidUserId(userId)) return { ok: false, reason: 'invalid_user' };

  const token = await getToken('sign');
  if (!token) return { ok: false, reason: 'unauthorized' };

  for (const extension of AVATAR_EXTENSIONS) {
    const result = await signAvatarFile(userId, extension, token);
    if (!result.ok) return result;
    if (result.url) return { ok: true, url: result.url };
  }
  return { ok: true, url: null };
}

async function signAvatarFile(
  userId: string,
  extension: AvatarExtension,
  token: string
): Promise<SignedAvatarResult> {
  let response: Response;
  try {
    response = await secureFetch(
      `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${userId}/avatar.${extension}`,
      {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
      }
    );
  } catch (err) {
    return { ok: false, reason: failureFromThrown(err, 'sign') };
  }

  if (response.status === 404) return { ok: true, url: null };

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 400 && /not\s*found/i.test(text)) return { ok: true, url: null };
    logger.error('[Avatar] sign refused', { status: response.status });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'unauthorized' };
    return { ok: false, reason: 'server' };
  }

  let signedPath: unknown;
  try {
    const body = (await response.json()) as { signedURL?: unknown };
    signedPath = body.signedURL;
  } catch (err) {
    logger.error('[Avatar] sign response unreadable', err);
    return { ok: false, reason: 'server' };
  }

  if (typeof signedPath !== 'string' || !signedPath.startsWith('/object/sign/')) {
    logger.error('[Avatar] unexpected sign response shape');
    return { ok: false, reason: 'server' };
  }

  const url = `${SUPABASE_URL}/storage/v1${signedPath}`;
  if (!isSecureUrl(url)) {
    logger.error('[Avatar] signed URL is not https');
    return { ok: false, reason: 'server' };
  }
  return { ok: true, url };
}

/** Supprime la photo de l'utilisateur (les trois extensions possibles). */
export async function deleteAvatar(userId: string): Promise<DeleteAvatarResult> {
  if (!isValidUserId(userId)) return { ok: false, reason: 'invalid_user' };
  return deleteAvatarFiles(userId, AVATAR_EXTENSIONS);
}

async function deleteAvatarFiles(
  userId: string,
  extensions: readonly AvatarExtension[]
): Promise<DeleteAvatarResult> {
  const token = await getToken('delete');
  if (!token) return { ok: false, reason: 'unauthorized' };

  for (const extension of extensions) {
    let response: Response;
    try {
      response = await secureFetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${userId}/avatar.${extension}`,
        { method: 'DELETE', headers: authHeaders(token) }
      );
    } catch (err) {
      return { ok: false, reason: failureFromThrown(err, 'delete') };
    }

    if (response.ok || response.status === 404) continue;

    const text = await response.text();
    if (response.status === 400 && /not\s*found/i.test(text)) continue;

    logger.error('[Avatar] delete refused', { status: response.status });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'unauthorized' };
    return { ok: false, reason: 'server' };
  }
  return { ok: true };
}
