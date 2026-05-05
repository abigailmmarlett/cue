import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Text } from './ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatSeconds } from '@/lib/utils/time';
import { DRAG_ITEM_HEIGHT } from './DraggableList';

export interface LocalExercise {
  id: string;
  name: string;
  duration: number;
  notes?: string | null;
  tagValueIds: string[];
  libraryExerciseId?: string | null;
}

interface Props {
  exercise: LocalExercise;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDelete: () => void;
  onEditTags: () => void;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: DRAG_ITEM_HEIGHT,
      paddingHorizontal: Spacing.md,
      backgroundColor: c.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    handle: {
      width: 32,
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
    linkedIcon: {
      fontSize: 14,
      color: c.text.tertiary,
      paddingHorizontal: Spacing.xs,
      marginRight: Spacing.xs,
    },
    tagButton: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
      marginRight: Spacing.xs,
    },
    tagIcon: {
      fontSize: 13,
      color: c.text.tertiary,
    },
    tagIconActive: {
      color: c.text.secondary,
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
  });
}

export function ExerciseRow({ exercise, onNameChange, onDurationChange, onDelete, onEditTags }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isLinked = !!exercise.libraryExerciseId;

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
    <View style={styles.row}>
      <View style={styles.handle}>
        <Text color="tertiary" style={styles.handleIcon}>≡</Text>
      </View>

      <TextInput
        style={[styles.nameInput, isLinked && styles.nameInputLinked]}
        value={exercise.name}
        onChangeText={onNameChange}
        placeholder="Exercise name"
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="done"
        maxLength={60}
        editable={!isLinked}
      />

      {isLinked ? (
        <Text style={styles.linkedIcon}>⊞</Text>
      ) : (
        <TouchableOpacity onPress={onEditTags} hitSlop={8} style={styles.tagButton}>
          <Text style={[styles.tagIcon, exercise.tagValueIds.length > 0 && styles.tagIconActive]}>
            {exercise.tagValueIds.length > 0 ? `🏷 ${exercise.tagValueIds.length}` : '🏷'}
          </Text>
        </TouchableOpacity>
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
  );
}
