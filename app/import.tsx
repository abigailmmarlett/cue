import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { decodeShareData, importSharedSequence } from '@/lib/utils/shareSequence';
import { formatSeconds } from '@/lib/utils/time';

export default function ImportScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [importing, setImporting] = useState(false);

  const payload = decodeShareData(data);

  if (!payload) {
    return (
      <View style={styles.centered}>
        <Text variant="heading" style={styles.errorTitle}>Invalid Link</Text>
        <Text variant="body" color="tertiary" style={styles.errorBody}>
          This link doesn't contain a valid sequence.
        </Text>
        <Button label="Close" variant="secondary" onPress={() => router.back()} style={styles.closeButton} />
      </View>
    );
  }

  const totalExercises = payload.sections.reduce((sum, s) => sum + s.exercises.length, 0);
  const totalDuration = payload.sections.reduce(
    (sum, s) => sum + s.exercises.reduce((es, e) => es + e.duration, 0),
    0
  );

  const handleImport = () => {
    setImporting(true);
    try {
      const newId = importSharedSequence(payload);
      router.replace(`/sequence/${newId}`);
    } catch {
      setImporting(false);
      Alert.alert('Import Failed', 'Something went wrong importing this sequence. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="title" style={styles.sequenceName}>{payload.name}</Text>
          <View style={styles.meta}>
            <Text variant="caption" color="secondary">
              {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
            </Text>
            <Text variant="caption" color="tertiary"> · </Text>
            <Text variant="caption" color="secondary">{formatSeconds(totalDuration)}</Text>
          </View>
        </View>

        <Divider />

        {payload.sections.map((section, sIdx) => (
          <View key={sIdx}>
            {payload.sections.length > 1 && (
              <View style={styles.sectionHeader}>
                <Text variant="caption" color="tertiary" style={styles.sectionLabel}>
                  {section.name.toUpperCase()}
                </Text>
              </View>
            )}
            {section.exercises.map((ex, eIdx) => {
              const globalIndex = payload.sections
                .slice(0, sIdx)
                .reduce((sum, s) => sum + s.exercises.length, 0) + eIdx;
              const isLastInSection = eIdx === section.exercises.length - 1;
              const isLastSection = sIdx === payload.sections.length - 1;
              return (
                <View key={eIdx}>
                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseIndex}>
                      <Text variant="caption" color="tertiary">
                        {String(globalIndex + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text variant="body" style={styles.exerciseName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text variant="label" color="secondary" style={styles.exerciseDuration}>
                      {formatSeconds(ex.duration)}
                    </Text>
                  </View>
                  {!(isLastInSection && isLastSection) && <Divider inset />}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
        <Button
          label="Add to My Sequences"
          variant="primary"
          onPress={handleImport}
          loading={importing}
          style={styles.importButton}
        />
      </View>
    </View>
  );
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
      gap: Spacing.sm,
    },
    errorTitle: { textAlign: 'center' },
    errorBody: { textAlign: 'center' },
    closeButton: { marginTop: Spacing.md, minWidth: 120 },
    scroll: { paddingBottom: Spacing.xl },
    header: {
      padding: Spacing.lg,
      gap: Spacing.xs,
    },
    sequenceName: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionHeader: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    sectionLabel: { letterSpacing: 0.8 },
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
    exerciseName: { flex: 1 },
    exerciseDuration: { fontVariant: ['tabular-nums'] },
    footer: {
      flexDirection: 'row',
      gap: Spacing.sm,
      padding: Spacing.md,
      paddingBottom: Spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
    cancelButton: { flex: 1 },
    importButton: { flex: 2 },
  });
}
