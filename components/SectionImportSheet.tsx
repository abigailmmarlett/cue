import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Text } from './ui/Text';
import { Sheet } from './ui/Sheet';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { getAllSequences } from '@/lib/db/sequences';
import { getSectionsBySequenceId, type Section } from '@/lib/db/sections';
import { getExercisesBySectionId } from '@/lib/db/exercises';
import { copySectionToDraft, type DraftSection } from '@/lib/db/sequenceDraft';

interface SequenceRow {
  id: string;
  name: string;
  exercise_count: number;
}

interface SectionRow extends Section {
  exerciseCount: number;
}

interface Props {
  currentSequenceId?: string;
  onImport: (section: DraftSection) => void;
  onClose: () => void;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xl * 2,
      gap: Spacing.xs,
    },
    pill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.sm,
      backgroundColor: c.surface,
    },
  });
}

export function SectionImportSheet({ currentSequenceId, onImport, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [sequences] = useState<SequenceRow[]>(() =>
    getAllSequences()
      .filter((s) => s.id !== currentSequenceId)
      .map((s) => ({ id: s.id, name: s.name, exercise_count: s.exercise_count }))
  );
  const [selectedSequence, setSelectedSequence] = useState<SequenceRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);

  const selectSequence = (seq: SequenceRow) => {
    const dbSections = getSectionsBySequenceId(seq.id);
    const withCounts: SectionRow[] = dbSections.map((s) => ({
      ...s,
      exerciseCount: getExercisesBySectionId(s.id).length,
    }));
    setSections(withCounts);
    setSelectedSequence(seq);
  };

  const goBack = () => {
    setSelectedSequence(null);
    setSections([]);
  };

  return (
    <Sheet
      title={selectedSequence ? selectedSequence.name : 'Import Section'}
      onClose={onClose}
      left={selectedSequence ? { label: 'Back', onPress: goBack } : undefined}
      right={{ label: 'Cancel', onPress: onClose }}
    >
      {!selectedSequence ? (
        <FlatList
          data={sequences}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => selectSequence(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text variant="body">{item.name}</Text>
              <View style={styles.rowRight}>
                <Text variant="caption" color="tertiary">
                  {item.exercise_count} exercise{item.exercise_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color="tertiary">
                No other sequences.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onImport(copySectionToDraft(item))}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text variant="body">{item.name || 'Untitled Section'}</Text>
              <View style={styles.rowRight}>
                <Text variant="caption" color="tertiary">
                  {item.exerciseCount} exercise{item.exerciseCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color="tertiary">
                No sections in this sequence.
              </Text>
            </View>
          }
        />
      )}
    </Sheet>
  );
}
