import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CONTINENTS, CONTINENT_LABELS_FR, getCountry, type Continent } from '@/data/countries';
import { fetchLeaderboard, type LeaderboardRow, type LeaderboardScope } from '@/lib/supabase';
import { logger } from '@/utils/logger';

const STRINGS = {
  fr: {
    title: 'Classements',
    world: 'Monde',
    continent: 'Continent',
    country: 'Mon pays',
    empty: 'Aucun joueur classé pour le moment.',
    error: 'Impossible de charger le classement.',
    retry: 'Réessayer',
    xp: 'XP',
    back: 'Retour',
  },
  en: {
    title: 'Leaderboards',
    world: 'World',
    continent: 'Continent',
    country: 'My country',
    empty: 'No ranked players yet.',
    error: 'Could not load the leaderboard.',
    retry: 'Retry',
    xp: 'XP',
    back: 'Back',
  },
} as const;

export default function LeaderboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const s = language === 'fr' ? STRINGS.fr : STRINGS.en;

  const [scope, setScope] = useState<LeaderboardScope>('world');
  const [continent, setContinent] = useState<Continent>('europe');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const { data, error } = await fetchLeaderboard({
      scope,
      continent: scope === 'continent' ? continent : null,
      country: scope === 'country' ? profile?.country_code ?? null : null,
      limit: 100,
    });
    if (error) {
      logger.error('[Leaderboard] fetch failed', { status: error.status, code: error.code });
      setRows([]);
      setFailed(true);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }, [scope, continent, profile?.country_code]);

  useEffect(() => {
    load();
  }, [load]);

  const chip = (active: boolean) => ({
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: active ? theme.colors.primary : theme.colors.border,
    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{s.back}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>{s.title}</Text>
      </View>

      <View style={styles.chips}>
        <Pressable style={chip(scope === 'world')} onPress={() => setScope('world')} accessibilityRole="button">
          <Text style={{ color: scope === 'world' ? '#FFFFFF' : theme.colors.text }}>{s.world}</Text>
        </Pressable>
        <Pressable style={chip(scope === 'continent')} onPress={() => setScope('continent')} accessibilityRole="button">
          <Text style={{ color: scope === 'continent' ? '#FFFFFF' : theme.colors.text }}>{s.continent}</Text>
        </Pressable>
        <Pressable style={chip(scope === 'country')} onPress={() => setScope('country')} accessibilityRole="button">
          <Text style={{ color: scope === 'country' ? '#FFFFFF' : theme.colors.text }}>{s.country}</Text>
        </Pressable>
      </View>

      {scope === 'continent' ? (
        <View style={styles.chips}>
          {CONTINENTS.map((c) => (
            <Pressable key={c} style={chip(continent === c)} onPress={() => setContinent(c)} accessibilityRole="button">
              <Text style={{ color: continent === c ? '#FFFFFF' : theme.colors.text }}>{CONTINENT_LABELS_FR[c]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : failed ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>{s.error}</Text>
          <Pressable onPress={load} accessibilityRole="button">
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{s.retry}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => `${item.rank}-${item.pseudo}`}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>{s.empty}</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.rank, { color: theme.colors.textSecondary }]}>{item.rank}</Text>
              <View style={styles.flex}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{item.pseudo}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  {getCountry(item.country_code)?.name ?? item.country_code}
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {item.xp} {s.xp}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  title: { fontSize: 26, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  loader: { marginTop: 40 },
  center: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  empty: { textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rank: { width: 36, fontWeight: '700', textAlign: 'center' },
});
