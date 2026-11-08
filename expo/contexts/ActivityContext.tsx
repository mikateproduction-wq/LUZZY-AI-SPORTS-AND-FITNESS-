import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ActivityDayStats, ActivityState } from '@/types/fitness';
import { logger } from '@/utils/logger';
import { secureStorage } from '@/utils/secureStorage';
import { getAuthUserId } from '@/lib/supabase';
import { pullDailyActivity, pushDailyActivity } from '@/lib/supabaseSync';

const ACTIVITY_STORAGE_KEY = '@fitness_activity_v1';
const MAX_DAYS_STORED = 35;
const MAX_DAILY_EXERCISE_MINUTES = 360;
const MAX_DAILY_EXERCISES = 30;
const MAX_DAILY_EXERCISE_CALORIES = 4000;
const MAX_SESSION_MINUTES = 180;
const MAX_SESSION_CALORIES = 2000;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makeEmptyDay(dateKey: string): ActivityDayStats {
  return {
    dateKey,
    exerciseMinutes: 0,
    exercisesCompleted: 0,
    caloriesFromExercises: 0,
    totalCalories: 0,
  };
}

function recomputeDayTotals(day: ActivityDayStats): ActivityDayStats {
  const exerciseMinutes = Math.min(MAX_DAILY_EXERCISE_MINUTES, clampInt(day.exerciseMinutes));
  const exercisesCompleted = Math.min(MAX_DAILY_EXERCISES, clampInt(day.exercisesCompleted));
  const caloriesFromExercises = Math.min(MAX_DAILY_EXERCISE_CALORIES, clampInt(day.caloriesFromExercises));
  const totalCalories = caloriesFromExercises;

  return {
    dateKey: /^\d{4}-\d{2}-\d{2}$/.test(day.dateKey) ? day.dateKey : toDateKey(new Date()),
    exerciseMinutes,
    exercisesCompleted,
    caloriesFromExercises,
    totalCalories,
  };
}

function ensureRollingDays(map: Record<string, ActivityDayStats>, days: number) {
  const out: Record<string, ActivityDayStats> = {};
  const allowedKeys = new Set<string>();
  const now = new Date();

  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    allowedKeys.add(toDateKey(d));
  }

  for (const key of allowedKeys) {
    const day = map[key];
    out[key] = day ? recomputeDayTotals({ ...day, dateKey: key }) : makeEmptyDay(key);
  }

  return out;
}

function clampInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

type StoredActivity = {
  byDate: Record<string, ActivityDayStats>;
  lastSavedAt: string;
};

