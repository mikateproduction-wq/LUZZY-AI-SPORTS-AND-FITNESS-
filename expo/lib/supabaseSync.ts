/**
 * Supabase sync layer — user tables only (client-writable), local storage
 * stays the offline cache and is never deleted.
 *
 * Merge policies:
 * - user_fitness_profiles: local profile wins if present (user just edited
 *   it), remote fills the gap on a fresh install.
 * - daily_activity: per-metric max merge — neither side can lose progress.
 * - user_xp: monotonic — XP can only ever go UP (max of local and remote);
 *   `rank` is computed server-side and never written by the client.
 */

import type { ActivityDayStats, FitnessGoal, FitnessLevel, Gender, UserProfile } from "@/types/fitness";
import { logger } from "@/utils/logger";
import { isSecureUrl, sanitizeName, sanitizeText, clampInt } from "@/utils/validation";
import { supabaseRequest, type SupabaseError } from "@/lib/supabase";

/** Field limits mirrored by the database CHECK constraints. */
const LIMITS = {
  name: 60,
  medicalRestrictions: 500,
  phoneNumber: 24,
} as const;

// ---------------------------------------------------------------------------
// user_fitness_profiles
// ---------------------------------------------------------------------------

export interface UserFitnessProfileRow {
  user_id: string;
  name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  fitness_level: string | null;
  fitness_goal: string | null;
  activity_level: string | null;
  dietary_preference: string | null;
  medical_restrictions: string | null;
  phone_number: string | null;
}

/** Local UserProfile → whitelisted DB row (sanitized, capped, no server fields). */
function fitnessProfileToRow(profile: UserProfile): UserFitnessProfileRow {
  const restrictions =
    typeof profile.medicalRestrictions === "string"
      ? sanitizeText(profile.medicalRestrictions, LIMITS.medicalRestrictions)
      : null;
  return {
    user_id: "",
    name: profile.name ? sanitizeName(profile.name, LIMITS.name) : null,
    age: clampInt(profile.age, 0, 120),
    height_cm: clampInt(profile.height, 0, 300),
    weight_kg: clampInt(profile.weight, 0, 500),
    gender: profile.gender ?? null,
    fitness_level: profile.fitnessLevel ?? null,
    fitness_goal: profile.fitnessGoal ?? null,
    activity_level: profile.activityLevel ?? null,
    dietary_preference: profile.dietaryPreference ?? null,
    medical_restrictions: restrictions || null,
    phone_number: profile.phoneNumber
      ? sanitizeText(profile.phoneNumber, LIMITS.phoneNumber)
      : null,
  };
}

/** DB row → local UserProfile shape (missing fields stay undefined). */
export function rowToUserProfile(row: UserFitnessProfileRow): Partial<UserProfile> {
  const out: Partial<UserProfile> = {};
  if (row.name) out.name = row.name;
  if (typeof row.age === "number") out.age = row.age;
  if (typeof row.height_cm === "number") out.height = row.height_cm;
  if (typeof row.weight_kg === "number") out.weight = row.weight_kg;
  if (row.gender) out.gender = row.gender as Gender;
  if (row.fitness_level) out.fitnessLevel = row.fitness_level as FitnessLevel;
  if (row.fitness_goal) out.fitnessGoal = row.fitness_goal as FitnessGoal;
  if (row.activity_level) out.activityLevel = row.activity_level as UserProfile["activityLevel"];
  if (row.dietary_preference)
    out.dietaryPreference = row.dietary_preference as UserProfile["dietaryPreference"];
  if (row.medical_restrictions) out.medicalRestrictions = row.medical_restrictions;
  if (row.phone_number) out.phoneNumber = row.phone_number;
  return out;
}

export async function pullFitnessProfile(
  userId: string
): Promise<{ data: UserFitnessProfileRow | null; error: SupabaseError | null }> {
  const { data, error } = await supabaseRequest<UserFitnessProfileRow[]>(
    "user_fitness_profiles",
    { query: `select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1` }
  );
  return { data: data?.[0] ?? null, error };
}

export async function pushFitnessProfile(
  userId: string,
  profile: UserProfile
): Promise<SupabaseError | null> {
  const row = fitnessProfileToRow(profile);
  row.user_id = userId; // MUST equal the connected user's id (RLS).
  const { error } = await supabaseRequest("user_fitness_profiles", {
    method: "POST",
    query: "on_conflict=user_id",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: row,
  });
  if (error) {
    logger.error("[Sync] pushFitnessProfile failed", { status: error.status, code: error.code });
  }
  return error;
}

// ---------------------------------------------------------------------------
// daily_activity
// ---------------------------------------------------------------------------

export interface DailyActivityRow {
  user_id: string;
  activity_date: string;
  exercise_minutes: number;
  exercises_completed: number;
  calories_from_exercises: number;
}

export async function pullDailyActivity(
  userId: string,
  days = 35
): Promise<{ data: DailyActivityRow[] | null; error: SupabaseError | null }> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);
  return supabaseRequest<DailyActivityRow[]>("daily_activity", {
    query:
      `select=*&user_id=eq.${encodeURIComponent(userId)}` +
      `&activity_date=gte.${sinceKey}&order=activity_date.desc&limit=${days}`,
  });
}

export async function pushDailyActivity(
  userId: string,
  day: ActivityDayStats
): Promise<SupabaseError | null> {
  const { error } = await supabaseRequest("daily_activity", {
    method: "POST",
    query: "on_conflict=user_id,activity_date",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      user_id: userId,
      activity_date: day.dateKey,
      exercise_minutes: clampInt(day.exerciseMinutes, 0, 1440),
      exercises_completed: clampInt(day.exercisesCompleted, 0, 500),
      calories_from_exercises: clampInt(day.caloriesFromExercises, 0, 20000),
    },
  });
  if (error) {
    logger.error("[Sync] pushDailyActivity failed", { status: error.status, code: error.code });
  }
  return error;
}

// ---------------------------------------------------------------------------
// user_xp — monotonic, rank is computed server-side
// ---------------------------------------------------------------------------

export interface UserXpRow {
  user_id: string;
  xp: number;
  rank: string | null;
}

export async function pullUserXp(
  userId: string
): Promise<{ data: UserXpRow | null; error: SupabaseError | null }> {
  const { data, error } = await supabaseRequest<UserXpRow[]>("user_xp", {
    query: `select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  });
  return { data: data?.[0] ?? null, error };
}

/**
 * Push XP only if it is HIGHER than the server value (XP can never decrease).
 * Read-modify-write; a concurrent higher server value is simply kept.
 */
export async function pushUserXp(userId: string, xp: number): Promise<SupabaseError | null> {
  const { data, error: pullError } = await pullUserXp(userId);
  if (pullError) return pullError;
  const remoteXp = typeof data?.xp === "number" ? data.xp : 0;
  if (xp <= remoteXp) return null;

  const { error } = await supabaseRequest("user_xp", {
    method: "POST",
    query: "on_conflict=user_id",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: { user_id: userId, xp: clampInt(xp, 0, 1_000_000) },
  });
  if (error) {
    logger.error("[Sync] pushUserXp failed", { status: error.status, code: error.code });
  }
  return error;
}
