/**
 * Détection du type réel d'une image à partir de ses premiers octets (« magic numbers »).
 *
 * Le MIME déclaré par le sélecteur ou par le client ne suffit pas : un fichier quelconque
 * peut être renommé ou étiqueté « image/png ». Cette fonction lit la signature binaire
 * et renvoie le format réel, ou null si aucune signature connue ne correspond.
 *
 * - JPEG : FF D8 FF
 * - PNG  : 89 50 4E 47 0D 0A 1A 0A (on vérifie les 4 premiers octets « PNG »)
 * - WebP : "RIFF" (octets 0-3), taille (4-7), "WEBP" (octets 8-11)
 */

export type DetectedImageType = 'jpeg' | 'png' | 'webp';

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47] as const;
const RIFF_TAG = [0x52, 0x49, 0x46, 0x46] as const;
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50] as const;

function matchesAt(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (bytes.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (bytes[offset + i] !== expected[i]) return false;
  }
  return true;
}

/** Renvoie le format réel de l'image, ou null si la signature n'est pas reconnue. */
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (matchesAt(bytes, 0, JPEG_SIGNATURE)) return 'jpeg';
  if (matchesAt(bytes, 0, PNG_SIGNATURE)) return 'png';
  if (matchesAt(bytes, 0, RIFF_TAG) && matchesAt(bytes, 8, WEBP_TAG)) return 'webp';
  return null;
}
