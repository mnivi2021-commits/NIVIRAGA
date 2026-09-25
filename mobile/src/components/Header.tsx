import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, SHOP } from '../theme';

const COLORS = ['#ffd400', '#fff3a0', '#ff9d00', '#ffffff', '#ffe066'];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

function useLoop(duration: number, enabled: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return;
    const a = Animated.loop(
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    a.start();
    return () => a.stop();
  }, [enabled, duration, v]);
  return v;
}

/** One firework burst that re-fires at a random spot in the header. */
function Burst({ width, height, delay }: { width: number; height: number; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const [spot, setSpot] = useState({ x: width / 2, y: height / 3, c: COLORS[0] });
  const dots = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ a: (i / 18) * Math.PI * 2, s: 34 + Math.random() * 30 })),
    [],
  );

  useEffect(() => {
    let alive = true;
    const fire = () => {
      if (!alive) return;
      setSpot({
        x: width * (0.08 + Math.random() * 0.84),
        y: height * (0.15 + Math.random() * 0.45),
        c: COLORS[(Math.random() * COLORS.length) | 0],
      });
      t.setValue(0);
      Animated.timing(t, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
        () => alive && setTimeout(fire, 300),
      );
    };
    const id = setTimeout(fire, delay);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [width, height, delay, t]);

  const opacity = t.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] });
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              left: spot.x,
              top: spot.y,
              backgroundColor: spot.c,
              opacity,
              transform: [
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(d.a) * d.s] }) },
                { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(d.a) * d.s + 14] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function Header() {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const spin = useLoop(8000, !reduced);
  const pop = useLoop(1600, !reduced);
  const bob = useLoop(2000, !reduced);
  const glow = useLoop(1800, !reduced);
  const [h, setH] = useState(0);

  const wave = (v: Animated.Value, a: number, b: number) =>
    v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [a, b, a] });

  return (
    <ImageBackground
      source={require('../../assets/img/diwali-bg.jpg')}
      style={styles.header}
      imageStyle={{ resizeMode: 'cover' }}
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
    >
      <LinearGradient
        colors={['rgba(20,6,40,0.6)', 'rgba(20,6,40,0.25)', 'rgba(20,6,40,0.5)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {!reduced && h > 0 && [0, 450, 900].map((d) => <Burst key={d} width={width} height={h} delay={d} />)}

      {(['left', 'right'] as const).map((side) => (
        <Animated.Image
          key={side}
          source={require('../../assets/img/diya.png')}
          style={[
            styles.diya,
            side === 'left' ? { left: 8 } : { right: 8, transform: [{ scaleX: -1 }] },
            { opacity: wave(glow, 0.85, 1) },
          ]}
          resizeMode="contain"
        />
      ))}

      <Text style={styles.h1}>{SHOP.name}</Text>
      <Text style={styles.shopline}>{SHOP.line}</Text>
      <Text style={styles.sub}>{SHOP.place} · Price List 2026 · Order Estimate</Text>

      <View style={styles.imgs}>
        <Animated.View
          style={[
            styles.off,
            {
              transform: [
                { scale: wave(pop, 1, 1.1) },
                { rotate: pop.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-6deg', '6deg', '-6deg'] }) },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.offRing,
              { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
            ]}
          />
          <View style={styles.offTxt}>
            <Text style={styles.offBig}>75%</Text>
            <Text style={styles.offSmall}>DISCOUNT</Text>
          </View>
        </Animated.View>
        <Animated.Image
          source={require('../../assets/img/crackers.png')}
          style={[
            styles.ck,
            {
              transform: [
                { translateY: wave(bob, 0, -8) },
                { rotate: bob.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-6deg', '6deg', '-6deg'] }) },
              ],
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require('../../assets/img/fireworks.png')}
          style={[styles.fw, { transform: [{ scale: wave(pop, 0.88, 1.06) }] }]}
          resizeMode="contain"
        />
      </View>

      <Pressable
        onPress={() => Linking.openURL(`tel:+91${SHOP.mobile}`)}
        style={styles.call}
        accessibilityRole="button"
        accessibilityLabel={`Call ${SHOP.mobile}`}
      >
        <Text style={styles.callLabel}>MOBILE</Text>
        <Text style={styles.callNum}>{SHOP.mobile}</Text>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 58,
    paddingBottom: 20,
    paddingHorizontal: 14,
    borderBottomWidth: 5,
    borderBottomColor: C.gold,
    backgroundColor: C.brand,
    overflow: 'hidden',
  },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  diya: { position: 'absolute', top: 6, width: 52, height: 44 },
  h1: {
    fontFamily: F.serifBold,
    fontSize: 38,
    lineHeight: 42,
    color: C.gold,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  shopline: { fontFamily: F.sansBold, fontSize: 15, letterSpacing: 4, color: C.white, marginTop: 4 },
  sub: { fontFamily: F.sans, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  imgs: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  off: { width: 100, height: 100 },
  offRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 50,
    backgroundColor: C.gold,
    borderWidth: 4,
    borderStyle: 'dashed',
    borderColor: C.brand,
    shadowColor: C.gold,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },
  offTxt: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', elevation: 9 },
  offBig: { fontFamily: F.serifBold, fontSize: 32, lineHeight: 34, color: C.brand },
  offSmall: { fontFamily: F.sansBold, fontSize: 10, letterSpacing: 1.2, color: C.brand },
  ck: {
    width: 96,
    height: 96,
    backgroundColor: C.white,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: C.gold,
  },
  fw: { width: 110, height: 110 },
  call: { marginTop: 12, alignSelf: 'flex-start' },
  callLabel: { fontFamily: F.sans, fontSize: 13, color: C.white },
  callNum: { fontFamily: F.sansBold, fontSize: 18, color: C.gold },
});
