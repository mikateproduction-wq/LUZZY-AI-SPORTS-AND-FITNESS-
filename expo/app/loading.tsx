import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polygon, G } from 'react-native-svg';
import { Activity, Cpu, Zap } from 'lucide-react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const RING_SIZE = 204;
const STROKE_W = 3;
const RADIUS = (RING_SIZE - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CYAN = '#00EEFF';
const PINK = '#FF2060';

const GRID_ROWS = 9;
const GRID_COLS = 7;

export default function LoadingScreen() {
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanY = useRef(new Animated.Value(-60)).current;
  const ringRot = useRef(new Animated.Value(0)).current;
  const outerRot = useRef(new Animated.Value(0)).current;
  const hexPulse = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(22)).current;
  const cornerPulse = useRef(new Animated.Value(0)).current;

  const [pct, setPct] = useState(0);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);
  const [glitchX, setGlitchX] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setPct(Math.round(value * 100));
      setDashOffset(CIRCUMFERENCE * (1 - value));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.28) {
        setGlitchX((Math.random() - 0.5) * 8);
        setTimeout(() => setGlitchX(0), 70);
      }
    }, 900);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 900,
        delay: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 800,
        delay: 600,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: SCREEN_H + 60,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanY, { toValue: -60, duration: 0, useNativeDriver: true }),
      ])
    );

    const ringLoop = Animated.loop(
      Animated.timing(ringRot, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const outerLoop = Animated.loop(
      Animated.timing(outerRot, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const hexLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hexPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hexPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const cornerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cornerPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const progressAnim = Animated.timing(progress, {
      toValue: 1,
      duration: 5600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    scanLoop.start();
    ringLoop.start();
    outerLoop.start();
    hexLoop.start();
    cornerLoop.start();
    progressAnim.start(({ finished }) => {
      if (!finished) return;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(tabs)');
      });
    });

    return () => {
      scanLoop.stop();
      ringLoop.stop();
      outerLoop.stop();
      hexLoop.stop();
      cornerLoop.stop();
      progress.stopAnimation();
    };
  }, [fadeAnim, scanY, ringRot, outerRot, hexPulse, titleFade, titleY, cornerPulse, progress]);

  const ringRotDeg = ringRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const outerRotDeg = outerRot.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const hexOpacity = hexPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const hexScale = hexPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const cornerOpacity = cornerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  const TICKS = 48;

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]} testID="loading.screen">
      <LinearGradient
        colors={['#020508', '#050D1C', '#020408']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Cyber grid */}
      <View style={styles.gridLayer} pointerEvents="none">
        {Array.from({ length: GRID_ROWS }).map((_, i) => (
          <View
            key={`h${i}`}
            style={[styles.gridH, { top: (SCREEN_H * (i + 1)) / (GRID_ROWS + 1) }]}
          />
        ))}
        {Array.from({ length: GRID_COLS }).map((_, i) => (
          <View
            key={`v${i}`}
            style={[styles.gridV, { left: (SCREEN_W * (i + 1)) / (GRID_COLS + 1) }]}
          />
        ))}
      </View>

      {/* Scan line */}
      <Animated.View
        style={[styles.scanLine, { transform: [{ translateY: scanY }] }]}
        pointerEvents="none"
      />

      {/* Corner brackets */}
      <Animated.View style={[styles.cornerTL, { opacity: cornerOpacity }]} pointerEvents="none">
        <View style={[styles.cH, { backgroundColor: CYAN }]} />
        <View style={[styles.cV, { backgroundColor: CYAN }]} />
      </Animated.View>
      <Animated.View style={[styles.cornerTR, { opacity: cornerOpacity }]} pointerEvents="none">
        <View style={[styles.cH, { backgroundColor: CYAN, alignSelf: 'flex-end' }]} />
        <View style={[styles.cV, { backgroundColor: CYAN, alignSelf: 'flex-end' }]} />
      </Animated.View>
      <Animated.View style={[styles.cornerBL, { opacity: cornerOpacity }]} pointerEvents="none">
        <View style={[styles.cV, { backgroundColor: PINK }]} />
        <View style={[styles.cH, { backgroundColor: PINK }]} />
      </Animated.View>
      <Animated.View style={[styles.cornerBR, { opacity: cornerOpacity }]} pointerEvents="none">
        <View style={[styles.cV, { backgroundColor: PINK, alignSelf: 'flex-end' }]} />
        <View style={[styles.cH, { backgroundColor: PINK, alignSelf: 'flex-end' }]} />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>

          {/* HUD status row */}
          <View style={styles.hudRow}>
            <View style={[styles.hudPip, { backgroundColor: CYAN }]} />
            <Text style={styles.hudText}>SYS.INIT — v2.0.1</Text>
            <View style={[styles.hudPip, { backgroundColor: PINK }]} />
          </View>

          {/* Ring system */}
          <View style={styles.ringSystem}>
            {/* Outer slow counter-rotation ring */}
            <Animated.View
              style={[styles.outerTickRing, { transform: [{ rotate: outerRotDeg }] }]}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const R = 118;
                const tx = R * Math.cos(angle - Math.PI / 2);
                const ty = R * Math.sin(angle - Math.PI / 2);
                return (
                  <View
                    key={i}
                    style={[
                      styles.outerTick,
                      {
                        backgroundColor: i % 6 === 0 ? CYAN : 'rgba(0,238,255,0.25)',
                        width: i % 6 === 0 ? 8 : 4,
                        height: i % 6 === 0 ? 2 : 1,
                        transform: [
                          { translateX: tx },
                          { translateY: ty },
                          { rotate: `${i * 15}deg` },
                        ],
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>

            {/* Inner ring (progress) */}
            <Animated.View
              style={[styles.innerRingWrap, { transform: [{ rotate: ringRotDeg }] }]}
            >
              <Svg width={RING_SIZE} height={RING_SIZE}>
                {/* Background track */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke="rgba(0,238,255,0.10)"
                  strokeWidth={STROKE_W}
                  fill="transparent"
                />
                {/* Tick marks */}
                {Array.from({ length: TICKS }).map((_, i) => {
                  const angle = (i * (360 / TICKS) * Math.PI) / 180;
                  const innerR = RADIUS - 7;
                  const x1 = RING_SIZE / 2 + innerR * Math.cos(angle);
                  const y1 = RING_SIZE / 2 + innerR * Math.sin(angle);
                  const x2 = RING_SIZE / 2 + RADIUS * Math.cos(angle);
                  const y2 = RING_SIZE / 2 + RADIUS * Math.sin(angle);
                  return (
                    <Line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={i % 4 === 0 ? CYAN : 'rgba(0,238,255,0.18)'}
                      strokeWidth={i % 4 === 0 ? 1.5 : 0.8}
                    />
                  );
                })}
                {/* Progress arc */}
                <G transform={`translate(${RING_SIZE / 2}, ${RING_SIZE / 2}) rotate(-90) translate(${-RING_SIZE / 2}, ${-RING_SIZE / 2})`}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke={CYAN}
                    strokeWidth={STROKE_W + 1}
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={dashOffset}
                  />
                </G>
              </Svg>
            </Animated.View>

            {/* Center hex + icon */}
            <Animated.View
              style={[
                styles.centerAbs,
                { opacity: hexOpacity, transform: [{ scale: hexScale }] },
              ]}
            >
              <View style={styles.hexWrap}>
                <Svg width={72} height={72} viewBox="0 0 72 72">
                  <Polygon
                    points="36,4 64,20 64,52 36,68 8,52 8,20"
                    fill="rgba(0,238,255,0.07)"
                    stroke={CYAN}
                    strokeWidth="1.5"
                  />
                  <Polygon
                    points="36,12 56,24 56,48 36,60 16,48 16,24"
                    fill="none"
                    stroke="rgba(0,238,255,0.20)"
                    strokeWidth="0.8"
                  />
                </Svg>
                <View style={styles.hexIconCenter}>
                  <Cpu color={CYAN} size={20} />
                </View>
              </View>
              <Text style={styles.pctText}>{pct}%</Text>
            </Animated.View>
          </View>

          {/* App name */}
          <Animated.View
            style={[
              styles.nameBlock,
              {
                opacity: titleFade,
                transform: [{ translateY: titleY }, { translateX: glitchX }],
              },
            ]}
          >
            <Text style={styles.nameTop}>LUZZY AI</Text>
            <View style={styles.nameDivRow}>
              <View style={styles.nameDivLine} />
              <View style={[styles.nameDivDot, { backgroundColor: CYAN }]} />
              <View style={styles.nameDivLine} />
            </View>
            <Text style={styles.nameBottom}>SPORTS & FITNESS</Text>
          </Animated.View>

          {/* Status */}
          <View style={styles.statusRow}>
            <Activity color={CYAN} size={11} />
            <Text style={styles.statusText} testID="loading.subtitle">
              NEURAL SYNC IN PROGRESS
            </Text>
            <Zap color={PINK} size={11} />
          </View>

          {/* Segmented bar */}
          <View style={styles.segWrap}>
            <View style={styles.segBarOuter}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.seg,
                    {
                      backgroundColor:
                        i / 20 < pct / 100
                          ? i % 5 === 4
                            ? CYAN
                            : 'rgba(0,238,255,0.55)'
                          : 'rgba(255,255,255,0.05)',
                      shadowColor: i / 20 < pct / 100 ? CYAN : 'transparent',
                      shadowOpacity: i / 20 < pct / 100 ? 0.8 : 0,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Module chips */}
          <View style={styles.chipsRow}>
            {(['COACH.AI', 'MOTION', 'POSTURE', 'SYNC'] as const).map((mod, idx) => {
              const active = pct > idx * 25;
              return (
                <View
                  key={mod}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? CYAN + '70' : 'rgba(255,255,255,0.07)',
                      backgroundColor: active ? 'rgba(0,238,255,0.06)' : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? CYAN : 'rgba(255,255,255,0.18)' }]}>
                    {mod}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.platformNote} testID="loading.platform">
            {Platform.OS === 'web' ? '[ WEB.PREVIEW ]' : '[ MOBILE.EXP ]'}
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020508',
  },
  safe: {
    flex: 1,
  },
  gridLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,238,255,0.05)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,238,255,0.04)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,238,255,0.18)',
    shadowColor: '#00EEFF',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  cornerTL: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 28,
    height: 28,
  },
  cornerTR: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 28,
    height: 28,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    width: 28,
    height: 28,
    justifyContent: 'flex-end',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 28,
    height: 28,
    justifyContent: 'flex-end',
  },
  cH: {
    height: 2,
    width: 28,
    borderRadius: 1,
  },
  cV: {
    width: 2,
    height: 28,
    borderRadius: 1,
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  hudPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hudText: {
    color: 'rgba(0,238,255,0.6)',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  ringSystem: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerTickRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerTick: {
    position: 'absolute',
    borderRadius: 1,
  },
  innerRingWrap: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexIconCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
    marginTop: 6,
    textShadowColor: '#00EEFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  nameBlock: {
    marginTop: 30,
    alignItems: 'center',
  },
  nameTop: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900' as const,
    letterSpacing: 6,
    textShadowColor: '#00EEFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  nameDivRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  nameDivLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,238,255,0.3)',
    maxWidth: 60,
  },
  nameDivDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  nameBottom: {
    color: 'rgba(0,238,255,0.85)',
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  statusText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 2,
  },
  segWrap: {
    marginTop: 18,
    width: '100%',
    maxWidth: 300,
  },
  segBarOuter: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  platformNote: {
    marginTop: 16,
    fontSize: 10,
    fontWeight: '600' as const,
    color: 'rgba(0,238,255,0.25)',
    letterSpacing: 2,
  },
});
