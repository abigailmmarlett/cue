import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useEffect } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STROKE = 11;
const GAP = 7;

// Radii: sized so the inner content area is ~200px wide (fits 70px timer text)
const R_INNER = 110;
const R_MID = R_INNER + STROKE + GAP;
const R_OUTER = R_MID + STROKE + GAP;

const SIZE = (R_OUTER + STROKE / 2 + 4) * 2;
const CENTER = SIZE / 2;

function circumference(r: number) {
  return 2 * Math.PI * r;
}

const C_INNER = circumference(R_INNER);
const C_MID = circumference(R_MID);
const C_OUTER = circumference(R_OUTER);

interface Props {
  exerciseProgress: number;
  sectionProgress: number;
  totalProgress: number;
  exerciseMarks?: number[];
  markColor?: string;
  children?: React.ReactNode;
}

export function TripleRing({ exerciseProgress, sectionProgress, totalProgress, exerciseMarks, markColor, children }: Props) {
  const { colors } = useTheme();
  const innerVal = useSharedValue(exerciseProgress);
  const midVal = useSharedValue(sectionProgress);
  const outerVal = useSharedValue(totalProgress);

  useEffect(() => {
    innerVal.value = withTiming(exerciseProgress, { duration: 220, easing: Easing.linear });
  }, [exerciseProgress]);

  useEffect(() => {
    midVal.value = withTiming(sectionProgress, { duration: 220, easing: Easing.linear });
  }, [sectionProgress]);

  useEffect(() => {
    outerVal.value = withTiming(totalProgress, { duration: 220, easing: Easing.linear });
  }, [totalProgress]);

  const innerProps = useAnimatedProps(() => ({
    strokeDashoffset: C_INNER * (1 - innerVal.value),
  }));

  const midProps = useAnimatedProps(() => ({
    strokeDashoffset: C_MID * (1 - midVal.value),
  }));

  const outerProps = useAnimatedProps(() => ({
    strokeDashoffset: C_OUTER * (1 - outerVal.value),
  }));

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        {/* Track rings */}
        <Circle
          cx={CENTER} cy={CENTER} r={R_INNER}
          stroke={colors.border} strokeWidth={STROKE} fill="none"
        />
        <Circle
          cx={CENTER} cy={CENTER} r={R_MID}
          stroke={colors.border} strokeWidth={STROKE} fill="none"
        />
        <Circle
          cx={CENTER} cy={CENTER} r={R_OUTER}
          stroke={colors.border} strokeWidth={STROKE} fill="none"
        />

        {/* Progress rings — rotate -90° so they start at the top */}
        <AnimatedCircle
          cx={CENTER} cy={CENTER} r={R_INNER}
          stroke={colors.accent} strokeWidth={STROKE} fill="none"
          strokeDasharray={C_INNER}
          strokeLinecap="round"
          rotation="-90"
          origin={`${CENTER}, ${CENTER}`}
          animatedProps={innerProps}
        />
        <AnimatedCircle
          cx={CENTER} cy={CENTER} r={R_MID}
          stroke={colors.accentDeep} strokeWidth={STROKE} fill="none"
          strokeDasharray={C_MID}
          strokeLinecap="round"
          rotation="-90"
          origin={`${CENTER}, ${CENTER}`}
          animatedProps={midProps}
        />
        <AnimatedCircle
          cx={CENTER} cy={CENTER} r={R_OUTER}
          stroke={colors.accentDim} strokeWidth={STROKE} fill="none"
          strokeDasharray={C_OUTER}
          strokeLinecap="round"
          rotation="-90"
          origin={`${CENTER}, ${CENTER}`}
          animatedProps={outerProps}
        />

        {exerciseMarks?.map((fraction, i) => {
          const theta = (1 - fraction) * 2 * Math.PI; // clockwise from 12 o'clock
          const x = CENTER + R_INNER * Math.sin(theta);
          const y = CENTER - R_INNER * Math.cos(theta);
          return <Circle key={i} cx={x} cy={y} r={4.5} fill={markColor ?? '#ffffff'} opacity={0.9} />;
        })}
      </Svg>

      {/* Centered content — constrained to the inner ring's usable area */}
      <View style={[styles.center, { width: (R_INNER - STROKE / 2 - 6) * 2 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
