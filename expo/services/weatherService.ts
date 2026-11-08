import { logger } from '@/utils/logger';

/**
 * Weather service — Open-Meteo (free, no API key, reliable worldwide coverage).
 * Includes a short TTL cache keyed by rounded coordinates to avoid redundant
 * network calls when the user re-opens the app or re-renders the card.
 */

export interface WeatherData {
  temp: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { value: WeatherData; timestamp: number }>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`Weather API ${res.status}`);

    const data = await res.json();
    const cur = data.current;
    const weather: WeatherData = {
      temp: Math.round(cur.temperature_2m),
      feelsLike: Math.round(cur.apparent_temperature),
      weatherCode: cur.weathercode,
      windSpeed: Math.round(cur.windspeed_10m),
      humidity: cur.relativehumidity_2m,
    };

    cache.set(key, { value: weather, timestamp: Date.now() });
    return weather;
  } catch (e) {
    logger.error('[Weather] fetch failed', e);
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function clearWeatherCache(): void {
  cache.clear();
}

const WMO: Record<string, { emoji: string; label: string; color: string }> = {
  '0': { emoji: '☀️', label: 'Ensoleillé', color: '#F59E0B' },
  '1': { emoji: '🌤️', label: 'Peu nuageux', color: '#FBBF24' },
  '2': { emoji: '⛅', label: 'Partiellement nuageux', color: '#94A3B8' },
  '3': { emoji: '☁️', label: 'Nuageux', color: '#64748B' },
  '45': { emoji: '🌫️', label: 'Brouillard', color: '#94A3B8' },
  '48': { emoji: '🌫️', label: 'Brouillard givrant', color: '#94A3B8' },
  '51': { emoji: '🌦️', label: 'Bruine légère', color: '#60A5FA' },
  '53': { emoji: '🌦️', label: 'Bruine modérée', color: '#60A5FA' },
  '55': { emoji: '🌦️', label: 'Bruine dense', color: '#3B82F6' },
  '61': { emoji: '🌧️', label: 'Pluie légère', color: '#3B82F6' },
  '63': { emoji: '🌧️', label: 'Pluie modérée', color: '#2563EB' },
  '65': { emoji: '🌧️', label: 'Pluie forte', color: '#1D4ED8' },
  '71': { emoji: '❄️', label: 'Neige légère', color: '#93C5FD' },
  '73': { emoji: '❄️', label: 'Neige modérée', color: '#60A5FA' },
  '75': { emoji: '❄️', label: 'Neige forte', color: '#3B82F6' },
  '80': { emoji: '🌦️', label: 'Averses légères', color: '#3B82F6' },
  '81': { emoji: '🌧️', label: 'Averses modérées', color: '#2563EB' },
  '82': { emoji: '⛈️', label: 'Averses violentes', color: '#1D4ED8' },
  '95': { emoji: '⛈️', label: 'Orage', color: '#7C3AED' },
  '96': { emoji: '⛈️', label: 'Orage avec grêle', color: '#6D28D9' },
  '99': { emoji: '⛈️', label: 'Orage violent', color: '#5B21B6' },
};

export function getWeatherInfo(code: number) {
  return WMO[String(code)] ?? { emoji: '🌡️', label: 'Variable', color: '#94A3B8' };
}
