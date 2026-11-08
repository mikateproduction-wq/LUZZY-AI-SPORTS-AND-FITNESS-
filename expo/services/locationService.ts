import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

/**
 * Location service — GPS/native only.
 * No IP-based geolocation fallback (that was the source of wrong-city bugs).
 * Falls back to manual city entry when permission is denied or GPS fails.
 */

export type LocationPermissionState = 'granted' | 'denied' | 'unavailable';

export interface Coordinates {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface ResolvedLocation extends Coordinates {
  city: string;
  source: 'gps' | 'manual';
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedLocation: { value: ResolvedLocation; timestamp: number } | null = null;

export function getCachedLocation(): ResolvedLocation | null {
  if (!cachedLocation) return null;
  if (Date.now() - cachedLocation.timestamp > CACHE_TTL_MS) return null;
  return cachedLocation.value;
}

export function setCachedLocation(value: ResolvedLocation): void {
  cachedLocation = { value, timestamp: Date.now() };
}

export function clearLocationCache(): void {
  cachedLocation = null;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr&zoom=12`,
      { headers: { 'User-Agent': 'LuzzyAI-Fitness/1.0' }, signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return 'Ma position';
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; state?: string; country?: string };
    };
    const addr = data.address;
    return addr?.city || addr?.town || addr?.village || addr?.state || addr?.country || 'Ma position';
  } catch (e) {
    logger.warn('[Location] reverseGeocode failed', e);
    return 'Ma position';
  }
}

function getWebPosition(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 999,
        });
      },
      (err) => {
        logger.warn('[Location] web geolocation error', err.message);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

async function getNativePosition(): Promise<{ coords: Coordinates | null; permission: LocationPermissionState }> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { coords: null, permission: 'denied' };
    }
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return { coords: null, permission: 'unavailable' };
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      coords: { lat: loc.coords.latitude, lon: loc.coords.longitude, accuracy: loc.coords.accuracy ?? 999 },
      permission: 'granted',
    };
  } catch (e) {
    logger.warn('[Location] native location error', e);
    return { coords: null, permission: 'unavailable' };
  }
}

/**
 * Requests the user's exact location via native GPS (or browser geolocation
 * on web). Returns null coords with a permission state when unavailable —
 * callers should offer manual city entry as a fallback, never IP geolocation.
 */
export async function requestUserLocation(): Promise<{ location: ResolvedLocation | null; permission: LocationPermissionState }> {
  const cached = getCachedLocation();
  if (cached && cached.source === 'gps') {
    return { location: cached, permission: 'granted' };
  }

  if (Platform.OS === 'web') {
    const coords = await getWebPosition();
    if (!coords) return { location: null, permission: 'denied' };
    const city = await reverseGeocode(coords.lat, coords.lon);
    const resolved: ResolvedLocation = { ...coords, city, source: 'gps' };
    setCachedLocation(resolved);
    return { location: resolved, permission: 'granted' };
  }

  const { coords, permission } = await getNativePosition();
  if (!coords) return { location: null, permission };
  const city = await reverseGeocode(coords.lat, coords.lon);
  const resolved: ResolvedLocation = { ...coords, city, source: 'gps' };
  setCachedLocation(resolved);
  return { location: resolved, permission: 'granted' };
}

/**
 * Resolves coordinates for a manually entered city name using Nominatim
 * geocoding — used when the user declines location permission.
 */
export async function geocodeCityName(cityName: string): Promise<ResolvedLocation | null> {
  const trimmed = cityName.trim();
  if (!trimmed || trimmed.length > 80) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LuzzyAI-Fitness/1.0' }, signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const results = (await res.json()) as { lat: string; lon: string; display_name?: string }[];
    if (!results.length) return null;
    const resolved: ResolvedLocation = {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
      accuracy: 5000,
      city: trimmed,
      source: 'manual',
    };
    setCachedLocation(resolved);
    return resolved;
  } catch (e) {
    logger.warn('[Location] geocodeCityName failed', e);
    return null;
  }
}
