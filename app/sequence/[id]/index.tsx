import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing } from '@/constants/theme';
import { useSequence } from '@/lib/hooks/useSequence';
import { formatSeconds, totalDuration } from '@/lib/utils/time';

export default function SequenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { sequence, exercises, loading, refresh } = useSequence(id);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (sequence) {
      navigation.setOptions({ title: sequence.name });
    }
  }, [navigation, sequence]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!sequence) return null;

  const duration = totalDuration(exercises);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text variant="caption" color="tertiary" style={styles.summaryLabel}>
              DURATION
            </Text>
            <Text variant="heading">{formatSeconds(duration)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="caption" color="tertiary" style={styles.summaryLabel}>
              EXERCISES
            </Text>
            <Text variant="heading">{exercises.length}</Text>
          </View>
        </View>

        <Divider />

        {exercises.length === 0 ? (
          <View style={styles.noExercises}>
            <Text variant="body" color="tertiary">
              No exercises yet. Tap Edit to add some.
            </Text>
          </View>
        ) : (
          <View>
            {exercises.map((ex, i) => (
              <View key={ex.id}>
                <View style={styles.exerciseRow}>
                  <View style={styles.exerciseIndex}>
                    <Text variant="caption" color="tertiary">
                      {String(i + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text variant="body" numberOfLines={1}>
                      {ex.name}
                    </Text>
                    {ex.notes ? (
                      <Text variant="caption" color="tertiary" numberOfLines={1}>
                        {ex.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="label" color="secondary" style={styles.exerciseDuration}>
                    {formatSeconds(ex.duration)}
                  </Text>
                </View>
                {i < exercises.length - 1 && <Divider inset />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Edit"
          variant="secondary"
          onPress={() => router.push(`/builder/${id}`)}
          style={styles.editButton}
        />
        <Button
          label="Start Timer"
          variant="primary"
          onPress={() => router.push(`/sequence/${id}/timer`)}
          disabled={exercises.length === 0}
          style={styles.startButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing.xl },
  summary: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryLabel: {
    letterSpacing: 0.8,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  noExercises: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  exerciseIndex: {
    width: 28,
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseDuration: {
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  editButton: { flex: 1 },
  startButton: { flex: 2 },
});
