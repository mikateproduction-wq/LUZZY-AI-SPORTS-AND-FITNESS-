/**
 * Poses 2D des exercices (stick figures).
 *
 * Format compact par exercice : une chaîne de joints `clé x,y` séparés par des espaces.
 * Clés obligatoires : h (tête), sl/sr (épaules), el/er (coudes), wl/wr (poignets),
 * hl/hr (hanches), kl/kr (genoux), al/ar (chevilles). `l` = côté gauche du corps,
 * `r` = côté droit. Les coordonnées vivent dans un repère libre (y vers le bas) :
 * le moteur de rendu recadre automatiquement la figure et les accessoires.
 *
 * Accessoire optionnel `prop` : `"<type> x y w h"` avec type parmi
 * bar (barre horizontale), wall (mur vertical, w ignoré), rope (corde horizontale),
 * box | bench | step | chair (volume plein), mat (tapis, ligne au sol).
 */
import { POSES_B } from '@/data/poses/cardioStrength';
import { POSES_I } from '@/data/poses/intermediate';
import { POSES_E } from '@/data/poses/expert';
import { POSES_N } from '@/data/poses/neckBackHip';
import { POSES_X1 } from '@/data/poses/extras1';
import { POSES_X2 } from '@/data/poses/extras2';

export type JointKey = 'h' | 'sl' | 'sr' | 'el' | 'er' | 'wl' | 'wr' | 'hl' | 'hr' | 'kl' | 'kr' | 'al' | 'ar';
export type Pt = readonly [number, number];
export type Pose = Record<JointKey, Pt>;

export interface PropDef {
  kind: 'bar' | 'wall' | 'rope' | 'box' | 'bench' | 'step' | 'chair' | 'mat';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ExercisePoseDef {
  pose: Pose;
  prop?: PropDef;
}

const JOINT_KEYS: JointKey[] = ['h', 'sl', 'sr', 'el', 'er', 'wl', 'wr', 'hl', 'hr', 'kl', 'kr', 'al', 'ar'];
const PROP_KINDS: PropDef['kind'][] = ['bar', 'wall', 'rope', 'box', 'bench', 'step', 'chair', 'mat'];

export function parsePose(raw: string): Pose {
  const out: Partial<Record<JointKey, Pt>> = {};
  for (const token of raw.trim().split(/\s+/)) {
    const m = /^([a-z]+)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(token);
    if (!m) throw new Error(`Pose token invalide: "${token}"`);
    const key = m[1] as JointKey;
    if (!JOINT_KEYS.includes(key)) throw new Error(`Joint inconnu: "${key}"`);
    out[key] = [Number(m[2]), Number(m[3])];
  }
  for (const key of JOINT_KEYS) {
    if (!out[key]) throw new Error(`Joint manquant: "${key}" dans "${raw}"`);
  }
  return out as Pose;
}

export function parseProp(raw: string): PropDef {
  const [kind, x, y, w, h] = raw.trim().split(/\s+/);
  if (!PROP_KINDS.includes(kind as PropDef['kind'])) throw new Error(`Accessoire inconnu: "${kind}"`);
  return { kind: kind as PropDef['kind'], x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
}

type RawEntry = readonly [pose: string, prop?: string];
const RAW: Record<string, RawEntry> = {
  ...POSES_B,
  ...POSES_I,
  ...POSES_E,
  ...POSES_N,
  ...POSES_X1,
  ...POSES_X2,
};

let cache: Record<string, ExercisePoseDef> | null = null;

export function getExercisePose(id: string): ExercisePoseDef | null {
  if (!cache) {
    cache = {};
    for (const [key, [pose, prop]] of Object.entries(RAW)) {
      cache[key] = { pose: parsePose(pose), prop: prop ? parseProp(prop) : undefined };
    }
  }
  return cache[id] ?? null;
}

export const POSE_IDS = Object.keys(RAW);
