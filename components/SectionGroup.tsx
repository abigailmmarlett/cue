import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface Props {
  name: string;
  canDelete: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddExercise: () => void;
  children: React.ReactNode;
}

export function SectionGroup({ name, canDelete, onRename, onDelete, onAddExercise, children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={onRename}
          placeholder="Section name"
          placeholderTextColor={Colors.text.tertiary}
          returnKeyType="done"
          maxLength={60}
        />
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

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
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
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingVertical: 0,
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
    color: Colors.text.tertiary,
    lineHeight: 24,
  },
});
