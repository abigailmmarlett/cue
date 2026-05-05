import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './ui/Text';
import { useTheme } from '@/lib/contexts/ThemeContext';
import type { ExerciseTag } from '@/lib/db/tags';

interface Props {
  tags: ExerciseTag[];
  style?: ViewStyle;
}

export function TagChips({ tags, style }: Props) {
  const { colors } = useTheme();
  if (tags.length === 0) return null;
  return (
    <View style={[styles.row, style]}>
      {tags.map((tag) => (
        <View
          key={tag.tagValueId}
          style={[styles.chip, { backgroundColor: colors.pill.bg, borderColor: colors.pill.border }]}
        >
          <Text style={[styles.label, { color: colors.pill.text }]}>{tag.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    borderWidth: 1,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 2,
    paddingLeft: 6,
    paddingRight: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
