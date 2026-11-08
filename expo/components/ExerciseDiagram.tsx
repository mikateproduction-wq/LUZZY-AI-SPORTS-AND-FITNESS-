import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle, Path, Line, Text as SvgText, Rect, G, Polyline, Ellipse, Defs,
  RadialGradient, Stop, LinearGradient,
} from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface ExerciseDiagramProps {
  exerciseType: string;
  size?: number;
}

export default function ExerciseDiagram({ exerciseType, size = 200 }: ExerciseDiagramProps) {
  const { theme } = useTheme();
  const p = theme.colors.primary;
  const t = theme.colors.text;
  const s = theme.colors.success;
  const w = theme.colors.warning;
  const skinFill = 'none';
  const bodyStroke = t;
  const sw = '2.2';

  const Head = ({ cx = 100, cy = 22, r = 13 }: { cx?: number; cy?: number; r?: number }) => (
    <G>
      <Circle cx={cx} cy={cy} r={r} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={cx - 4} cy={cy - 2} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={cx + 4} cy={cy - 2} r={1.5} fill={p} opacity={0.7} />
      <Path
        d={`M ${cx - 4} ${cy + 4} Q ${cx} ${cy + 7} ${cx + 4} ${cy + 4}`}
        stroke={p} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.6}
      />
    </G>
  );

  const Torso = ({
    x1 = 88, y1 = 35, x2 = 112, y2 = 35, x3 = 109, y3 = 78, x4 = 91, y4 = 78,
  }: { x1?: number; y1?: number; x2?: number; y2?: number; x3?: number; y3?: number; x4?: number; y4?: number }) => (
    <G>
      <Path
        d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`}
        stroke={bodyStroke} strokeWidth={sw} fill={skinFill} strokeLinejoin="round"
      />
      <Line
        x1={(x1 + x2) / 2} y1={(y1 + y2) / 2}
        x2={(x3 + x4) / 2} y2={(y3 + y4) / 2}
        stroke={p} strokeWidth="0.8" opacity={0.3}
      />
    </G>
  );

  const Arm = ({
    x1, y1, ex, ey, hand = false,
  }: { x1: number; y1: number; ex: number; ey: number; hand?: boolean }) => (
    <G>
      <Line x1={x1} y1={y1} x2={(x1 + ex) / 2} y2={(y1 + ey) / 2} stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={(x1 + ex) / 2} y1={(y1 + ey) / 2} x2={ex} y2={ey} stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      {hand && <Circle cx={ex} cy={ey} r={3.5} fill={p} opacity={0.8} />}
    </G>
  );

  const Leg = ({
    x1, y1, kx, ky, fx, fy, foot = false,
  }: { x1: number; y1: number; kx: number; ky: number; fx: number; fy: number; foot?: boolean }) => (
    <G>
      <Line x1={x1} y1={y1} x2={kx} y2={ky} stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={kx} y1={ky} x2={fx} y2={fy} stroke={bodyStroke} strokeWidth="2" strokeLinecap="round" />
      {foot && <Ellipse cx={fx} cy={fy + 3} rx={6} ry={3} fill={p} opacity={0.75} />}
    </G>
  );

  const AngleArc = ({
    cx, cy, r, start, end, label, color = p,
  }: { cx: number; cy: number; r: number; start: number; end: number; label: string; color?: string }) => {
    const s1 = (start * Math.PI) / 180;
    const s2 = (end * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s1);
    const y1 = cy + r * Math.sin(s1);
    const x2 = cx + r * Math.cos(s2);
    const y2 = cy + r * Math.sin(s2);
    const mid = ((start + end) / 2 * Math.PI) / 180;
    const lx = cx + (r + 10) * Math.cos(mid);
    const ly = cy + (r + 10) * Math.sin(mid);
    return (
      <G>
        <Path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={color} strokeWidth="1.8" fill="none" />
        <SvgText x={lx} y={ly} fill={color} fontSize="9" fontWeight="bold" textAnchor="middle">{label}</SvgText>
      </G>
    );
  };

  const GroundLine = ({ y = 140, x1 = 55, x2 = 145 }: { y?: number; x1?: number; x2?: number }) => (
    <Line x1={x1} y1={y} x2={x2} y2={y} stroke={p} strokeWidth="1.5" strokeDasharray="5,3" opacity={0.5} />
  );

  const MuscleHighlight = ({
    cx, cy, rx, ry, color,
  }: { cx: number; cy: number; rx: number; ry: number; color: string }) => (
    <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} opacity={0.25} />
  );

  const renderPushup = () => (
    <G>
      <GroundLine y={108} x1={30} x2={170} />
      <Circle cx={44} cy={62} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={40} cy={59} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={48} cy={59} r={1.5} fill={p} opacity={0.7} />
      <Path d="M 56 66 L 152 80" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <MuscleHighlight cx={100} cy={73} rx={25} ry={6} color={p} />
      <Line x1="56" y1="66" x2="46" y2="90" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="62" y1="68" x2="52" y2="90" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={49} cy={92} rx={6} ry={3} fill={p} opacity={0.8} />
      <Line x1="140" y1="78" x2="150" y2="104" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="150" y1="78" x2="160" y2="104" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={155} cy={106} rx={6} ry={3} fill={p} opacity={0.8} />
      <AngleArc cx={56} cy={66} r={14} start={-20} end={70} label="45°" />
      <SvgText x="100" y="124" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Corps droit · coudes à 45°</SvgText>
    </G>
  );

  const renderSquat = () => (
    <G>
      <GroundLine y={128} x1={60} x2={140} />
      <Head cx={100} cy={22} />
      <Torso x1={88} y1={35} x2={112} y2={35} x3={112} y3={68} x4={88} y4={68} />
      <Arm x1={88} y1={45} ex={66} ey={55} />
      <Arm x1={112} y1={45} ex={134} ey={55} />
      <Leg x1={91} y1={68} kx={76} ky={98} fx={82} fy={125} foot />
      <Leg x1={109} y1={68} kx={124} ky={98} fx={118} fy={125} foot />
      <MuscleHighlight cx={80} cy={90} rx={14} ry={18} color={s} />
      <MuscleHighlight cx={120} cy={90} rx={14} ry={18} color={s} />
      <AngleArc cx={76} cy={98} r={16} start={-60} end={30} label="90°" color={s} />
      <Line x1="60" y1="128" x2="140" y2="128" stroke={p} strokeWidth="1.5" />
      <SvgText x="100" y="144" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Genoux sur orteils · dos droit</SvgText>
    </G>
  );

  const renderPlank = () => (
    <G>
      <GroundLine y={120} x1={30} x2={168} />
      <Circle cx={50} cy={72} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={46} cy={69} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={54} cy={69} r={1.5} fill={p} opacity={0.7} />
      <Line x1="62" y1="76" x2="152" y2="90" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <MuscleHighlight cx={107} cy={83} rx={30} ry={6} color={p} />
      <Ellipse cx={63} cy={97} rx={5} ry={3} fill={p} opacity={0.85} />
      <Ellipse cx={152} cy={91} rx={5} ry={3} fill={p} opacity={0.85} />
      <Line x1="63" y1="97" x2="63" y2="120" stroke={p} strokeWidth="1.2" strokeDasharray="3,2" opacity={0.5} />
      <Line x1="152" y1="91" x2="152" y2="120" stroke={p} strokeWidth="1.2" strokeDasharray="3,2" opacity={0.5} />
      <Circle cx={107} cy={83} r={4} fill={s} opacity={0.8} />
      <Rect x={39} y={107} width={28} height={8} rx={4} fill={p} opacity={0.75} />
      <SvgText x="53" y="114" fill="#FFF" fontSize="7" fontWeight="bold" textAnchor="middle">coude</SvgText>
      <SvgText x="100" y="135" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Corps aligné · gainage actif</SvgText>
    </G>
  );

  const renderLunge = () => (
    <G>
      <GroundLine y={138} x1={55} x2={165} />
      <Head cx={100} cy={22} />
      <Torso />
      <Arm x1={88} y1={45} ex={72} ey={58} />
      <Arm x1={112} y1={45} ex={128} ey={58} />
      <Leg x1={92} y1={78} kx={78} ky={108} fx={74} fy={135} foot />
      <Leg x1={108} y1={78} kx={132} ky={106} fx={150} fy={106} />
      <Ellipse cx={150} cy={108} rx={6} ry={3} fill={p} opacity={0.8} />
      <MuscleHighlight cx={80} cy={100} rx={14} ry={18} color={s} />
      <AngleArc cx={78} cy={108} r={16} start={-70} end={20} label="90°" color={s} />
      <Line x1="55" y1="138" x2="165" y2="138" stroke={p} strokeWidth="1.5" opacity={0.5} />
      <SvgText x="100" y="152" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Genou avant à 90° · dos droit</SvgText>
    </G>
  );

  const renderRunning = () => (
    <G>
      <Head cx={100} cy={24} />
      <Torso x1={88} y1={37} x2={112} y2={37} x3={110} y3={70} x4={90} y4={70} />
      <Arm x1={88} y1={47} ex={62} ey={36} hand />
      <Arm x1={112} y1={47} ex={136} ey={62} hand />
      <Leg x1={92} y1={70} kx={74} ky={96} fx={60} fy={122} foot />
      <Leg x1={108} y1={70} kx={128} ky={88} fx={148} fy={74} />
      <Ellipse cx={148} cy={76} rx={5} ry={3} fill={p} opacity={0.8} />
      <MuscleHighlight cx={76} cy={90} rx={15} ry={18} color={s} />
      <Path
        d="M 50 125 Q 80 120 100 124 Q 120 128 155 123"
        stroke={p} strokeWidth="1.8" fill="none" strokeDasharray="3,3" opacity={0.5}
      />
      <Path d="M 100 24 L 96 16" stroke={p} strokeWidth="2" strokeLinecap="round" />
      <SvgText x="100" y="140" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Attaque médio-pied · torse droit</SvgText>
    </G>
  );

  const renderBridge = () => (
    <G>
      <GroundLine y={132} x1={40} x2={165} />
      <Circle cx={148} cy={68} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={144} cy={65} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={152} cy={65} r={1.5} fill={p} opacity={0.7} />
      <Path d="M 136 78 L 136 103 L 118 107" stroke={bodyStroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Line x1="136" y1="90" x2="110" y2="76" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="110" y1="76" x2="88" y2="80" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <MuscleHighlight cx={113} cy={80} rx={20} ry={7} color={s} />
      <Circle cx={100} cy={82} r={8} fill={s} opacity={0.8} />
      <SvgText x="100" y="86" fill="#FFF" fontSize="7" fontWeight="bold" textAnchor="middle">hip</SvgText>
      <Polyline points="95,76 100,70 105,76" stroke={s} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Line x1="118" y1="107" x2="100" y2="132" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="136" y1="103" x2="120" y2="132" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={100} cy={133} rx={6} ry={3} fill={p} opacity={0.8} />
      <Ellipse cx={120} cy={133} rx={6} ry={3} fill={p} opacity={0.8} />
      <SvgText x="100" y="148" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Hanches hautes · fessiers contractés</SvgText>
    </G>
  );

  const renderMountainClimber = () => (
    <G>
      <GroundLine y={110} x1={28} x2={165} />
      <Circle cx={50} cy={56} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={46} cy={53} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={54} cy={53} r={1.5} fill={p} opacity={0.7} />
      <Line x1="62" y1="62" x2="152" y2="82" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <Line x1="56" y1="68" x2="42" y2="90" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={43} cy={92} rx={5} ry={3} fill={p} opacity={0.85} />
      <Path d="M 122 78 L 106 60" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="147" y1="81" x2="154" y2="108" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={154} cy={110} rx={5} ry={3} fill={p} opacity={0.85} />
      <Circle cx={106} cy={60} r={7} fill={s} opacity={0.85} />
      <SvgText x="106" y="64" fill="#FFF" fontSize="7" fontWeight="bold" textAnchor="middle">→</SvgText>
      <MuscleHighlight cx={106} cy={65} rx={12} ry={10} color={s} />
      <SvgText x="100" y="126" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Genou → poitrine · hanches basses</SvgText>
    </G>
  );

  const renderBurpee = () => (
    <G>
      <Head cx={100} cy={16} />
      <Torso x1={92} y1={29} x2={108} y2={29} x3={106} y3={48} x4={94} y4={48} />
      <Arm x1={92} y1={35} ex={78} ey={26} hand />
      <Arm x1={108} y1={35} ex={122} ey={26} hand />
      <Leg x1={94} y1={48} kx={88} ky={63} fx={88} fy={72} foot />
      <Leg x1={106} y1={48} kx={112} ky={63} fx={112} fy={72} foot />
      <Path d="M 78 28 L 88 22 L 84 28 Z" fill={p} opacity={0.8} />
      <Path d="M 122 28 L 112 22 L 116 28 Z" fill={p} opacity={0.8} />
      <SvgText x="100" y="85" fill={t} fontSize="9" fontWeight="bold" textAnchor="middle">Phase saut ↑</SvgText>
      <Circle cx={52} cy={104} r={9} stroke={bodyStroke} strokeWidth="2" fill={skinFill} />
      <Line x1="52" y1="113" x2="118" y2="115" stroke={bodyStroke} strokeWidth="3" strokeLinecap="round" />
      <Line x1="52" y1="113" x2="45" y2="133" stroke={bodyStroke} strokeWidth="2" strokeLinecap="round" />
      <Line x1="60" y1="113" x2="67" y2="133" stroke={bodyStroke} strokeWidth="2" strokeLinecap="round" />
      <Ellipse cx={47} cy={134} rx={5} ry={3} fill={p} opacity={0.8} />
      <Ellipse cx={67} cy={134} rx={5} ry={3} fill={p} opacity={0.8} />
      <MuscleHighlight cx={85} cy={114} rx={22} ry={5} color={p} />
      <SvgText x="96" y="148" fill={t} fontSize="9" fontWeight="bold" textAnchor="middle">Phase planche</SvgText>
    </G>
  );

  const renderBirdDog = () => (
    <G>
      <GroundLine y={115} x1={40} x2={165} />
      <Circle cx={100} cy={60} r={11} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={96} cy={57} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={104} cy={57} r={1.5} fill={p} opacity={0.7} />
      <Line x1="100" y1="71" x2="100" y2="108" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Arm x1={100} y1={82} ex={66} ey={74} hand />
      <Circle cx={66} cy={74} r={5} fill={s} />
      <Path d="M 100 98 L 140" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="100" y1="98" x2="140" y2="106" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={141} cy={107} rx={5} ry={3} fill={s} opacity={0.9} />
      <Path d="M 67 74 L 48 86" stroke={p} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M 140 106 L 160 94" stroke={p} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx={49} cy={87} r={4} fill={p} />
      <Circle cx={160} cy={94} r={4} fill={p} />
      <Line x1="100" y1="82" x2="118" y2="88" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="118" y1="89" x2="118" y2="108" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <SvgText x="100" y="130" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Bras + jambe opposés · dos plat</SvgText>
    </G>
  );

  const renderDeadBug = () => (
    <G>
      <Circle cx={100} cy={56} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={96} cy={53} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={104} cy={53} r={1.5} fill={p} opacity={0.7} />
      <Rect x={88} y={68} width={24} height={34} rx={6} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Path d="M 88 74 L 84 80 L 62 52" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={62} cy={52} r={5} fill={s} />
      <Path d="M 112 74 L 116 80 L 136 94" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={136} cy={95} r={4} fill={p} />
      <Path d="M 92 102 L 66 128" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={65} cy={129} r={4} fill={p} />
      <Path d="M 108 102 L 136 80" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={136} cy={80} r={5} fill={s} />
      <Path d="M 80 68 Q 100 64 120 68" stroke={p} strokeWidth="2" fill="none" opacity={0.5} />
      <Rect x={50} y={125} width={40} height={6} rx={3} fill={p} opacity={0.2} />
      <SvgText x="70" y="130" fill={p} fontSize="7" fontWeight="bold" textAnchor="middle">dos plat</SvgText>
      <SvgText x="100" y="148" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Lombaires au sol · bras + jambe</SvgText>
    </G>
  );

  const renderJumpingJacks = () => (
    <G>
      <Head />
      <Torso />
      <Arm x1={88} y1={45} ex={54} ey={26} hand />
      <Arm x1={112} y1={45} ex={146} ey={26} hand />
      <Leg x1={92} y1={78} kx={78} ky={102} fx={65} fy={122} foot />
      <Leg x1={108} y1={78} kx={122} ky={102} fx={135} fy={122} foot />
      <GroundLine y={128} />
      <Polyline points="54,20 100,14 146,20" stroke={p} strokeWidth="1.5" fill="none" opacity={0.5} />
      <SvgText x="100" y="142" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Bras + jambes en croix</SvgText>
    </G>
  );

  const renderCalfRaise = () => (
    <G>
      <GroundLine y={132} />
      <Head />
      <Torso />
      <Arm x1={88} y1={48} ex={70} ey={50} />
      <Arm x1={112} y1={48} ex={130} ey={50} />
      <Leg x1={92} y1={78} kx={90} ky={108} fx={86} fy={128} />
      <Leg x1={108} y1={78} kx={110} ky={108} fx={114} fy={128} />
      <Ellipse cx={86} cy={131} rx={7} ry={3} fill={p} opacity={0.9} />
      <Ellipse cx={114} cy={131} rx={7} ry={3} fill={p} opacity={0.9} />
      <MuscleHighlight cx={90} cy={112} rx={10} ry={14} color={s} />
      <MuscleHighlight cx={110} cy={112} rx={10} ry={14} color={s} />
      <Polyline points="80,106 86,98 92,106" stroke={p} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Polyline points="108,106 114,98 120,106" stroke={p} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <SvgText x="100" y="148" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Talon levé · contraction du mollet</SvgText>
    </G>
  );

  const renderSidePlank = () => (
    <G>
      <GroundLine y={116} x1={35} x2={158} />
      <Circle cx={55} cy={76} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={51} cy={73} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={59} cy={73} r={1.5} fill={p} opacity={0.7} />
      <Line x1="55" y1="88" x2="55" y2="104" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="55" y1="96" x2="150" y2="106" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <MuscleHighlight cx={102} cy={101} rx={30} ry={5} color={p} />
      <Ellipse cx={56} cy={106} rx={5} ry={3} fill={p} opacity={0.85} />
      <Ellipse cx={150} cy={107} rx={5} ry={3} fill={p} opacity={0.85} />
      <Line x1="55" y1="90" x2="40" y2="108" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M 55 94 L 80 80" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={80} cy={80} r={5} fill={s} />
      <Polyline points="76,76 80,70 84,76" stroke={s} strokeWidth="2" fill="none" strokeLinecap="round" />
      <SvgText x="100" y="132" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Hanches soulevées · corps aligné</SvgText>
    </G>
  );

  const renderHighKnees = () => (
    <G>
      <GroundLine y={128} />
      <Head />
      <Torso x1={88} y1={35} x2={112} y2={35} x3={110} y3={70} x4={90} y4={70} />
      <Arm x1={88} y1={46} ex={68} ey={60} />
      <Arm x1={112} y1={46} ex={132} ey={38} />
      <Circle cx={132} cy={38} r={4} fill={p} />
      <Path d="M 90 70 L 80 94 L 84 112" stroke={bodyStroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Ellipse cx={84} cy={114} rx={5} ry={3} fill={bodyStroke as string} opacity={0.5} />
      <Path d="M 110 70 L 120 56 L 112 48" stroke={bodyStroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Circle cx={112} cy={48} r={8} fill={s} opacity={0.85} />
      <SvgText x="112" y="52" fill="#FFF" fontSize="8" fontWeight="bold" textAnchor="middle">↑</SvgText>
      <MuscleHighlight cx={112} cy={56} rx={12} ry={16} color={s} />
      <SvgText x="100" y="142" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Genoux hauteur hanches · vif</SvgText>
    </G>
  );

  const renderTreePose = () => (
    <G>
      <Head />
      <Torso />
      <Arm x1={88} y1={46} ex={74} ey={28} />
      <Arm x1={112} y1={46} ex={126} ey={28} />
      <Circle cx={74} cy={28} r={4} fill={p} />
      <Circle cx={126} cy={28} r={4} fill={p} />
      <Path d="M 88 34 Q 100 26 112 34" stroke={p} strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.6} />
      <Line x1="100" y1="78" x2="100" y2="132" stroke={bodyStroke} strokeWidth="3" strokeLinecap="round" />
      <Ellipse cx={100} cy={134} rx={7} ry={3} fill={p} opacity={0.8} />
      <Path d="M 108 82 L 124 104 L 108 104" stroke={bodyStroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Circle cx={108} cy={104} r={4} fill={w} />
      <GroundLine y={136} />
      <SvgText x="100" y="150" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Équilibre un pied · regard fixe</SvgText>
    </G>
  );

  const renderDownwardDog = () => (
    <G>
      <Circle cx={68} cy={50} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={64} cy={47} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={72} cy={47} r={1.5} fill={p} opacity={0.7} />
      <Line x1="68" y1="62" x2="100" y2="82" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 68 64 L 52 90 L 42 118" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={42} cy={120} rx={6} ry={3} fill={p} opacity={0.8} />
      <Path d="M 100 82 L 128 98" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 128 98 L 120 128 M 128 98 L 140 128" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={120} cy={130} rx={6} ry={3} fill={p} opacity={0.8} />
      <Ellipse cx={140} cy={130} rx={6} ry={3} fill={p} opacity={0.8} />
      <Circle cx={100} cy={82} r={8} fill={s} opacity={0.85} />
      <SvgText x="100" y="76" fill={s} fontSize="7" fontWeight="bold" textAnchor="middle">hanches</SvgText>
      <Polyline points="95,76 100,68 105,76" stroke={s} strokeWidth="2" fill="none" strokeLinecap="round" />
      <MuscleHighlight cx={100} cy={82} rx={8} ry={8} color={s} />
      <GroundLine y={132} x1={35} x2={148} />
      <SvgText x="100" y="148" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Hanches hautes · dos long</SvgText>
    </G>
  );

  const renderBicycleCrunch = () => (
    <G>
      <Circle cx={76} cy={56} r={11} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={72} cy={53} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={80} cy={53} r={1.5} fill={p} opacity={0.7} />
      <Path d="M 68 67 L 112 72 L 110 96 L 70 91 Z" stroke={bodyStroke} strokeWidth={sw} fill={skinFill} strokeLinejoin="round" />
      <Line x1="70" y1="91" x2="56" y2="118" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="110" y1="96" x2="126" y2="76" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={56} cy={120} rx={5} ry={3} fill={p} opacity={0.8} />
      <Circle cx={126} cy={76} r={6} fill={s} opacity={0.85} />
      <Line x1="68" y1="72" x2="50" y2="63" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="112" y1="72" x2="130" y2="83" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M 76 67 Q 106 60 126 76" stroke={p} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <MuscleHighlight cx={102} cy={75} rx={20} ry={8} color={p} />
      <SvgText x="100" y="138" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Coude ↔ genou opposé</SvgText>
    </G>
  );

  const renderCobra = () => (
    <G>
      <GroundLine y={120} x1={38} x2={168} />
      <Circle cx={55} cy={66} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={51} cy={63} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={59} cy={63} r={1.5} fill={p} opacity={0.7} />
      <Path d="M 67 70 L 157 95" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <MuscleHighlight cx={110} cy={82} rx={30} ry={6} color={p} />
      <Path d="M 62 80 L 52 102 M 67 78 L 57 100" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={51} cy={103} rx={5} ry={3} fill={p} opacity={0.8} />
      <Line x1="142" y1="93" x2="150" y2="116" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="152" y1="94" x2="160" y2="117" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={155} cy={118} rx={6} ry={3} fill={p} opacity={0.8} />
      <Path d="M 55 66 Q 47 56 55 50" stroke={s} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Polyline points="52,50 55,44 58,50" stroke={s} strokeWidth="2" fill="none" strokeLinecap="round" />
      <SvgText x="100" y="136" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Poitrine ouverte · dos léger</SvgText>
    </G>
  );

  const renderWallSit = () => (
    <G>
      <Rect x="132" y="16" width="8" height="132" fill={t} opacity={0.1} />
      <Line x1="132" y1="16" x2="132" y2="148" stroke={t} strokeWidth="2.5" />
      <Circle cx={105} cy={36} r={12} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={101} cy={33} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={109} cy={33} r={1.5} fill={p} opacity={0.7} />
      <Line x1="105" y1="48" x2="120" y2="48" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="120" y1="48" x2="128" y2="88" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="105" y1="52" x2="84" y2="60" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="120" y1="52" x2="141" y2="60" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <MuscleHighlight cx={118} cy={68} rx={10} ry={18} color={s} />
      <Line x1="128" y1="88" x2="98" y2="90" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="98" y1="90" x2="94" y2="120" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="128" y1="88" x2="120" y2="90" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="120" y1="90" x2="116" y2="120" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={94} cy={121} rx={6} ry={3} fill={p} opacity={0.8} />
      <Ellipse cx={116} cy={121} rx={6} ry={3} fill={p} opacity={0.8} />
      <AngleArc cx={98} cy={90} r={18} start={-50} end={30} label="90°" />
      <SvgText x="90" y="140" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Dos au mur · 90° de genou</SvgText>
    </G>
  );

  const renderSuperman = () => (
    <G>
      <GroundLine y={92} x1={35} x2={168} />
      <Circle cx={45} cy={70} r={10} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={42} cy={67} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={48} cy={67} r={1.5} fill={p} opacity={0.7} />
      <Line x1="55" y1="74" x2="148" y2="80" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <MuscleHighlight cx={100} cy={77} rx={32} ry={6} color={s} />
      <Path d="M 50 68 L 30 58" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={30} cy={58} r={5} fill={s} />
      <Path d="M 148 80 L 170 66" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={170} cy={66} r={5} fill={s} />
      <Polyline points="28,53 30,46 32,53" stroke={s} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Polyline points="168,61 170,54 172,61" stroke={s} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <SvgText x="100" y="112" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Bras + jambes levés simultanément</SvgText>
    </G>
  );

  const renderHollowHold = () => (
    <G>
      <Line x1="38" y1="104" x2="162" y2="104" stroke={p} strokeWidth="2" strokeDasharray="4,3" opacity={0.4} />
      <Circle cx={60} cy={76} r={11} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={56} cy={73} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={64} cy={73} r={1.5} fill={p} opacity={0.7} />
      <Path d="M 71 78 L 142 82" stroke={bodyStroke} strokeWidth="3.5" strokeLinecap="round" />
      <MuscleHighlight cx={107} cy={80} rx={28} ry={6} color={p} />
      <Line x1="65" y1="72" x2="40" y2="64" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={40} cy={64} r={5} fill={s} />
      <Line x1="142" y1="82" x2="168" y2="70" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={168} cy={70} r={5} fill={s} />
      <Path d="M 84 82 Q 100 90 116 82" stroke={p} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <SvgText x="100" y="94" fill={p} fontSize="8" fontWeight="bold" textAnchor="middle">tension lombaire</SvgText>
      <SvgText x="100" y="120" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Corps creux · lombaires au sol</SvgText>
    </G>
  );

  const renderRope = () => (
    <G>
      <GroundLine />
      <Head />
      <Torso />
      <Arm x1={88} y1={46} ex={78} ey={32} hand />
      <Arm x1={112} y1={46} ex={122} ey={32} hand />
      <Leg x1={92} y1={78} kx={90} ky={106} fx={88} fy={122} foot />
      <Leg x1={108} y1={78} kx={110} ky={106} fx={112} fy={122} foot />
      <Path d="M 78 35 Q 72 52 68 68 Q 64 84 68 98 Q 72 112 88 122" stroke={w} strokeWidth="2.2" fill="none" strokeDasharray="4,3" />
      <Path d="M 122 35 Q 128 52 132 68 Q 136 84 132 98 Q 128 112 112 122" stroke={w} strokeWidth="2.2" fill="none" strokeDasharray="4,3" />
      <Line x1="85" y1="126" x2="115" y2="126" stroke={p} strokeWidth="2" />
      <SvgText x="100" y="142" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Sauts légers · poignets actifs</SvgText>
    </G>
  );

  const renderStepUp = () => (
    <G>
      <Rect x="58" y="94" width="84" height="28" rx="4" stroke={t} strokeWidth="2.5" fill={p} fillOpacity={0.12} />
      <Head cx={100} cy={38} />
      <Torso x1={90} y1={51} x2={110} y2={51} x3={108} y3={78} x4={92} y4={78} />
      <Arm x1={90} y1={60} ex={72} ey={68} />
      <Arm x1={110} y1={60} ex={128} ey={68} />
      <Leg x1={92} y1={78} kx={85} ky={92} fx={80} fy={94} />
      <Ellipse cx={80} cy={95} rx={5} ry={3} fill={s} opacity={0.9} />
      <Polyline points="75,88 80,82 85,88" stroke={s} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Leg x1={108} y1={78} kx={118} ky={104} fx={118} fy={122} foot />
      <GroundLine y={125} />
      <SvgText x="100" y="144" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Talon entier sur la marche</SvgText>
    </G>
  );

  const renderRow = () => (
    <G>
      <Head />
      <Torso x1={88} y1={35} x2={112} y2={35} x3={110} y3={76} x4={90} y4={76} />
      <Path d="M 88 50 L 62 62 M 112 50 L 138 62" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={62} cy={63} r={5} fill={p} />
      <Circle cx={138} cy={63} r={5} fill={p} />
      <Path d="M 65 63 L 72 52" stroke={p} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M 135 63 L 128 52" stroke={p} strokeWidth="2.5" strokeLinecap="round" />
      <Polyline points="68,47 72,42 76,47" stroke={p} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Polyline points="124,47 128,42 132,47" stroke={p} strokeWidth="2" fill="none" strokeLinecap="round" />
      <MuscleHighlight cx={100} cy={50} rx={14} ry={12} color={s} />
      <Leg x1={92} y1={76} kx={88} ky={102} fx={85} fy={124} foot />
      <Leg x1={108} y1={76} kx={112} ky={102} fx={115} fy={124} foot />
      <GroundLine />
      <SvgText x="100" y="142" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Coudes tirés en arrière</SvgText>
    </G>
  );

  const renderDonkeyKick = () => (
    <G>
      <GroundLine y={115} x1={40} x2={165} />
      <Circle cx={100} cy={58} r={11} stroke={bodyStroke} strokeWidth={sw} fill={skinFill} />
      <Circle cx={96} cy={55} r={1.5} fill={p} opacity={0.7} />
      <Circle cx={104} cy={55} r={1.5} fill={p} opacity={0.7} />
      <Line x1="100" y1="69" x2="100" y2="100" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Arm x1={100} y1={82} ex={68} ey={80} />
      <Ellipse cx={68} cy={81} rx={5} ry={3} fill={p} opacity={0.85} />
      <Arm x1={100} y1={82} ex={132} ey={80} />
      <Ellipse cx={132} cy={81} rx={5} ry={3} fill={p} opacity={0.85} />
      <Line x1="100" y1="100" x2="122" y2="100" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="122" y1="100" x2="134" y2="85" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={134} cy={85} r={5} fill={s} />
      <Polyline points="128,78 134,70 140,78" stroke={s} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <MuscleHighlight cx={125} cy={90} rx={14} ry={10} color={s} />
      <Line x1="100" y1="100" x2="82" y2="115" stroke={bodyStroke} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={82} cy={116} rx={5} ry={3} fill={bodyStroke as string} opacity={0.5} />
      <SvgText x="100" y="130" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Talon vers plafond · fessier contracté</SvgText>
    </G>
  );

  const renderDefault = () => (
    <G>
      <Head />
      <Torso />
      <Arm x1={88} y1={48} ex={66} ey={70} hand />
      <Arm x1={112} y1={48} ex={134} ey={70} hand />
      <Leg x1={92} y1={78} kx={84} ky={104} fx={80} fy={128} foot />
      <Leg x1={108} y1={78} kx={116} ky={104} fx={120} fy={128} foot />
      <GroundLine />
      <Circle cx={100} cy={78} r={38} stroke={p} strokeWidth="1.5" fill="none" strokeDasharray="5,4" opacity={0.35} />
      <SvgText x="100" y="150" fill={t} fontSize="10" fontWeight="bold" textAnchor="middle">Mouvement en cours</SvgText>
    </G>
  );

  const getDiagram = () => {
    const type = exerciseType.toLowerCase();
    if (type.includes('donkey') || type.includes('fire hydrant')) return renderDonkeyKick();
    if (type.includes('push') || type.includes('pomp') || type.includes('diamond') || type.includes('pike push') || type.includes('hindu') || type.includes('archer') || type.includes('spiderman') || type.includes('wide push') || type.includes('plyo')) return renderPushup();
    if (type.includes('wall sit') || type.includes('mur')) return renderWallSit();
    if (type.includes('squat') && !type.includes('pistol')) return renderSquat();
    if (type.includes('pistol') || type.includes('shrimp') || type.includes('cossack')) return renderSquat();
    if ((type.includes('plank') && type.includes('side')) || type.includes('side plank')) return renderSidePlank();
    if ((type.includes('plank') || type.includes('planche')) && !type.includes('down') && !type.includes('hip dip')) return renderPlank();
    if (type.includes('hip dip')) return renderSidePlank();
    if (type.includes('lunge') || type.includes('fente') || type.includes('split') || type.includes('curtsy') || type.includes('rideau')) return renderLunge();
    if (type.includes('run') || type.includes('sprint') || type.includes('course') || type.includes('jog') || type.includes('shadow') || type.includes('broad jump') || type.includes('ice skater')) return renderRunning();
    if (type.includes('bridge') || type.includes('pont') || type.includes('hip thrust') || type.includes('hanche') || type.includes('shoulder bridge') || type.includes('glute-ham')) return renderBridge();
    if (type.includes('mountain') || type.includes('escalade')) return renderMountainClimber();
    if (type.includes('burpee') || type.includes('tempo burpee')) return renderBurpee();
    if (type.includes('bird') || type.includes('oiseau')) return renderBirdDog();
    if (type.includes('dead bug') || type.includes('scarabee')) return renderDeadBug();
    if (type.includes('jumping') || type.includes('sauts') || type.includes('jack') || type.includes('power jack')) return renderJumpingJacks();
    if (type.includes('calf') || type.includes('mollet')) return renderCalfRaise();
    if (type.includes('high knee') || type.includes('genoux hauts') || type.includes('marching') || type.includes('tuck jump')) return renderHighKnees();
    if (type.includes('tree') || type.includes('arbre') || type.includes('warrior') || type.includes('guerrier') || type.includes('l-sit')) return renderTreePose();
    if (type.includes('downward') || type.includes('chien') || type.includes('down dog') || type.includes('puppy')) return renderDownwardDog();
    if (type.includes('bicycle') || type.includes('velo') || type.includes('crunch') || type.includes('russian') || type.includes('russe') || type.includes('hollow body rock') || type.includes('sit-through') || type.includes('v-sit')) return renderBicycleCrunch();
    if (type.includes('cobra') || type.includes('child') || type.includes('enfant') || type.includes('cat') || type.includes('cow') || type.includes('chat')) return renderCobra();
    if (type.includes('superman') || type.includes('back ext') || type.includes('dragon') || type.includes('swimmer')) return renderSuperman();
    if (type.includes('hollow') || type.includes('reverse crunch')) return renderHollowHold();
    if (type.includes('rope') || type.includes('corde')) return renderRope();
    if (type.includes('step') || type.includes('box') || type.includes('marche') || type.includes('bear crawl')) return renderStepUp();
    if (type.includes('row') || type.includes('tirage') || type.includes('towel') || type.includes('lateral raise') || type.includes('y-t-w') || type.includes('prone')) return renderRow();
    if (type.includes('walk') || type.includes('brisk') || type.includes('inchworm')) return renderRunning();
    if (type.includes('stretch') || type.includes('étirement') || type.includes('pigeon') || type.includes('hamstring') || type.includes('quad') || type.includes('chest opener') || type.includes('thread') || type.includes('floor angel') || type.includes('arm circle') || type.includes('hip circle') || type.includes('ankle') || type.includes('neck') || type.includes('wrist') || type.includes('pelvic') || type.includes('figure-4') || type.includes('wall calf') || type.includes('supine leg') || type.includes('seated')) return renderCobra();
    if (type.includes('sun salut') || type.includes('salutation') || type.includes('vinyasa') || type.includes('flow') || type.includes('yoga') || type.includes('happy baby') || type.includes('straddle') || type.includes('warrior iii') || type.includes('boat') || type.includes('boat pose') || type.includes('navasana')) return renderDownwardDog();
    if (type.includes('dip') || type.includes('pike') || type.includes('handstand') || type.includes('planche lean') || type.includes('tuck planche') || type.includes('pseudo')) return renderPushup();
    if (type.includes('turkish') || type.includes('turc') || type.includes('curl') || type.includes('nordic') || type.includes('jefferson')) return renderLunge();
    if (type.includes('crab') || type.includes('reverse table') || type.includes('sit-through')) return renderStepUp();
    if (type.includes('donkey') || type.includes('fire') || type.includes('clam') || type.includes('glute bridge') || type.includes('hip extension') || type.includes('standing hip')) return renderDonkeyKick();
    return renderDefault();
  };

  return (
    <View style={[styles.container, { width: size, height: size * 1.2 }]}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 200 165">
        {getDiagram()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
