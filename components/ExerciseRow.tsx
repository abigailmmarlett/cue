import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Text } from './ui/Text';
import { TagChips } from './TagChips';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatSeconds } from '@/lib/utils/time';
import { DRAG_ITEM_HEIGHT } from './DraggableList';
import type { ExerciseTag } from '@/lib/db/tags';
import type { VariationItem } from '@/lib/db/exercises';

export interface LocalExercise {
  id: string;
  name: string;
  duration: number;
  notes?: string | null;
  tagValueIds: string[];
  tags: ExerciseTag[];
  libraryExerciseId?: string | null;
  loadModified: string[] | null;
  loadBase: string[] | null;
  loadAmplified: string[] | null;
  variation: string | null;
  variationSets: VariationItem[] | null;
  isBilateral: boolean;
  side: 'left' | 'right' | null;
}

interface Props {
  exercise: LocalExercise;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDelete: () => void;
  onEditTags: () => void;
  onEditLoad?: () => void;
  onEditVariation?: () => void;
  onSideChange?: (side: 'left' | 'right' | null) => void;
}

const HANDLE_WIDTH = 32;

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    outer: {
      height: DRAG_ITEM_HEIGHT,
      backgroundColor: c.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      justifyContent: 'center',
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingLeft: Spacing.md + HANDLE_WIDTH + Spacing.sm,
      marginTop: 4,
      gap: Spacing.xs,
    },
    handle: {
      width: HANDLE_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handleIcon: {
      fontSize: 18,
      lineHeight: 24,
    },
    nameInput: {
      flex: 1,
      fontSize: FontSize.base,
      fontWeight: FontWeight.regular,
      color: c.text.primary,
      paddingVertical: 0,
      marginHorizontal: Spacing.sm,
    },
    nameInputLinked: {
      color: c.text.secondary,
    },
    tagButton: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
      marginRight: Spacing.xs,
    },
    tagIcon: {
      fontSize: 17,
      color: c.text.tertiary,
    },
    tagIconActive: {
      color: c.text.secondary,
    },
    addTagsLabel: {
      fontSize: 11,
      color: c.text.tertiary,
    },
    durationButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: c.surface,
      borderRadius: 6,
      minWidth: 48,
      alignItems: 'center',
    },
    durationText: {
      fontVariant: ['tabular-nums'],
    },
    deleteButton: {
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIcon: {
      fontSize: 14,
    },
    sidePill: {
      flexDirection: 'row',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      marginRight: Spacing.xs,
    },
    sideBtn: {
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    sideBtnActive: {
      backgroundColor: c.accent,
    },
    sideBtnText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: c.text.tertiary,
    },
    sideBtnTextActive: {
      color: c.text.inverse,
    },
  });
}

export function ExerciseRow({ exercise, onNameChange, onDurationChange, onDelete, onEditTags, onEditLoad, onEditVariation, onSideChange }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const hasLoad =
    (exercise.loadModified?.length ?? 0) > 0 ||
    (exercise.loadBase?.length ?? 0) > 0 ||
    (exercise.loadAmplified?.length ?? 0) > 0;

  const editDuration = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Set Duration',
        'Enter duration in seconds (e.g. 45)',
        (text) => {
          const n = parseInt(text, 10);
          if (!isNaN(n) && n > 0) onDurationChange(n);
        },
        'plain-text',
        String(exercise.duration)
      );
    }
  };

  return (
    <View style={styles.outer}>
      <View style={styles.mainRow}>
        <View style={styles.handle}>
          <Text color="tertiary" style={styles.handleIcon}>≡</Text>
        </View>

        <TextInput
          style={[styles.nameInput, !!exercise.libraryExerciseId && styles.nameInputLinked]}
          value={exercise.name}
          onChangeText={onNameChange}
          placeholder="Exercise name"
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          maxLength={60}
          editable={!exercise.libraryExerciseId}
        />

        {onEditLoad && (
          <TouchableOpacity onPress={onEditLoad} hitSlop={8} style={styles.tagButton}>
            <Text style={[styles.tagIcon, hasLoad && styles.tagIconActive]}>⊙</Text>
          </TouchableOpacity>
        )}

        {onEditVariation && (
          <TouchableOpacity onPress={onEditVariation} hitSlop={8} style={styles.tagButton}>
            <Text style={[styles.tagIcon, !!(exercise.variationSets?.length || exercise.variation) && styles.tagIconActive]}>◈</Text>
          </TouchableOpacity>
        )}

        {exercise.isBilateral && onSideChange && (
          <View style={styles.sidePill}>
            <TouchableOpacity
              onPress={() => onSideChange(exercise.side === 'left' ? null : 'left')}
              style={[styles.sideBtn, exercise.side === 'left' && styles.sideBtnActive]}
              hitSlop={4}
            >
              <Text style={[styles.sideBtnText, exercise.side === 'left' && styles.sideBtnTextActive]}>L</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSideChange(exercise.side === 'right' ? null : 'right')}
              style={[styles.sideBtn, exercise.side === 'right' && styles.sideBtnActive]}
              hitSlop={4}
            >
              <Text style={[styles.sideBtnText, exercise.side === 'right' && styles.sideBtnTextActive]}>R</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={editDuration} style={styles.durationButton} hitSlop={8}>
          <Text variant="label" color="secondary" style={styles.durationText}>
            {formatSeconds(exercise.duration)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
          <Text color="tertiary" style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tagsRow}>
        {exercise.tags.length > 0 && <TagChips tags={exercise.tags} />}
        <TouchableOpacity onPress={onEditTags} hitSlop={8}>
          <Text style={styles.addTagsLabel}>
            {exercise.tags.length > 0 ? 'Edit tags' : '+ Add tags'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
