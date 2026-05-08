import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTour } from '@/lib/contexts/TourContext';
import { Radius, Spacing } from '@/constants/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const PAD = 10;

export function TourOverlay() {
  const { isActive, currentStepIndex, totalSteps, currentStep, highlightLayout, nextStep, skipTour } = useTour();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [visible, setVisible] = useState(false);
  const [tooltipKey, setTooltipKey] = useState(0);

  const dimOpacity = useSharedValue(0);
  const svgOpacity = useSharedValue(0);
  const dashOffset = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateY = useSharedValue(12);

  // Mount / unmount the overlay with entrance/exit animations.
  useEffect(() => {
    if (isActive) {
      setVisible(true);
      dimOpacity.value = withTiming(1, { duration: 300 });
      tooltipOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));
      tooltipTranslateY.value = 12;
      tooltipTranslateY.value = withDelay(250, withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) }));
    } else {
      dimOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        'worklet';
        if (finished) runOnJS(setVisible)(false);
      });
      svgOpacity.value = withTiming(0, { duration: 150 });
      tooltipOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isActive]);

  // Animate the SVG border when the highlight target changes.
  useEffect(() => {
    if (!highlightLayout) {
      svgOpacity.value = withTiming(0, { duration: 150 });
      return;
    }
    const rw = highlightLayout.width + PAD * 2;
    const rh = highlightLayout.height + PAD * 2;
    const perimeter = 2 * (rw + rh);
    dashOffset.value = perimeter;
    svgOpacity.value = withTiming(1, { duration: 150 });
    dashOffset.value = withDelay(100, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }));
  }, [highlightLayout]);

  // Fade the tooltip out/in on step changes so content updates smoothly.
  useEffect(() => {
    tooltipOpacity.value = withTiming(0, { duration: 120 }, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(setTooltipKey)((k) => k + 1);
        tooltipTranslateY.value = 8;
        tooltipOpacity.value = withDelay(60, withTiming(1, { duration: 280 }));
        tooltipTranslateY.value = withDelay(60, withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) }));
      }
    });
  }, [currentStepIndex]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));
  const svgLayerStyle = useAnimatedStyle(() => ({ opacity: svgOpacity.value }));
  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateY: tooltipTranslateY.value }],
  }));

  const perimeter = highlightLayout
    ? 2 * (highlightLayout.width + PAD * 2 + highlightLayout.height + PAD * 2)
    : 0;

  const animatedRectProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  // Tooltip positioning: below highlight in top half, above in bottom half.
  const TOOLTIP_MARGIN = 20;
  const isBottomHalf = highlightLayout
    ? highlightLayout.y + highlightLayout.height / 2 > screenHeight * 0.5
    : false;

  const tooltipMaxWidth = screenWidth - Spacing.lg * 2;

  const tooltipPositionStyle = highlightLayout
    ? isBottomHalf
      ? { bottom: screenHeight - highlightLayout.y + TOOLTIP_MARGIN, left: Spacing.lg, right: Spacing.lg }
      : { top: highlightLayout.y + highlightLayout.height + PAD + TOOLTIP_MARGIN, left: Spacing.lg, right: Spacing.lg }
    : { top: screenHeight * 0.3, left: Spacing.lg, right: Spacing.lg };

  const isDone = currentStep?.id === 'done';
  const isLastStep = currentStepIndex === totalSteps - 1;

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }]}>
      {/* Dim overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.58)', pointerEvents: 'auto' }, dimStyle]}
      />

      {/* SVG highlight border */}
      {highlightLayout && (
        <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, svgLayerStyle]}>
          <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
            <AnimatedRect
              x={highlightLayout.x - PAD}
              y={highlightLayout.y - PAD}
              width={highlightLayout.width + PAD * 2}
              height={highlightLayout.height + PAD * 2}
              rx={Radius.md}
              ry={Radius.md}
              stroke={colors.accent}
              strokeWidth={2.5}
              strokeDasharray={[perimeter, perimeter]}
              fill="none"
              animatedProps={animatedRectProps}
            />
          </Svg>
        </Animated.View>
      )}

      {/* Tooltip card */}
      <Animated.View
        key={tooltipKey}
        style={[styles.tooltip, { backgroundColor: colors.surfaceSolid, borderColor: colors.border, maxWidth: tooltipMaxWidth, pointerEvents: 'auto' }, tooltipPositionStyle, tooltipStyle]}
      >
        {/* Step dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentStepIndex ? colors.accent : colors.borderMid },
                i === currentStepIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Text
          style={[styles.title, { color: colors.accent }]}
          numberOfLines={1}
        >
          {currentStep?.title ?? ''}
        </Text>

        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {currentStep?.description ?? ''}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={skipTour} hitSlop={8} activeOpacity={0.6}>
            <Text style={[styles.skipLabel, { color: colors.text.tertiary }]}>
              {isDone ? '' : 'Skip tour'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.fill.primary }]}
            onPress={nextStep}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextLabel, { color: colors.text.inverse }]}>
              {isLastStep ? 'Done' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    gap: Spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  skipLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  nextBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  nextLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
