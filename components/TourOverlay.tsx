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
import { useEffect, useRef, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTour, type HighlightLayout, type TourStep } from '@/lib/contexts/TourContext';
import { Radius, Spacing } from '@/constants/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const PAD = 10;

interface Shown {
  index: number;
  step: TourStep | null;
  layout: HighlightLayout | null;
}

export function TourOverlay() {
  const { isActive, currentStepIndex, totalSteps, currentStep, highlightLayout, readyStepIndex, nextStep, skipTour } =
    useTour();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [visible, setVisible] = useState(false);
  // What the tooltip and highlight show. It only changes while they're faded out, and stays put
  // while the tour closes, so the text never changes in view.
  const [shown, setShown] = useState<Shown>({ index: -1, step: null, layout: null });
  const shownIndexRef = useRef(-1);

  const dimOpacity = useSharedValue(0);
  const svgOpacity = useSharedValue(0);
  const dashOffset = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);
  const tooltipTranslateY = useSharedValue(12);

  // Mount / unmount the overlay with entrance/exit animations. The tooltip fades in once its step is ready.
  useEffect(() => {
    if (isActive) {
      setVisible(true);
      dimOpacity.value = withTiming(1, { duration: 300 });
    } else {
      shownIndexRef.current = -1;
      dimOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        'worklet';
        if (finished) runOnJS(setVisible)(false);
      });
      svgOpacity.value = withTiming(0, { duration: 150 });
      tooltipOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isActive, dimOpacity, svgOpacity, tooltipOpacity]);

  // Leaving a step: fade the tooltip and highlight out while the next step's target is measured.
  useEffect(() => {
    if (!isActive) return;
    tooltipOpacity.value = withTiming(0, { duration: 120 });
    svgOpacity.value = withTiming(0, { duration: 120 });
  }, [isActive, currentStepIndex, svgOpacity, tooltipOpacity]);

  // The step is ready: swap in its content while hidden, then fade it in. A re-measure of the
  // step already showing only moves it.
  useEffect(() => {
    if (!isActive || readyStepIndex !== currentStepIndex) return;
    setShown({ index: currentStepIndex, step: currentStep, layout: highlightLayout });
    if (shownIndexRef.current === currentStepIndex) return;
    const first = shownIndexRef.current === -1;
    shownIndexRef.current = currentStepIndex;
    // The first step waits for the dim layer to fade in.
    const delay = first ? 250 : 60;
    tooltipTranslateY.value = first ? 12 : 8;
    tooltipOpacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
    tooltipTranslateY.value = withDelay(delay, withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) }));
  }, [isActive, readyStepIndex, currentStepIndex, currentStep, highlightLayout, tooltipOpacity, tooltipTranslateY]);

  // Draw the highlight border around the shown step's target.
  useEffect(() => {
    if (!shown.layout) return;
    dashOffset.value = 2 * (shown.layout.width + shown.layout.height + PAD * 4);
    svgOpacity.value = withTiming(1, { duration: 150 });
    dashOffset.value = withDelay(100, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }));
  }, [shown.layout, dashOffset, svgOpacity]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));
  const svgLayerStyle = useAnimatedStyle(() => ({ opacity: svgOpacity.value }));
  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ translateY: tooltipTranslateY.value }],
  }));

  const highlight = shown.layout;
  const perimeter = highlight ? 2 * (highlight.width + PAD * 2 + highlight.height + PAD * 2) : 0;

  const animatedRectProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  // Tooltip positioning: below highlight in top half, above in bottom half.
  const TOOLTIP_MARGIN = 20;
  const isBottomHalf = highlight ? highlight.y + highlight.height / 2 > screenHeight * 0.5 : false;

  const tooltipMaxWidth = screenWidth - Spacing.lg * 2;

  const tooltipPositionStyle = highlight
    ? isBottomHalf
      ? { bottom: screenHeight - highlight.y + TOOLTIP_MARGIN, left: Spacing.lg, right: Spacing.lg }
      : { top: highlight.y + highlight.height + PAD + TOOLTIP_MARGIN, left: Spacing.lg, right: Spacing.lg }
    : { top: screenHeight * 0.3, left: Spacing.lg, right: Spacing.lg };

  const isDone = shown.step?.id === 'done';
  const isLastStep = shown.index === totalSteps - 1;

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }]}>
      {/* Dim overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.58)', pointerEvents: 'auto' }, dimStyle]}
      />

      {/* SVG highlight border */}
      {highlight && (
        <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, svgLayerStyle]}>
          <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
            <AnimatedRect
              x={highlight.x - PAD}
              y={highlight.y - PAD}
              width={highlight.width + PAD * 2}
              height={highlight.height + PAD * 2}
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
        style={[
          styles.tooltip,
          {
            backgroundColor: colors.surfaceSolid,
            borderColor: colors.border,
            maxWidth: tooltipMaxWidth,
            // Hidden between steps, so it mustn't take taps until the next one shows.
            pointerEvents: shown.index === currentStepIndex ? 'auto' : 'none',
          },
          tooltipPositionStyle,
          tooltipStyle,
        ]}
      >
        {/* Step dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === shown.index ? colors.accent : colors.borderMid },
                i === shown.index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: colors.accentText }]} numberOfLines={1}>
          {shown.step?.title ?? ''}
        </Text>

        <Text style={[styles.description, { color: colors.text.secondary }]}>{shown.step?.description ?? ''}</Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={skipTour} hitSlop={8} activeOpacity={0.6}>
            <Text style={[styles.skipLabel, { color: colors.text.tertiary }]}>{isDone ? '' : 'Skip tour'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.fill.primary }]}
            onPress={nextStep}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextLabel, { color: colors.text.onFill }]}>{isLastStep ? 'Done' : 'Next'}</Text>
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
