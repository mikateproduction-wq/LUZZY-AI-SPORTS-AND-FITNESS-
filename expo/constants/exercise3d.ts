import type { ExerciseCategory } from '@/types/fitness';

/**
 * 3D exercise animation configuration.
 *
 * The coach model and its animation clips are generated with Meshy (auto-rig).
 * CRITICAL 3D rules encoded here:
 * - `riggedGlbUrl` must be the RIGGED GLB. The plain model GLB has no skeleton,
 *   so animation clips bound to it silently do nothing.
 * - Orientation must come from the generation metadata (`localFrontAxis` /
 *   `localUpAxis`), never from guessed rotation constants.
 */
export type ExerciseClipKey =
  | 'squat'
  | 'pushup'
  | 'jumpingJacks'
  | 'core'
  | 'hinge'
  | 'burpee'
  | 'jumpRope'
  | 'run'
  | 'walk'
  | 'breathe';

export type GeneratedModelAxis =
  | 'positiveX'
  | 'negativeX'
  | 'positiveY'
  | 'negativeY'
  | 'positiveZ'
  | 'negativeZ';

export interface Exercise3DModelConfig {
  /** project_3d_models row id — required for future append3DAnimations runs. */
  modelId: string;
  /** Rigged GLB URL (auto-rig output whose bones match every animation clip). */
  riggedGlbUrl: string;
  hasIntrinsicFront: boolean;
  localFrontAxis: GeneratedModelAxis;
  localUpAxis: GeneratedModelAxis;
  /** One GLB URL per clip — each shares the rigged model's skeleton. */
  clips: Record<ExerciseClipKey, string>;
}

/**
 * Filled with the generated asset URLs once the coach generation completes.
 * While empty, the app gracefully falls back to the 2D diagram.
 */
export const EXERCISE_3D_MODEL: Exercise3DModelConfig = {
  modelId: '',
  riggedGlbUrl: '',
  hasIntrinsicFront: true,
  localFrontAxis: 'positiveZ',
  localUpAxis: 'positiveY',
  clips: {
    squat: '',
    pushup: '',
    jumpingJacks: '',
    core: '',
    hinge: '',
    burpee: '',
    jumpRope: '',
    run: '',
    walk: '',
    breathe: '',
  },
};

/** Every animation loop is normalized to exactly this duration. */
export const CLIP_CYCLE_SECONDS = 5;

export function is3DAnimationReady(): boolean {
  return EXERCISE_3D_MODEL.riggedGlbUrl.length > 0;
}

/**
 * Ordered keyword rules — first match wins. Mirrors (and simplifies) the
 * legacy 2D diagram matching so every one of the ~150 exercises maps to the
 * closest generated clip.
 */
const CLIP_RULES: [RegExp, ExerciseClipKey][] = [
  [/jump rope|rope|corde/, 'jumpRope'],
  [/jack/, 'jumpingJacks'],
  [/burpee|mountain|escalade|bear crawl|crawl/, 'burpee'],
  [/inchworm/, 'pushup'],
  [/push|pompe|pike|diamond|plyo|dip|handstand|plank|planche|shoulder tap/, 'pushup'],
  [
    /crunch|sit-up|situp|hollow|superman|dead bug|bird dog|dragon|boat|navasana|l-sit|v-sit|russian|twist|leg raise/,
    'core',
  ],
  [/stretch|étirement|etirement/, 'breathe'],
  [
    /bridge|pont|hip thrust|glute|deadlift|rdl|romanian|kettlebell|swing|nordic|donkey|turkish|get-up/,
    'hinge',
  ],
  [
    /squat|wall sit|chair pose|pistol|sumo|lunge|fente|split|step-up|step up|box jump|calf|mollet/,
    'squat',
  ],
  [/run|sprint|jog|course|high knee|genoux/, 'run'],
  [/shadow|boxing/, 'run'],
  [/walk|march|brisk/, 'walk'],
  [/lateral raise/, 'jumpingJacks'],
  [/row|tirage|curl|tricep/, 'pushup'],
  [
    /yoga|pose|salutation|vinyasa|flow|dog|chien|cobra|warrior|guerrier|pigeon|tree|arbre|cat|cow|chat|thread|opener|circle|roll|neck|ankle|hip circle|seated|breathing/,
    'breathe',
  ],
];

const CATEGORY_DEFAULT: Record<ExerciseCategory, ExerciseClipKey> = {
  cardio: 'run',
  strength: 'squat',
  yoga: 'breathe',
  stretching: 'breathe',
};

/** Resolve the best animation clip for an exercise (English source name). */
export function getClipKeyForExercise(
  name: string,
  category: ExerciseCategory
): ExerciseClipKey {
  const normalized = name.toLowerCase();
  for (const [pattern, key] of CLIP_RULES) {
    if (pattern.test(normalized)) return key;
  }
  return CATEGORY_DEFAULT[category] ?? 'breathe';
}
