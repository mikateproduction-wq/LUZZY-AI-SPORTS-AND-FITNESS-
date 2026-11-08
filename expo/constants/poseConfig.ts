export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
] as const;

export const SKELETON_CONNECTIONS: [number, number][] = [
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [5, 11],
  [6, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
];

export const ANGLE_CONFIGS = [
  { name: 'L.Elbow', points: [5, 7, 9] as const },
  { name: 'R.Elbow', points: [6, 8, 10] as const },
  { name: 'L.Knee', points: [11, 13, 15] as const },
  { name: 'R.Knee', points: [12, 14, 16] as const },
  { name: 'L.Shoulder', points: [7, 5, 11] as const },
  { name: 'R.Shoulder', points: [8, 6, 12] as const },
];

export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

export const MIN_CONFIDENCE = 0.3;

export const COLORS = {
  skeleton: '#00E5FF',
  joint: '#2979FF',
  jointBorder: '#FFFFFF',
  angle: '#FF00FF',
  angleBackground: 'rgba(0, 0, 0, 0.55)',
} as const;
