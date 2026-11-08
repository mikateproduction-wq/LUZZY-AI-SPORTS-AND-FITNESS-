export interface PoseKeypoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

export const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6],
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 11], [6, 12],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
];

export interface AngleDefinition {
  label: string;
  points: [number, number, number];
}

export const ANGLE_DEFINITIONS: AngleDefinition[] = [
  { label: 'L.Coude', points: [5, 7, 9] },
  { label: 'R.Coude', points: [6, 8, 10] },
  { label: 'L.Genou', points: [11, 13, 15] },
  { label: 'R.Genou', points: [12, 14, 16] },
  { label: 'L.Epaule', points: [7, 5, 11] },
  { label: 'R.Epaule', points: [8, 6, 12] },
];

export const MIN_CONFIDENCE = 0.3;

export function calculateAngle(
  a: PoseKeypoint,
  b: PoseKeypoint,
  c: PoseKeypoint
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180.0 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

export function drawKeypoints(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  minConfidence: number
): void {
  keypoints.forEach((kp) => {
    if (kp.score >= minConfidence) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#2563FF';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  minConfidence: number
): void {
  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  SKELETON_CONNECTIONS.forEach(([i, j]) => {
    const kpA = keypoints[i];
    const kpB = keypoints[j];
    if (kpA && kpB && kpA.score >= minConfidence && kpB.score >= minConfidence) {
      ctx.beginPath();
      ctx.moveTo(kpA.x, kpA.y);
      ctx.lineTo(kpB.x, kpB.y);
      ctx.stroke();
    }
  });
}

export function drawAngles(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  minConfidence: number
): void {
  ANGLE_DEFINITIONS.forEach((def) => {
    const [iA, iB, iC] = def.points;
    const a = keypoints[iA];
    const b = keypoints[iB];
    const c = keypoints[iC];

    if (
      a && b && c &&
      a.score >= minConfidence &&
      b.score >= minConfidence &&
      c.score >= minConfidence
    ) {
      const angle = calculateAngle(a, b, c);
      const label = `${angle}deg`;

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#FF00FF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(label, b.x + 10, b.y - 10);
      ctx.fillText(label, b.x + 10, b.y - 10);
    }
  });
}
