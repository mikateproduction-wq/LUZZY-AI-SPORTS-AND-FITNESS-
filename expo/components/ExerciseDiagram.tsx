import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { getExercisePose, type ExercisePoseDef, type JointKey, type PropDef, type Pt } from '@/data/exercisePoses';

interface ExerciseDiagramProps {
  exerciseId: string;
  size?: number;
}

const VIEW = 200;
const PAD = 16;
const HEAD_R = 11;
const FOOT_LEN = 12;
const MAX_SCALE = 1;
const LIMB_W = 5.2;
const TORSO_EDGE_W = 1.2;

const LIMBS: [JointKey, JointKey][] = [
  ['sl', 'el'], ['el', 'wl'], ['sr', 'er'], ['er', 'wr'],
  ['hl', 'kl'], ['kl', 'al'], ['hr', 'kr'], ['kr', 'ar'],
];

type Fit = (p: Pt) => Pt;

function computeFit(def: ExercisePoseDef): { fit: Fit; scale: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  (Object.values(def.pose) as Pt[]).forEach(([x, y]) => { xs.push(x); ys.push(y); });
  xs.push(def.pose.h[0] - HEAD_R, def.pose.h[0] + HEAD_R);
  ys.push(def.pose.h[1] - HEAD_R);
  const prop = def.prop;
  if (prop) {
    xs.push(prop.x, prop.x + prop.w);
    ys.push(prop.y, prop.y + prop.h);
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const avail = VIEW - PAD * 2;
  const scale = Math.min(avail / spanX, avail / spanY, MAX_SCALE);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const fit: Fit = ([x, y]) => [(x - cx) * scale + VIEW / 2, (y - cy) * scale + VIEW / 2];
  return { fit, scale };
}

function propShape(prop: PropDef, fit: Fit, color: string, sw: number, fill: string) {
  const [x1, y1] = fit([prop.x, prop.y]);
  const [x2, y2] = fit([prop.x + prop.w, prop.y + prop.h]);
  if (prop.kind === 'bar' || prop.kind === 'rope') {
    const [ex, ey] = fit([prop.x + prop.w, prop.y]);
    return <Line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={sw} strokeLinecap="round" />;
  }
  if (prop.kind === 'wall') {
    const [wx, wy] = fit([prop.x, prop.y + prop.h]);
    return <Line x1={x1} y1={y1} x2={wx} y2={wy} stroke={color} strokeWidth={sw} strokeLinecap="round" />;
  }
  if (prop.kind === 'mat') {
    return <Line x1={x1} y1={y1} x2={fit([prop.x + prop.w, prop.y])[0]} y2={y1} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />;
  }
  return (
    <Rect
      x={Math.min(x1, x2)} y={Math.min(y1, y2)}
      width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)}
      rx={3} stroke={color} strokeWidth={sw} fill={fill} opacity={0.9}
    />
  );
}

export default function ExerciseDiagram({ exerciseId, size = 200 }: ExerciseDiagramProps) {
  const { theme } = useTheme();
  const body = theme.colors.text;
  const accent = theme.colors.primary;
  const surface = theme.colors.surface;
  const def = useMemo(() => getExercisePose(exerciseId), [exerciseId]);

  if (!def) return null;

  const { fit, scale } = computeFit(def);
  const { pose, prop } = def;
  const limbW = LIMB_W;
  const shoulderMid: Pt = [(pose.sl[0] + pose.sr[0]) / 2, (pose.sl[1] + pose.sr[1]) / 2];
  const groundY = Math.max(pose.al[1], pose.ar[1]) + 2;
  const [hx, hy] = fit(pose.h);
  const headR = HEAD_R * scale;

  const seg = (a: Pt, b: Pt, key: string, w: number) => {
    const [ax, ay] = fit(a);
    const [bx, by] = fit(b);
    return <Line key={key} x1={ax} y1={ay} x2={bx} y2={by} stroke={body} strokeWidth={w} strokeLinecap="round" />;
  };

  const torso = [pose.sl, pose.sr, pose.hr, pose.hl].map((p) => fit(p).join(',')).join(' ');
  const [gx1, gy1] = fit([Math.min(pose.al[0], pose.ar[0], pose.wl[0], pose.wr[0]) - 40, groundY]);
  const [gx2, gy2] = fit([Math.max(pose.al[0], pose.ar[0], pose.wl[0], pose.wr[0]) + 40, groundY]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel="Exercise diagram">
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        {prop ? propShape(prop, fit, accent, Math.max(2, limbW * 0.6), surface) : null}
        <Line x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke={accent} strokeWidth={1.2} opacity={0.35} />
        <Path d={`M ${torso}`} fill={accent} fillOpacity={0.12} stroke={body} strokeWidth={TORSO_EDGE_W} strokeLinejoin="round" />
        {seg(shoulderMid, pose.h, 'neck', limbW * 0.9)}
        {LIMBS.map(([a, b], i) => seg(pose[a], pose[b], `limb${i}`, limbW))}
        {seg(pose.al, [pose.al[0] + FOOT_LEN, pose.al[1]], 'footl', limbW * 0.9)}
        {seg(pose.ar, [pose.ar[0] + FOOT_LEN, pose.ar[1]], 'footr', limbW * 0.9)}
        <Circle cx={hx} cy={hy} r={headR} stroke={body} strokeWidth={limbW * 0.8} fill={surface} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
