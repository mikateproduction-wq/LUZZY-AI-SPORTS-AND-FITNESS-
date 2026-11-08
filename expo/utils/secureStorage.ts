import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';

/**
 * Hardened key-value storage for sensitive data (tokens, health data).
 *
 * Security model (OWASP MASVS-STORAGE / MASWE-0001, 0002, 0006):
 * - Native: SecureStore (iOS Keychain / Android Keystore) is the ONLY source
 *   of truth. Nothing sensitive is ever mirrored to plain AsyncStorage.
 * - iOS entries are excluded from device backups and iCloud via
 *   `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` (MASWE-0006).
 * - Web: sessionStorage only (cleared when the browser closes) — never
 *   written to localStorage which survives and is trivially readable.
 * - Legacy plain-text copies previously written by older versions are
 *   migrated into SecureStore then destroyed (defence against residue).
 * - If SecureStore fails, values are kept in memory for the session only
 *   and never persisted in clear text.
 */

/** Session-only fallback when the OS secure store is unavailable. */
const memoryFallback = new Map<string, string>();

/**
 * SecureStore only accepts alphanumeric characters plus `.`, `-`, and `_`.
 * Legacy keys used `@` which crashes native SecureStore and silently returns null.
 */
function toSecureStoreKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions =
  Platform.OS === 'ios'
    ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    : {};

async function secureSet(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value, KEYCHAIN_OPTIONS);
    return true;
  } catch (error) {
    logger.error('[SecureStorage] secure write failed', { key, error });
    return false;
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    logger.error('[SecureStorage] secure read failed', { key, error });
    return null;
  }
}

/** Destroy every plain-text copy of a key we know about (current + legacy). */
async function destroyPlainCopies(key: string, safeKey: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(safeKey);
    if (key !== safeKey) await AsyncStorage.removeItem(key);
  } catch {
    // AsyncStorage unavailable — nothing more we can do.
  }
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const safeKey = toSecureStoreKey(key);

    if (Platform.OS === 'web') {
      try {
        return (
          sessionStorage.getItem(safeKey) ??
          sessionStorage.getItem(key) ??
          // Legacy fallback: a value may exist in localStorage from an old build.
          localStorage.getItem(safeKey) ??
          localStorage.getItem(key)
        );
      } catch {
        return memoryFallback.get(safeKey) ?? null;
      }
    }

    // 1. OS secure store.
    const secureValue = await secureGet(safeKey);
    if (secureValue != null) return secureValue;

    // 2. In-memory session fallback (previous SecureStore outage this session).
    const memoryValue = memoryFallback.get(safeKey);
    if (memoryValue != null) return memoryValue;

    // 3. Legacy migration: old versions persisted in plain AsyncStorage.
    try {
      const legacy =
        (await AsyncStorage.getItem(safeKey)) ?? (await AsyncStorage.getItem(key));
      if (legacy != null) {
        const migrated = await secureSet(safeKey, legacy);
        // Remove the plain-text copy regardless: it must not survive.
        await destroyPlainCopies(key, safeKey);
        if (migrated) return legacy;
        memoryFallback.set(safeKey, legacy);
        return legacy;
      }
    } catch {
      // AsyncStorage unavailable — ignore.
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const safeKey = toSecureStoreKey(key);

    if (Platform.OS === 'web') {
      try {
        sessionStorage.setItem(safeKey, value);
        return;
      } catch {
        memoryFallback.set(safeKey, value);
        return;
      }
    }

    memoryFallback.set(safeKey, value);
    const ok = await secureSet(safeKey, value);
    if (!ok) {
      // Deliberately NO clear-text persistence fallback: the value simply
      // lives in memory until the process dies (fail-safe, not fail-open).
      logger.error('[SecureStorage] value kept in memory only', { key: safeKey });
      return;
    }
    // Clean up any plain-text residue from previous app versions.
    await destroyPlainCopies(key, safeKey);
  },

  async removeItem(key: string): Promise<void> {
    const safeKey = toSecureStoreKey(key);
    memoryFallback.delete(safeKey);

    if (Platform.OS === 'web') {
      try {
        sessionStorage.removeItem(safeKey);
        sessionStorage.removeItem(key);
        localStorage.removeItem(safeKey);
        localStorage.removeItem(key);
      } catch {
        // Storage unavailable — ignore.
      }
      return;
    }

    try {
      await SecureStore.deleteItemAsync(safeKey);
    } catch (error) {
      logger.error('[SecureStorage] secure delete error', { key: safeKey, error });
    }
    await destroyPlainCopies(key, safeKey);
  },

  /**
   * Purge every known key from all stores (secure, memory, plain, web).
   * Called on sign-out so no residue survives a session end (MASWE-0024).
   */
  async purgeAll(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  },
};
