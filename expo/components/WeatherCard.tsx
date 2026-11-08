import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Wind, Droplets, MapPin, Pencil, X } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { requestUserLocation, geocodeCityName, type ResolvedLocation } from '@/services/locationService';
import { fetchWeather, getWeatherInfo, type WeatherData } from '@/services/weatherService';
import { logger } from '@/utils/logger';
import { sanitizeCity } from '@/utils/validation';

type Status = 'loading' | 'ready' | 'denied' | 'error';

export default function WeatherCard() {
  const { theme } = useTheme();
  const [status, setStatus] = useState<Status>('loading');
  const [location, setLocation] = useState<ResolvedLocation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [cityLoading, setCityLoading] = useState(false);

  const loadWeatherFor = useCallback(async (loc: ResolvedLocation) => {
    try {
      const w = await fetchWeather(loc.lat, loc.lon);
      setWeather(w);
      setLocation(loc);
      setStatus('ready');
    } catch (e) {
      logger.error('[WeatherCard] weather fetch failed', e);
      setStatus('error');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setStatus('loading');
    try {
      const { location: loc, permission } = await requestUserLocation();
      if (!loc) {
        setStatus(permission === 'denied' ? 'denied' : 'error');
        return;
      }
      await loadWeatherFor(loc);
    } catch (e) {
      logger.error('[WeatherCard] location fetch failed', e);
      setStatus('error');
    }
  }, [loadWeatherFor]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleManualCity = useCallback(async () => {
    // Sanitize before any network call: charset allowlist + length cap (CWE-20).
    const trimmed = sanitizeCity(cityInput);
    if (!trimmed) return;
    setCityLoading(true);
    try {
      const loc = await geocodeCityName(trimmed);
      if (!loc) {
        setCityLoading(false);
        return;
      }
      await loadWeatherFor(loc);
      setShowCityModal(false);
      setCityInput('');
    } finally {
      setCityLoading(false);
    }
  }, [cityInput, loadWeatherFor]);

  if (status === 'loading') {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Localisation en cours…
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'denied' || status === 'error' || !weather || !location) {
    return (
      <>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.fallbackRow}>
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
              {status === 'denied' ? 'Localisation refusée' : 'Météo indisponible'}
            </Text>
          </View>
          <Text style={[styles.fallbackHelper, { color: theme.colors.textSecondary }]}>Saisissez votre ville pour obtenir directement la météo locale.</Text>
          <TouchableOpacity
            style={[styles.manualCityBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCityModal(true)}
            activeOpacity={0.82}
          >
            <Pencil size={14} color="#FFFFFF" />
            <Text style={styles.manualCityBtnText}>Entrer ma ville</Text>
          </TouchableOpacity>
        </View>
        {renderCityModal()}
      </>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.topRow}>
          <View style={styles.locRow}>
            <MapPin size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.city, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {location.city}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editCityBtn, { backgroundColor: theme.colors.background }]}
            onPress={() => setShowCityModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
          >
            <Pencil size={13} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainRow}>
          <Text style={styles.emoji}>{info.emoji}</Text>
          <View style={styles.tempCol}>
            <Text style={[styles.temp, { color: theme.colors.text }]}>{weather.temp}°C</Text>
            <Text style={[styles.condition, { color: info.color }]}>{info.label}</Text>
            <Text style={[styles.feels, { color: theme.colors.textSecondary }]}>
              Ressenti {weather.feelsLike}°
            </Text>
          </View>
          <View style={styles.statsCol}>
            <View style={styles.statRow}>
              <Wind size={13} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {weather.windSpeed} km/h
              </Text>
            </View>
            <View style={styles.statRow}>
              <Droplets size={13} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {weather.humidity}%
              </Text>
            </View>
          </View>
        </View>
      </View>
      {renderCityModal()}
    </>
  );

  function renderCityModal() {
    return (
      <Modal visible={showCityModal} animationType="fade" transparent onRequestClose={() => setShowCityModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Entrer votre ville</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>La météo se mettra à jour dès validation.</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Ex: Gombe, Kinshasa"
              placeholderTextColor={theme.colors.textSecondary}
              value={cityInput}
              onChangeText={setCityInput}
              autoFocus
              maxLength={80}
              onSubmitEditing={handleManualCity}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: theme.colors.primary, opacity: cityInput.trim() ? 1 : 0.5 }]}
              onPress={handleManualCity}
              disabled={!cityInput.trim() || cityLoading}
              activeOpacity={0.85}
            >
              {cityLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    flex: 1,
  },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  fallbackHelper: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  manualCityBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  manualCityBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800' as const,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  city: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  editCityBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emoji: {
    fontSize: 44,
  },
  tempCol: {
    flex: 1,
    gap: 2,
  },
  temp: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 36,
  },
  condition: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  feels: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  statsCol: {
    gap: 8,
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  modalHelper: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
