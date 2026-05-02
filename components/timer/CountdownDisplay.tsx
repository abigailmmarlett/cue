import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing } from '@/constants/theme';
import { formatSeconds } from '@/lib/utils/time';

interface Props {
  timeRemaining: number;
  exerciseIndex: number;
  totalExercises: number;
  currentExerciseName: string;
  nextExerciseName?: string | null;
}

export function CountdownDisplay({
  timeRemaining,
  exerciseIndex,
  totalExercises,
  currentExerciseName,
  nextExerciseName,
}: Props) {
  return (
    <View style={styles.container}>
      <Text variant="label" color="tertiary" style={styles.position}>
        {exerciseIndex + 1} of {totalExercises}
      </Text>

      <Text variant="heading" style={styles.exerciseName} numberOfLines={2}>
        {currentExerciseName}
      </Text>

      <Text variant="timer" style={styles.countdown}>
        {formatSeconds(timeRemaining)}
      </Text>

      <View style={styles.nextContainer}>
        {nextExerciseName ? (
          <>
            <Text variant="caption" color="tertiary">
              Next
            </Text>
            <Text variant="label" color="secondary" numberOfLines={1} style={styles.nextName}>
              {nextExerciseName}
            </Text>
          </>
        ) : (
          <Text variant="caption" color="tertiary">
            Last exercise
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  position: {
    marginBottom: Spacing.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  exerciseName: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  countdown: {
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },
  nextContainer: {
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
  },
  nextName: {
    textAlign: 'center',
  },
});
