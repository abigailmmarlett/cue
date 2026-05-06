import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Text } from './ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { formatSeconds } from '@/lib/utils/time';

interface Props {
  name: string;
  canDelete: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddExercise: () => void;
  totalDuration: number;
  onSetTotalDuration?: (seconds: number) => void;
  children: React.ReactNode;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      marginTop: Spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
    },
    nameInput: {
      flex: 1,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: c.text.secondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      paddingVertical: 0,
    },
    durationButton: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      marginRight: Spacing.xs,
    },
    durationText: {
      fontSize: FontSize.sm,
      color: c.text.secondary,
      fontVariant: ['tabular-nums'],
    },
    durationTextDimmed: {
      color: c.text.tertiary,
    },
    deleteButton: {
      paddingLeft: Spacing.sm,
    },
    deleteIcon: {
      fontSize: 14,
    },
    addExerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    addIcon: {
      fontSize: 20,
      color: c.text.tertiary,
      lineHeight: 24,
    },
  });
}

export function SectionGroup({ name, canDelete, onRename, onDelete, onAddExercise, totalDuration, onSetTotalDuration, children }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const editTotalDuration = () => {
    if (!onSetTotalDuration || totalDuration === 0) return;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Set Section Duration',
        'Enter total time in minutes (e.g. 5 or 2.5)',
        (text) => {
          const mins = parseFloat(text);
          if (!isNaN(mins) && mins > 0) onSetTotalDuration(Math.round(mins * 60));
        },
        'plain-text',
        String(+(totalDuration / 60).toFixed(2)),
      );
    }
  };

  const hasExercises = totalDuration > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={onRename}
          placeholder="Section name"
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          maxLength={60}
        />
        <TouchableOpacity
          onPress={editTotalDuration}
          hitSlop={8}
          style={styles.durationButton}
          disabled={!hasExercises}
        >
          <Text style={[styles.durationText, !hasExercises && styles.durationTextDimmed]}>
            {formatSeconds(totalDuration)}
          </Text>
        </TouchableOpacity>
        {canDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={10} style={styles.deleteButton}>
            <Text color="tertiary" style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {children}

      <TouchableOpacity onPress={onAddExercise} style={styles.addExerciseRow} activeOpacity={0.7}>
        <Text style={styles.addIcon}>+</Text>
        <Text variant="body" color="secondary">Add exercise</Text>
      </TouchableOpacity>
    </View>
  );
}
