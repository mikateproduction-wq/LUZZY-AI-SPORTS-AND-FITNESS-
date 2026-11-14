import { describe, expect, test } from 'bun:test';
import { detectImageType } from '@/utils/imageSignature';

const encoder = new TextEncoder();

describe('detectImageType', () => {
  test('reconnaît un JPEG à partir de FF D8 FF', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    expect(detectImageType(bytes)).toBe('jpeg');
  });

  test('reconnaît un PNG à partir de sa signature complète', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(detectImageType(bytes)).toBe('png');
  });

  test('reconnaît un WebP : RIFF, taille, puis WEBP', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
    ]);
    expect(detectImageType(bytes)).toBe('webp');
  });

  test('rejette un RIFF qui n\'est pas un WebP (par exemple un WAV)', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(detectImageType(bytes)).toBeNull();
  });

  test('rejette un texte, même si son contenu ressemble à une image', () => {
    expect(detectImageType(encoder.encode('Hello, this is plain text'))).toBeNull();
    expect(detectImageType(encoder.encode('\u0089PNG'))).toBeNull();
  });

  test('rejette un tableau vide ou trop court', () => {
    expect(detectImageType(new Uint8Array([]))).toBeNull();
    expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});
