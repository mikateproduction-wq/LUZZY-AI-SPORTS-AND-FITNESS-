/**
 * Read-only catalogs from Supabase (`exercises`, `foods`).
 *
 * The local bundle (`@/data/exercises`) stays the instant/offline source;
 * the server catalog is merged on top: rows that match a local exercise
 * (normalized name) enrich nothing but confirm coverage, and DB-only rows
 * are appended with sensible defaults. A failed fetch silently falls back
 * to the local data — the UI never blocks on the network.
 */

import type { Exercise } from "@/types/fitness";
import { EXERCISES } from "@/data/exercises";
import { sanitizeText } from "@/utils/validation";
import { supabaseRequest, type SupabaseError } from "@/lib/supabase";

interface ExerciseCatalogRow {
  name: string;
  category: string | null;
  muscle_group: string | null;
  equipment: string | null;
  instructions: string | null;
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface FoodCatalogRow {
  name: string;
  brand: string | null;
  calories_per_100g: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

/** Stable id from a name — keeps list keys and navigation consistent. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const CATEGORIES = new Set(["cardio", "strength", "yoga", "stretching"]);

/** Split DB instructions (newline or "1." numbered list) into steps. */
function toInstructionSteps(raw: string | null): string[] {
  if (!raw) return [];
  return sanitizeText(raw, 4000)
    .split(/\n+|\d+[.)]\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function rowToExercise(row: ExerciseCatalogRow): Exercise | null {
  const name = sanitizeText(row.name, 120);
  if (!name) return null;

  const category = (row.category ?? "").toLowerCase().trim();
  const instructions = toInstructionSteps(row.instructions);
  return {
    id: `db_${slugify(name)}`,
    name,
    // DB categories outside the app's set fall back to "strength" so the
    // filters stay exhaustive.
    category: (CATEGORIES.has(category) ? category : "strength") as Exercise["category"],
    description: instructions[0] ?? "",
    duration: 10,
    difficulty: "beginner",
    caloriesBurn: 50,
    instructions,
    targetMuscles: row.muscle_group
      ? sanitizeText(row.muscle_group, 200).split(/[,;/]+/).map((m) => m.trim()).filter(Boolean)
      : [],
    imageUrl: "",
    videoUrl: "",
  };
}

export interface CatalogResult {
  /** Local bundle enriched/appended with the server catalog. */
  exercises: Exercise[];
  source: "local" | "merged";
  error: SupabaseError | null;
}

/**
 * Fetch the `exercises` catalog (read-only) and merge it with the local data.
 * Local entries always win (richer fields, translations, media); DB-only
 * exercises are appended.
 */
export async function fetchExerciseCatalog(): Promise<CatalogResult> {
  const { data, error } = await supabaseRequest<ExerciseCatalogRow[]>("exercises", {
    query: "select=name,category,muscle_group,equipment,instructions&limit=500",
  });

  if (error || !data?.length) {
    return { exercises: EXERCISES, source: "local", error };
  }

  const localByName = new Map<string, Exercise>(
    EXERCISES.map((exercise) => [normalizeName(exercise.name), exercise])
  );

  const merged: Exercise[] = [...EXERCISES];
  const seen = new Set(localByName.keys());

  for (const row of data) {
    const exercise = rowToExercise(row);
    if (!exercise) continue;
    const key = normalizeName(exercise.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(exercise);
  }

  return { exercises: merged, source: "merged", error: null };
}

export interface FoodCatalogResult {
  foods: Food[];
  error: SupabaseError | null;
}

/** Fetch the `foods` catalog (read-only). Empty list on failure. */
export async function fetchFoodCatalog(): Promise<FoodCatalogResult> {
  const { data, error } = await supabaseRequest<FoodCatalogRow[]>("foods", {
    query: "select=name,brand,calories_per_100g,protein_g,carbs_g,fat_g&limit=1000",
  });

  if (error || !data) {
    return { foods: [], error };
  }

  const foods: Food[] = [];
  for (const row of data) {
    const name = sanitizeText(row.name, 120);
    if (!name) continue;
    foods.push({
      id: `food_${slugify(name)}`,
      name,
      brand: row.brand ? sanitizeText(row.brand, 80) : null,
      caloriesPer100g: Math.max(0, Math.round(row.calories_per_100g ?? 0)),
      proteinG: Math.max(0, Number(row.protein_g ?? 0)),
      carbsG: Math.max(0, Number(row.carbs_g ?? 0)),
      fatG: Math.max(0, Number(row.fat_g ?? 0)),
    });
  }

  return { foods, error: null };
}
