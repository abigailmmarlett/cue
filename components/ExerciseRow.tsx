import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Text } from './ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { formatSeconds } from '@/lib/utils/time';
import { DRAG_ITEM_HEIGHT } from './DraggableList';

export interface LocalExercise {
  id: string;
  name: string;
  duration: number;
  notes?: string | null;
}

interface Props {
  exercise: LocalExercise;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDelete: () => void;
}

export function ExerciseRow({ exercise, onNameChange, onDurationChange, onDelete }: Props) {
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
      {/* Drag handle — gesture is applied by DraggableList's GestureDetector */}
      <View style={styles.handle}>
        <Text color="tertiary" style={styles.handleIcon}>
          ≡
        </Text>
      </View>

      <TextInput
        style={styles.nameInput}
        value={exercise.name}
        onChangeText={onNameChange}
        placeholder="Exercise name"
        placeholderTextColor={Colors.text.tertiary}
        returnKeyType="done"
        maxLength={60}
      />

      <TouchableOpacity onPress={editDuration} style={styles.durationButton} hitSlop={8}>
        <Text variant="label" color="secondary" style={styles.durationText}>
          {formatSeconds(exercise.duration)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
        <Text color="tertiary" style={styles.deleteIcon}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DRAG_ITEM_HEIGHT,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
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
    color: Colors.text.primary,
    paddingVertical: 0,
    marginHorizontal: Spacing.sm,
  },
  durationButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
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