export const [ActivityProvider, useActivity] = createContextHook(() => {
  const [byDate, setByDate] = useState<Record<string, ActivityDayStats>>(() => {
    const todayKey = toDateKey(new Date());
    return { [todayKey]: makeEmptyDay(todayKey) };
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const persist = useCallback(async (nextByDate: Record<string, ActivityDayStats>) => {
    try {
      const payload: StoredActivity = {
        byDate: nextByDate,
        lastSavedAt: new Date().toISOString(),
      };
      await secureStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(payload));
      logger.log('[Activity] persisted', { keys: Object.keys(nextByDate).length });
    } catch (error) {
      logger.error('[Activity] persist error', error);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      // secureStorage.getItem migre automatiquement les anciens formats en
      // clair vers le stockage sécurisé puis détruit les copies plain-text.
      const raw = await secureStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (raw) {
        let parsed: StoredActivity | null = null;
        try {
          parsed = JSON.parse(raw) as StoredActivity;
        } catch {
          logger.warn('[Activity] corrupted data, clearing storage');
          await secureStorage.removeItem(ACTIVITY_STORAGE_KEY);
          return;
        }
        if (parsed?.byDate && typeof parsed.byDate === 'object') {
          const ensured = ensureRollingDays(parsed.byDate, MAX_DAYS_STORED);
          setByDate(ensured);
          logger.log('[Activity] loaded', { keys: Object.keys(ensured).length });
          await mergeFromCloud(ensured);
          return;
        }
      }
      logger.log('[Activity] no stored activity, starting fresh');
    } catch (error) {
      logger.error('[Activity] load error', error);
      try { await secureStorage.removeItem(ACTIVITY_STORAGE_KEY); } catch { /* ignore */ }
    }
  }, []);

  const mergeFromCloud = useCallback(
    async (localByDate: Record<string, ActivityDayStats>) => {
      try {
        const userId = await getAuthUserId();
        if (!userId) return;

        const { data, error } = await pullDailyActivity(userId, MAX_DAYS_STORED);
        if (error || !data?.length) return;

        // Per-metric max merge — neither side can lose progress.
        let changed = false;
        const merged: Record<string, ActivityDayStats> = { ...localByDate };
        for (const row of data) {
          const day = merged[row.activity_date] ?? makeEmptyDay(row.activity_date);
          const next: ActivityDayStats = {
            dateKey: row.activity_date,
            exerciseMinutes: Math.max(day.exerciseMinutes, clampInt(row.exercise_minutes)),
            exercisesCompleted: Math.max(day.exercisesCompleted, clampInt(row.exercises_completed)),
            caloriesFromExercises: Math.max(
              day.caloriesFromExercises,
              clampInt(row.calories_from_exercises)
            ),
            totalCalories: 0,
          };
          next.totalCalories = next.caloriesFromExercises;
          if (
            next.exerciseMinutes !== day.exerciseMinutes ||
            next.exercisesCompleted !== day.exercisesCompleted ||
            next.caloriesFromExercises !== day.caloriesFromExercises
          ) {
            merged[row.activity_date] = next;
            changed = true;
          }
        }

        if (changed) {
          setByDate(merged);
          void persist(merged);
        }
      } catch (error) {
        logger.error('[Activity] cloud merge error', error);
      }
    },
    [persist]
  );

  const ensureToday = useCallback(
    (input: Record<string, ActivityDayStats>) => {
      const key = toDateKey(new Date());
      if (input[key]) return input;
      return { ...input, [key]: makeEmptyDay(key) };
    },
    []
  );

  const updateDay = useCallback(
    (dateKey: string, updater: (prev: ActivityDayStats) => ActivityDayStats) => {
      setByDate((prev) => {
        const ensured = ensureToday(prev);
        const base = ensured[dateKey] ?? makeEmptyDay(dateKey);
        const nextDay = recomputeDayTotals(updater(base));
        const nextByDate = { ...ensured, [dateKey]: nextDay };
        void persist(nextByDate);
        // Mirror the day up to Supabase (fire-and-forget, offline-safe).
        void (async () => {
          const userId = await getAuthUserId();
          if (userId) await pushDailyActivity(userId, nextDay);
        })();
        return nextByDate;
      });
    },
    [ensureToday, persist]
  );

  useEffect(() => {
    void load().finally(() => setIsLoading(false));
  }, [load]);

  const addExerciseSession = useCallback(
    (minutes: number, calories: number) => {
      const key = toDateKey(new Date());
      updateDay(key, (day) => ({
        ...day,
        exerciseMinutes: clampInt(day.exerciseMinutes + Math.min(clampInt(minutes), MAX_SESSION_MINUTES)),
        exercisesCompleted: clampInt(day.exercisesCompleted + 1),
        caloriesFromExercises: clampInt(day.caloriesFromExercises + Math.min(clampInt(calories), MAX_SESSION_CALORIES)),
      }));
    },
    [updateDay]
  );

  const addExerciseMinutes = useCallback(
    (minutes: number) => {
      const key = toDateKey(new Date());
      updateDay(key, (day) => ({
        ...day,
        exerciseMinutes: clampInt(day.exerciseMinutes + Math.min(clampInt(minutes), MAX_SESSION_MINUTES)),
      }));
    },
    [updateDay]
  );


  const resetToday = useCallback(() => {
    const key = toDateKey(new Date());
    updateDay(key, () => makeEmptyDay(key));
  }, [updateDay]);

  const clearAllActivity = useCallback(async () => {
    const todayKey = toDateKey(new Date());
    const empty = { [todayKey]: makeEmptyDay(todayKey) };
    setByDate(empty);
    try {
      await secureStorage.removeItem(ACTIVITY_STORAGE_KEY);
    } catch (error) {
      logger.error('[Activity] clear all error', error);
    }
  }, []);

  const rollingWeek = useMemo(() => {
    const out: ActivityDayStats[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = toDateKey(d);
      out.push(recomputeDayTotals(byDate[key] ?? makeEmptyDay(key)));
    }
    return out;
  }, [byDate]);

  const rollingMonth = useMemo(() => {
    const out: ActivityDayStats[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = toDateKey(d);
      out.push(recomputeDayTotals(byDate[key] ?? makeEmptyDay(key)));
    }
    return out;
  }, [byDate]);

  const today = useMemo(() => {
    const key = toDateKey(new Date());
    return recomputeDayTotals(byDate[key] ?? makeEmptyDay(key));
  }, [byDate]);

  const state: ActivityState = useMemo(
    () => ({
      today,
      week: rollingWeek,
      month: rollingMonth,
    }),
    [rollingMonth, rollingWeek, today]
  );

  return useMemo(() => ({
    ...state,
    isLoading,
    addExerciseSession,
    addExerciseMinutes,
    resetToday,
    clearAllActivity,
  }), [state, isLoading, addExerciseSession, addExerciseMinutes, resetToday, clearAllActivity]);
});
