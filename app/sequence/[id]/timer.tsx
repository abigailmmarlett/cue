import { View, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { usePreventRemove } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Text } from '@/components/ui/Text';
import { TagChips } from '@/components/TagChips';
import { LoadDotRow } from '@/components/LoadDotRow';
import { TimerControls } from '@/components/timer/TimerControls';
import { TripleRing } from '@/components/timer/TripleRing';
import { FireworkAnimation } from '@/components/timer/FireworkAnimation';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { getAllLoadIcons, parseLoad, type LoadIcon } from '@/lib/db/loadIcons';
import { computeVariationFractions, parseVariationSets } from '@/lib/db/exercises';
import { useSequence } from '@/lib/hooks/useSequence';
import { useTimer, type TimerExercise, type TimerSection } from '@/lib/hooks/useTimer';
import { useHapticFeedback, fireHaptic } from '@/lib/hooks/useHapticFeedback';
import { usePreferences } from '@/lib/hooks/usePreferences';
import { formatSeconds } from '@/lib/utils/time';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/ErrorFallback';

/** Stops the phone auto-locking while it's mounted. */
function KeepScreenAwake() {
  useKeepAwake('cue-timer');
  return null;
}

export default function TimerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { sequence, sections, exercises } = useSequence(id);
  const [allLoadIcons] = useState<LoadIcon[]>(() => getAllLoadIcons());
  const [currentRunMarks, setCurrentRunMarks] = useState<Map<string, number[]>>(new Map());
  const [prevRunMarks, setPrevRunMarks] = useState<Map<string, number[]>>(new Map());
  const prevExerciseKeyRef = useRef<string | null>(null);
  const currentRunMarksRef = useRef<Map<string, number[]>>(new Map());

  const timerExercises: TimerExercise[] = useMemo(
    () =>
      exercises.map((e) => ({
        id: e.id,
        name: e.name,
        // Older data can have 0-second exercises; give them at least a second so the rings can draw.
        duration: Math.max(1, e.duration),
        sectionId: e.section_id,
        notes: e.notes,
        tags: e.tags,
        loadModified: parseLoad(e.load_modified),
        loadBase: parseLoad(e.load_base),
        loadAmplified: parseLoad(e.load_amplified),
        variation: e.variation,
        variationSets: parseVariationSets(e.variation_sets),
        side: e.side,
        libraryExerciseId: e.library_exercise_id,
      })),
    [exercises]
  );

  const timerSections: TimerSection[] = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        name: s.name,
        duration: timerExercises.filter((e) => e.sectionId === s.id).reduce((sum, e) => sum + e.duration, 0),
      })),
    [sections, timerExercises]
  );

  const totalDuration = timerExercises.reduce((sum, e) => sum + e.duration, 0);

  const {
    status,
    exerciseIndex,
    timeRemaining,
    currentExercise,
    nextExercise,
    totalExercises,
    currentSectionIndex,
    currentSection,
    sectionTimeRemaining,
    runId,
    controls,
  } = useTimer(timerExercises, timerSections);
  const styles = makeStyles(colors);
  const inProgress = status === 'running' || status === 'paused';

  // Leaving mid-workout (the ← button or a swipe back) asks first, so a stray swipe can't end the class.
  usePreventRemove(inProgress, ({ data }) => {
    Alert.alert('End workout?', 'The timer will stop.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const leave = () => (router.canGoBack() ? router.back() : router.replace(`/sequence/${id}`));

  // Reset mid-workout loses your place, so it asks first too.
  const confirmReset = () =>
    Alert.alert('Restart workout?', 'The timer will go back to the first exercise.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: controls.reset },
    ]);
  const timerControls = inProgress ? { ...controls, reset: confirmReset } : controls;

  const { hapticSettings } = usePreferences();
  useHapticFeedback(
    { status, exerciseIndex, timeRemaining, currentExercise, nextExercise, currentSectionIndex, runId },
    hapticSettings
  );

  useEffect(() => {
    currentRunMarksRef.current = currentRunMarks;
  }, [currentRunMarks]);

  useEffect(() => {
    const prevKey = prevExerciseKeyRef.current;
    if (prevKey) {
      const marks = currentRunMarksRef.current.get(prevKey) ?? [];
      setPrevRunMarks((prev) => {
        const next = new Map(prev);
        next.set(prevKey, [...marks]);
        return next;
      });
      setCurrentRunMarks((prev) => {
        const next = new Map(prev);
        next.delete(prevKey);
        return next;
      });
    }
    prevExerciseKeyRef.current = currentExercise?.libraryExerciseId ?? currentExercise?.name ?? null;
  }, [exerciseIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const addMark = useCallback(() => {
    if (!currentExercise || status !== 'running') return;
    const key = currentExercise.libraryExerciseId ?? currentExercise.name;
    const fraction = 1 - timeRemaining / currentExercise.duration;
    if (hapticSettings.enabled && hapticSettings.onMark.enabled) {
      fireHaptic(hapticSettings.onMark.style);
    }
    setCurrentRunMarks((prev) => {
      const next = new Map(prev);
      next.set(key, [...(next.get(key) ?? []), fraction]);
      return next;
    });
  }, [currentExercise, timeRemaining, status, hapticSettings]);

  // Track total time elapsed for the outer ring
  const totalElapsed =
    timerExercises.slice(0, exerciseIndex).reduce((sum, e) => sum + e.duration, 0) +
    ((currentExercise?.duration ?? 0) - timeRemaining);
  const totalTimeRemaining = Math.max(0, totalDuration - totalElapsed);

  const hasLoadData =
    (currentExercise?.loadModified?.length ?? 0) > 0 ||
    (currentExercise?.loadBase?.length ?? 0) > 0 ||
    (currentExercise?.loadAmplified?.length ?? 0) > 0;
  const hasVariation = !!(currentExercise?.variationSets?.length || currentExercise?.variation);
  const hasSide = !!currentExercise?.side;
  const sideLabel = currentExercise?.side === 'left' ? 'Left' : currentExercise?.side === 'right' ? 'Right' : null;

  const variationFractions = currentExercise?.variationSets?.length
    ? computeVariationFractions(currentExercise.variationSets, currentExercise.duration)
    : [];

  const elapsed = currentExercise ? currentExercise.duration - timeRemaining : 0;
  const activeVariationIndex = currentExercise?.variationSets?.length
    ? variationFractions.reduce<number>((last, f, i) => (elapsed / currentExercise!.duration >= f ? i : last), -1)
    : -1;
  const activeVariationLabel =
    activeVariationIndex >= 0
      ? (currentExercise?.variationSets?.[activeVariationIndex]?.instruction ?? null)
      : (currentExercise?.variation ?? null);

  const currentKey = currentExercise?.libraryExerciseId ?? currentExercise?.name ?? null;
  const ringMarks = currentKey
    ? [...(prevRunMarks.get(currentKey) ?? []), ...(currentRunMarks.get(currentKey) ?? [])]
    : [];

  const exerciseProgress = currentExercise ? timeRemaining / currentExercise.duration : 1;
  const sectionProgress =
    currentSection && currentSection.duration > 0 ? sectionTimeRemaining / currentSection.duration : 1;
  const totalProgress = totalDuration > 0 ? totalTimeRemaining / totalDuration : 1;

  if (!sequence) return null;

  if (timerExercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.completionContainer}>
          <Text variant="title" style={styles.completeTitle}>
            No exercises yet
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyMessage}>
            Add exercises to {sequence.name} to use the timer.
          </Text>
          <View style={styles.completionActions}>
            <TouchableOpacity onPress={leave} style={styles.restartButton} activeOpacity={0.8}>
              <Text variant="label" color="secondary">
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace(`/builder/${id}`)}
              style={[styles.exitButton, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <Text variant="label" color="inverse">
                Edit Sequence
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'finished') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.completionContainer}>
          <FireworkAnimation accentColor={colors.accent} />
          <Text variant="title" style={styles.completeTitle}>
            Done.
          </Text>
          <Text variant="body" color="secondary" style={styles.completeSubtitle}>
            {sequence.name}
          </Text>
          <Text style={[styles.completeTotalTime, { color: colors.accent }]}>{formatSeconds(totalDuration)}</Text>

          <View style={styles.completionActions}>
            <TouchableOpacity onPress={controls.reset} style={styles.restartButton} activeOpacity={0.8}>
              <Text variant="label" color="secondary">
                Restart
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={leave}
              style={[styles.exitButton, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <Text variant="label" color="inverse">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {inProgress && <KeepScreenAwake />}

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={leave}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Leave timer"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text variant="caption" color="tertiary" style={styles.sequenceTitle} numberOfLines={1}>
          {sequence.name}
        </Text>
        <View style={[styles.totalTimeBadge, { backgroundColor: colors.accentDim, borderColor: colors.pill.border }]}>
          <Text style={[styles.totalTimeBadgeText, { color: colors.accent }]}>{formatSeconds(totalTimeRemaining)}</Text>
        </View>
      </View>

      <View style={styles.ringContainer}>
        <TripleRing
          exerciseProgress={exerciseProgress}
          sectionProgress={sectionProgress}
          totalProgress={totalProgress}
          exerciseMarks={ringMarks}
          markColor={colors.text.inverse}
          variationMarks={variationFractions}
        >
          {currentExercise && (
            <View style={styles.ringContent}>
              <Text variant="label" color="tertiary" style={styles.position}>
                {exerciseIndex + 1} of {totalExercises}
              </Text>
              <Text style={styles.exerciseName} numberOfLines={2}>
                {currentExercise.name}
              </Text>
              <Text style={styles.countdown}>{formatSeconds(timeRemaining)}</Text>
              <TagChips tags={currentExercise.tags} style={styles.timerTagChips} />
              {allLoadIcons.length > 0 && hasLoadData && (
                <View style={styles.loadRows}>
                  <LoadDotRow
                    label="MOD"
                    iconIds={currentExercise.loadModified ?? []}
                    allIcons={allLoadIcons}
                    dotDiameter={12}
                  />
                  <LoadDotRow
                    label="BASE"
                    iconIds={currentExercise.loadBase ?? []}
                    allIcons={allLoadIcons}
                    dotDiameter={12}
                  />
                  <LoadDotRow
                    label="AMP"
                    iconIds={currentExercise.loadAmplified ?? []}
                    allIcons={allLoadIcons}
                    dotDiameter={12}
                  />
                </View>
              )}
            </View>
          )}
        </TripleRing>

        <View style={styles.nextContainer}>
          {nextExercise ? (
            <>
              <Text variant="caption" color="tertiary">
                Next
              </Text>
              <Text variant="label" color="secondary" numberOfLines={1} style={styles.nextName}>
                {nextExercise.name}
              </Text>
            </>
          ) : (
            <Text variant="caption" color="tertiary">
              Last exercise
            </Text>
          )}
        </View>
      </View>

      {(hasSide || hasVariation) && currentExercise && (
        <View style={styles.variationIndicator}>
          {hasSide && sideLabel && (
            <>
              <Text style={[styles.variationIcon, { color: colors.accent }]}>⇌</Text>
              <Text variant="caption" color="secondary" style={styles.variationText}>
                {sideLabel}
              </Text>
            </>
          )}
          {hasVariation && activeVariationLabel && (
            <>
              {hasSide && (
                <Text variant="caption" color="tertiary" style={styles.variationText}>
                  ·
                </Text>
              )}
              <Text style={[styles.variationIcon, { color: colors.accent }]}>◈</Text>
              <Text variant="caption" color="secondary" style={styles.variationText}>
                {activeVariationLabel}
              </Text>
            </>
          )}
        </View>
      )}

      <TimerControls status={status} controls={timerControls} onMark={addMark} />
    </SafeAreaView>
  );
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
      gap: Spacing.sm,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    backIcon: {
      fontSize: 16,
      color: c.text.secondary,
    },
    sequenceTitle: {
      flex: 1,
      textAlign: 'center',
      letterSpacing: 0.3,
      fontWeight: '700',
    },
    totalTimeBadge: {
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderWidth: 1,
      flexShrink: 0,
    },
    totalTimeBadgeText: {
      fontSize: 13,
      fontWeight: '500',
      fontVariant: ['tabular-nums'] as const,
    },
    ringContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
    },
    ringContent: {
      alignItems: 'center',
      gap: 4,
    },
    position: {
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    exerciseName: {
      fontSize: FontSize.lg,
      fontWeight: '600' as const,
      textAlign: 'center',
      color: c.text.primary,
      letterSpacing: -0.3,
    },
    countdown: {
      fontSize: 64,
      fontWeight: '300' as const,
      color: c.text.primary,
      fontVariant: ['tabular-nums'] as const,
      letterSpacing: -1,
      lineHeight: 72,
    },
    timerTagChips: {
      justifyContent: 'center',
      marginTop: 6,
    },
    loadRows: {
      gap: 4,
      alignItems: 'flex-start',
      marginTop: 6,
    },
    variationIndicator: {
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    variationIcon: {
      fontSize: 14,
    },
    variationText: {
      textAlign: 'center',
    },
    nextContainer: {
      alignItems: 'center',
      gap: 2,
      minHeight: 36,
    },
    nextName: {
      textAlign: 'center',
    },
    completionContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
      gap: Spacing.sm,
    },
    completeTitle: { letterSpacing: -0.5 },
    completeSubtitle: {},
    emptyMessage: { textAlign: 'center' },
    completeTotalTime: {
      fontSize: 13,
      fontWeight: '500',
      fontVariant: ['tabular-nums'] as const,
      marginBottom: Spacing.xl,
    },
    completionActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    restartButton: {
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.borderMid,
    },
    exitButton: {
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.md,
    },
  });
}
