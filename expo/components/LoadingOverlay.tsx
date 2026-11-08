import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_WIDTH = Math.min(SCREEN_W * 0.4, 220);
const LOGO_SIZE = Math.min(SCREEN_W * 0.62, 300);
const REVEAL_MS = 700;
const LOAD_MS = 2200;
const EXIT_MS = 350;

interface Props {
  onFinished: () => void;
}

export default function LoadingOverlay({ onFinished }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const [done, setDone] = useState<boolean>(false);

  useEffect(() => {
    const reveal = Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: REVEAL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1, duration: REVEAL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    const load = Animated.timing(progress, { toValue: 1, duration: LOAD_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: false });

    reveal.start();
    load.start(({ finished }) => {
      if (!finished) return;
      Animated.timing(exitOpacity, { toValue: 0, duration: EXIT_MS, useNativeDriver: true }).start(() => setDone(true));
    });

    return () => {
      reveal.stop();
      load.stop();
    };
  }, [logoOpacity, logoScale, progress, exitOpacity]);

  useEffect(() => {
    if (done) onFinished();
  }, [done, onFinished]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_WIDTH] });

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]} testID="loading.screen">
      <View style={styles.center}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
          <Text style={styles.wordmark}>LUZZY AI</Text>
        </Animated.View>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { width: barWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 36 },
  wordmark: { marginTop: 8, color: '#F4F4F4', fontSize: 16, fontWeight: '600', letterSpacing: 6 },
  track: { width: BAR_WIDTH, height: 2, borderRadius: 1, backgroundColor: '#2A2A2A', overflow: 'hidden' },
  bar: { height: 2, backgroundColor: '#D9D9D9' },
});
