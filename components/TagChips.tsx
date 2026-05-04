import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './ui/Text';
import { Colors } from '@/constants/theme';
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
          <Text style={styles.label}>{tag.label}</Text>
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
    backgroundColor: Colors.pill.bg,
    borderWidth: 1,
    borderColor: Colors.pill.border,
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
    color: Colors.pill.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
