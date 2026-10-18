import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { useState, useMemo } from 'react';
import { Text } from './ui/Text';
import { Sheet } from './ui/Sheet';
import { TagChips } from './TagChips';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import { getAllLibraryExercises, type LibraryExerciseWithTags } from '@/lib/db/libraryExercises';

interface Props {
  onSelect: (exercise: LibraryExerciseWithTags) => void;
  onCreateNew: (name: string) => void;
  onClose: () => void;
}

function makeStyles(c: typeof Colors, textScale: number) {
  return StyleSheet.create({
    searchRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    searchInput: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Math.round(FontSize.base * textScale),
      color: c.text.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.xs,
    },
    resultRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    resultBody: {
      gap: 4,
    },
    resultTags: {},
    createRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    createIcon: {
      fontSize: Math.round(18 * textScale),
      color: c.text.tertiary,
      lineHeight: 22,
    },
  });
}

export function ExerciseSearchSheet({ onSelect, onCreateNew, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);
  const [query, setQuery] = useState('');
  const [library] = useState(getAllLibraryExercises);

  const results = useMemo(() => {
    if (!query.trim()) return library;
    const q = query.trim().toLowerCase();
    return library.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, library]);

  const hasExactMatch = results.some((e) => e.name.toLowerCase() === query.trim().toLowerCase());
  const showCreateRow = query.trim().length > 0 && !hasExactMatch;

  return (
    <Sheet title="Add Exercise" onClose={onClose} left={{ label: 'Cancel', onPress: onClose }} avoidKeyboard>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search or type a name…"
          accessibilityLabel="Search exercises"
          placeholderTextColor={colors.text.tertiary}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim().length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color="tertiary">
                Your exercise library is empty.
              </Text>
              <Text variant="caption" color="tertiary">
                Type a name below to create one.
              </Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultRow}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={styles.resultBody}>
              <Text variant="body">{item.name}</Text>
              {item.tags.length > 0 && <TagChips tags={item.tags} style={styles.resultTags} />}
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          showCreateRow ? (
            <TouchableOpacity
              style={styles.createRow}
              onPress={() => onCreateNew(query.trim())}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Create ${query.trim()} as a new exercise`}
            >
              <Text style={styles.createIcon}>+</Text>
              <Text variant="body" color="secondary">
                Create &ldquo;{query.trim()}&rdquo; as new exercise
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
    </Sheet>
  );
}
