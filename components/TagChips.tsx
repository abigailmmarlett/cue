import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import type { ExerciseTag } from '@/lib/db/tags';

interface Props {
  tags: ExerciseTag[];
  style?: ViewStyle;
}

export function TagChips({ tags, style }: Props) {
  if (tags.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {tags.map((tag) => (
        <View key={tag.tagValueId} style={styles.chip}>
          <Text variant="caption" color="secondary" style={styles.category}>
            {tag.categoryName}
          </Text>
          <Text variant="caption" style={styles.label}>
            {tag.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  category: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.text.primary,
  },
});
