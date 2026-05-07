import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const COLORS = ['#fbbf24', '#f472b6', '#38bdf8', '#fb923c', '#a78bfa', '#ffffff'];

interface ParticleProps {
  angle: number;
  distance: number;
  delay: number;
  color: string;
  size: number;
}

function Particle({ angle, distance, delay, color, size }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    translateX.value = withDelay(delay, withTiming(dx, { duration: 750, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(dy, { duration: 750, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(1, { duration: 420 }),
        withTiming(0, { duration: 270, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          left: -size / 2,
          top: -size / 2,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function generateParticles(accentColor: string): ParticleProps[] {
  const colors = [accentColor, ...COLORS];
  const particles: ParticleProps[] = [];

  const bursts = [
    { count: 12, delay: 0, minDist: 55, maxDist: 95 },
    { count: 9, delay: 220, minDist: 35, maxDist: 75 },
    { count: 11, delay: 460, minDist: 45, maxDist: 85 },
  ];

  bursts.forEach(({ count, delay, minDist, maxDist }) => {
    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2;
      // Slight jitter per burst so they don't all stack on top of each other across bursts
      const jitter = delay * 0.0015;
      particles.push({
        angle: baseAngle + jitter,
        distance: minDist + ((i * 37 + delay) % (maxDist - minDist)),
        delay,
        color: colors[(i + delay) % colors.length],
        size: 4 + (i % 3),
      });
    }
  });

  return particles;
}

interface FireworkAnimationProps {
  accentColor: string;
}

export function FireworkAnimation({ accentColor }: FireworkAnimationProps) {
  const particles = useMemo(() => generateParticles(accentColor), [accentColor]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.origin}>
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  origin: {
    width: 0,
    height: 0,
  },
});
