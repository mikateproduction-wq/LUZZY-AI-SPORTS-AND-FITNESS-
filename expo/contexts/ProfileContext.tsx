import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { UserProfile, Rank, RankInfo } from '@/types/fitness';
import { logger } from '@/utils/logger';
import { secureStorage } from '@/utils/secureStorage';
import { getAuthUserId } from '@/lib/supabase';
import { pullUserXp, pushUserXp, pullFitnessProfile, pushFitnessProfile, rowToUserProfile } from '@/lib/supabaseSync';

const PROFILE_STORAGE_KEY = '@fitness_profile';
const XP_STORAGE_KEY = '@fitness_xp';
const MAX_STORED_XP = 50_000;
const MAX_XP_GAIN_PER_SESSION = 250;

const RANK_THRESHOLDS: { rank: Rank; minXp: number }[] = [
  { rank: 'bronze', minXp: 0 },
  { rank: 'silver', minXp: 1000 },
  { rank: 'gold', minXp: 2000 },
  { rank: 'diamond', minXp: 3000 },
];

function sanitizeXp(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, Math.round(value)), MAX_STORED_XP);
}

function getRankInfo(xp: number): RankInfo {
  let currentRankIndex = 0;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].minXp) {
      currentRankIndex = i;
      break;
    }
  }

  const current = RANK_THRESHOLDS[currentRankIndex];
  const next = RANK_THRESHOLDS[currentRankIndex + 1];

  if (!next) {
    return {
      rank: current.rank,
      minXp: current.minXp,
      maxXp: current.minXp,
      progress: 1,
      xpToNext: 0,
    };
  }

  const rangeXp = next.minXp - current.minXp;
  const progressXp = xp - current.minXp;

  return {
    rank: current.rank,
    minXp: current.minXp,
    maxXp: next.minXp,
    progress: Math.min(progressXp / rangeXp, 1),
    xpToNext: next.minXp - xp,
  };
}

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // secureStorage.getItem migre automatiquement les anciens formats en
    // clair vers le stockage sécurisé puis détruit les copies plain-text.
    void (async () => {
      await loadProfile();
      await loadXp();
      await syncFromCloud();
    })();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await secureStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
      }
    } catch (error) {
      logger.error('[Profile] loading error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadXp = async () => {
    try {
      const savedXp = await secureStorage.getItem(XP_STORAGE_KEY);
      if (savedXp) {
        const parsed = JSON.parse(savedXp) as unknown;
        const sanitized = sanitizeXp(parsed);
        if (sanitized > 0 || parsed === 0) {
          setXp(sanitized);
          if (sanitized !== parsed) {
            void persistXp(sanitized);
          }
        } else if (parsed !== 0) {
          await secureStorage.removeItem(XP_STORAGE_KEY);
        }
      }
    } catch (error) {
      logger.error('[Profile] XP loading error', error);
    }
  };

  const persistXp = useCallback(async (newXp: number) => {
    try {
      await secureStorage.setItem(XP_STORAGE_KEY, JSON.stringify(sanitizeXp(newXp)));
    } catch (error) {
      logger.error('[Profile] XP save error', error);
    }
  }, []);

  const addXp = useCallback((amount: number) => {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    const safeAmount = Math.min(Math.round(amount), MAX_XP_GAIN_PER_SESSION);
    setXp((prev) => {
      const next = sanitizeXp(prev + safeAmount);
      void persistXp(next);
      // Mirror XP up — server-side guard keeps it monotonic (never decreases).
      void (async () => {
        const userId = await getAuthUserId();
        if (userId) await pushUserXp(userId, next);
      })();
      return next;
    });
  }, [persistXp]);

  const rankInfo = useMemo(() => getRankInfo(xp), [xp]);

  /**
   * Sync cloud → local (the local storage stays the offline cache and is
   * never deleted). XP merge is monotonic: the highest value wins. Fitness
   * profile: remote only fills a gap — a locally edited profile always wins
   * and is pushed back up.
   */
  const syncFromCloud = async () => {
    try {
      const userId = await getAuthUserId();
      if (!userId) return;

      const remoteXp = await pullUserXp(userId);
      if (remoteXp.data && typeof remoteXp.data.xp === 'number' && remoteXp.data.xp > xp) {
        const sanitized = sanitizeXp(remoteXp.data.xp);
        setXp(sanitized);
        void persistXp(sanitized);
      }

      const remoteProfile = await pullFitnessProfile(userId);
      if (remoteProfile.data) {
        const savedProfile = await secureStorage.getItem(PROFILE_STORAGE_KEY);
        if (!savedProfile) {
          const mapped = rowToUserProfile(remoteProfile.data);
          setProfile((prev) => ({ ...mapped, name: mapped.name ?? prev?.name ?? '' }) as UserProfile);
        }
      }
    } catch (error) {
      logger.error('[Profile] cloud sync error', error);
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    try {
      setProfile(newProfile);
      await secureStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      // Local wins → mirror up to Supabase (fire-and-forget, offline-safe).
      const userId = await getAuthUserId();
      if (userId) void pushFitnessProfile(userId, newProfile);
    } catch (error) {
      logger.error('[Profile] save error', error);
    }
  };

  const clearProfile = async () => {
    try {
      setProfile(null);
      await secureStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      logger.error('[Profile] clear error', error);
    }
  };

  const clearAllLocalData = async () => {
    try {
      setProfile(null);
      setXp(0);
      await secureStorage.removeItem(PROFILE_STORAGE_KEY);
      await secureStorage.removeItem(XP_STORAGE_KEY);
    } catch (error) {
      logger.error('[Profile] clear all error', error);
    }
  };

  return {
    profile,
    updateProfile,
    clearProfile,
    clearAllLocalData,
    isLoading,
    hasProfile: profile !== null,
    xp,
    addXp,
    rankInfo,
  };
});
