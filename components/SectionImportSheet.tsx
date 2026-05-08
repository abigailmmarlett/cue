import {
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Text } from './ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { getAllSequences } from '@/lib/db/sequences';
import { getSectionsBySequenceId, type Section } from '@/lib/db/sections';
import { getExercisesBySectionId } from '@/lib/db/exercises';
import { parseLoad } from '@/lib/db/loadIcons';
import { generateId } from '@/lib/utils/id';
import type { LocalExercise } from '@/components/ExerciseRow';
import type { VariationItem } from '@/lib/db/exercises';

interface LocalSection {
  id: string;
  name: string;
  exercises: LocalExercise[];
}

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
  onImport: (section: LocalSection) => void;
  onClose: () => void;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    cancelBtn: { minWidth: 60 },
    backBtn: { minWidth: 60 },
    headerTitle: { textAlign: 'center' },
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

  const [sequences, setSequences] = useState<SequenceRow[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<SequenceRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);

  useEffect(() => {
    const all = getAllSequences();
    setSequences(
      all
        .filter((s) => s.id !== currentSequenceId)
        .map((s) => ({ id: s.id, name: s.name, exercise_count: s.exercise_count }))
    );
  }, [currentSequenceId]);

  const selectSequence = (seq: SequenceRow) => {
    const dbSections = getSectionsBySequenceId(seq.id);
    const withCounts: SectionRow[] = dbSections.map((s) => ({
      ...s,
      exerciseCount: getExercisesBySectionId(s.id).length,
    }));
    setSections(withCounts);
    setSelectedSequence(seq);
  };

  const importSection = (section: SectionRow) => {
    const dbExercises = getExercisesBySectionId(section.id);
    const localSection: LocalSection = {
      id: generateId(),
      name: section.name,
      exercises: dbExercises.map((ex): LocalExercise => ({
        id: generateId(),
        name: ex.name,
        duration: ex.duration,
        notes: ex.notes ?? null,
        tagValueIds: [],
        tags: [],
        libraryExerciseId: ex.library_exercise_id ?? null,
        loadModified: parseLoad(ex.load_modified),
        loadBase: parseLoad(ex.load_base),
        loadAmplified: parseLoad(ex.load_amplified),
        variation: ex.variation ?? null,
        variationSets: ex.variation_sets ? (JSON.parse(ex.variation_sets) as VariationItem[]) : null,
        isBilateral: ex.is_bilateral !== 0,
        side: ex.side ?? null,
      })),
    };
    onImport(localSection);
  };

  const goBack = () => {
    setSelectedSequence(null);
    setSections([]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {selectedSequence ? (
            <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={8}>
              <Text variant="body" color="secondary">Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cancelBtn} />
          )}
          <Text variant="label" style={styles.headerTitle}>
            {selectedSequence ? selectedSequence.name : 'Import Section'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} hitSlop={8}>
            <Text variant="body" color="secondary" style={{ textAlign: 'right' }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {!selectedSequence ? (
          <FlatList
            data={sequences}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => selectSequence(item)} activeOpacity={0.7}>
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
                <Text variant="body" color="tertiary">No other sequences.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => importSection(item)} activeOpacity={0.7}>
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
                <Text variant="body" color="tertiary">No sections in this sequence.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
