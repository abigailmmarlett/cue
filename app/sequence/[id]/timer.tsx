import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/ui/Text';
import { TimerControls } from '@/components/timer/TimerControls';
import { TripleRing } from '@/components/timer/TripleRing';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useSequence } from '@/lib/hooks/useSequence';
import { useTimer, type TimerExercise, type TimerSection } from '@/lib/hooks/useTimer';
import { formatSeconds } from '@/lib/utils/time';

export default function TimerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sequence, sections, exercises } = useSequence(id);

  const timerExercises: TimerExercise[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    duration: e.duration,
    sectionId: e.section_id,
    notes: e.notes,
  }));

  const timerSections: TimerSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.exercises.reduce((sum, e) => sum + e.duration, 0),
  }));

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
    controls,
  } = useTimer(timerExercises, timerSections);

  // Track total time elapsed for the outer ring
  const totalElapsed = timerExercises
    .slice(0, exerciseIndex)
    .reduce((sum, e) => sum + e.duration, 0) + ((currentExercise?.duration ?? 0) - timeRemaining);
  const totalTimeRemaining = Math.max(0, totalDuration - totalElapsed);

  const exerciseProgress = currentExercise ? timeRemaining / currentExercise.duration : 1;
  const sectionProgress = currentSection && currentSection.duration > 0
    ? sectionTimeRemaining / currentSection.duration
    : 1;
  const totalProgress = totalDuration > 0 ? totalTimeRemaining / totalDuration : 1;

  useEffect(() => {
    if (status === 'running' && exerciseIndex > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [exerciseIndex, status]);

  useEffect(() => {
    if (status === 'running' && currentSectionIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [currentSectionIndex, status]);

  useEffect(() => {
    if (status === 'finished') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status]);

  if (!sequence) return null;

  if (status === 'finished') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.completionContainer}>
          <Text style={styles.checkmark}>✓</Text>
          <Text variant="title" style={styles.completeTitle}>
            Complete
          </Text>
          <Text variant="body" color="secondary" style={styles.completeSubtitle}>
            {sequence.name}
          </Text>

          <View style={styles.completionActions}>
            <TouchableOpacity
              onPress={controls.reset}
              style={styles.restartButton}
              activeOpacity={0.8}
            >
              <Text variant="label" color="secondary">Restart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.exitButton}
              activeOpacity={0.8}
            >
              <Text variant="label" color="inverse">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={controls.end} hitSlop={12} style={styles.endButton}>
          <Text variant="label" color="secondary">End</Text>
        </TouchableOpacity>
        <Text variant="caption" color="tertiary" style={styles.sequenceTitle} numberOfLines={1}>
          {sequence.name}
        </Text>
        <View style={styles.endButtonPlaceholder} />
      </View>

      <View style={styles.ringContainer}>
        <TripleRing
          exerciseProgress={exerciseProgress}
          sectionProgress={sectionProgress}
          totalProgress={totalProgress}
        >
          {currentExercise && (
            <View style={styles.ringContent}>
              <Text variant="label" color="tertiary" style={styles.position}>
                {exerciseIndex + 1} of {totalExercises}
              </Text>
              <Text style={styles.exerciseName} numberOfLines={2}>
                {currentExercise.name}
              </Text>
              <Text style={styles.countdown}>
                {formatSeconds(timeRemaining)}
              </Text>
            </View>
          )}
        </TripleRing>

        <View style={styles.nextContainer}>
          {nextExercise ? (
            <>
              <Text variant="caption" color="tertiary">Next</Text>
              <Text variant="label" color="secondary" numberOfLines={1} style={styles.nextName}>
                {nextExercise.name}
              </Text>
            </>
          ) : (
            <Text variant="caption" color="tertiary">Last exercise</Text>
          )}
        </View>
      </View>

      <TimerControls status={status} controls={controls} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  endButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  endButtonPlaceholder: { width: 40 },
  sequenceTitle: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  countdown: {
    fontSize: 64,
    fontWeight: '300' as const,
    color: Colors.text.primary,
    fontVariant: ['tabular-nums'] as const,
    letterSpacing: -1,
    lineHeight: 72,
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
  checkmark: {
    fontSize: 56,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  completeTitle: { letterSpacing: -0.5 },
  completeSubtitle: { marginBottom: Spacing.xl },
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
    borderColor: Colors.border,
  },
  exitButton: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: Colors.fill.primary,
  },
});
