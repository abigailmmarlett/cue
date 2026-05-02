import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/ui/Text';
import { CountdownDisplay } from '@/components/timer/CountdownDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useSequence } from '@/lib/hooks/useSequence';
import { useTimer, type TimerExercise } from '@/lib/hooks/useTimer';

export default function TimerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sequence, exercises } = useSequence(id);

  const timerExercises: TimerExercise[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    duration: e.duration,
    notes: e.notes,
  }));

  const { status, exerciseIndex, timeRemaining, currentExercise, nextExercise, totalExercises, controls } =
    useTimer(timerExercises);

  // Haptic feedback on exercise change
  useEffect(() => {
    if (status === 'running' && exerciseIndex > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [exerciseIndex, status]);

  // Haptic on completion
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
              <Text variant="label" color="secondary">
                Restart
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.exitButton}
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
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={controls.end} hitSlop={12} style={styles.endButton}>
          <Text variant="label" color="secondary">
            End
          </Text>
        </TouchableOpacity>
        <Text variant="caption" color="tertiary" style={styles.sequenceTitle} numberOfLines={1}>
          {sequence.name}
        </Text>
        <View style={styles.endButtonPlaceholder} />
      </View>

      {/* Countdown */}
      {currentExercise && (
        <CountdownDisplay
          timeRemaining={timeRemaining}
          exerciseIndex={exerciseIndex}
          totalExercises={totalExercises}
          currentExerciseName={currentExercise.name}
          nextExerciseName={nextExercise?.name}
        />
      )}

      {/* Controls */}
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
  endButtonPlaceholder: {
    width: 40,
  },
  sequenceTitle: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Completion screen
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
  completeTitle: {
    letterSpacing: -0.5,
  },
  completeSubtitle: {
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
    borderColor: Colors.border,
  },
  exitButton: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: Colors.fill.primary,
  },
});
