import {
  View,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Text } from './ui/Text';
import { TagChips } from './TagChips';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import {
  getAllLibraryExercises,
  type LibraryExerciseWithTags,
} from '@/lib/db/libraryExercises';

interface Props {
  onSelect: (exercise: LibraryExerciseWithTags) => void;
  onCreateNew: (name: string) => void;
  onClose: () => void;
}

export function ExerciseSearchSheet({ onSelect, onCreateNew, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState<LibraryExerciseWithTags[]>([]);

  useEffect(() => {
    setLibrary(getAllLibraryExercises());
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return library;
    const q = query.trim().toLowerCase();
    return library.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, library]);

  const hasExactMatch = results.some(
    (e) => e.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showCreateRow = query.trim().length > 0 && !hasExactMatch;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text variant="label" color="secondary">Cancel</Text>
            </TouchableOpacity>
            <Text variant="label" style={styles.headerTitle}>Add Exercise</Text>
            <View style={styles.cancelBtn} />
          </View>

          {/* Search input */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search or type a name…"
              placeholderTextColor={Colors.text.tertiary}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Results */}
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
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.resultBody}>
                  <Text variant="body">{item.name}</Text>
                  {item.tags.length > 0 && (
                    <TagChips tags={item.tags} style={styles.resultTags} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              showCreateRow ? (
                <TouchableOpacity
                  style={styles.createRow}
                  onPress={() => onCreateNew(query.trim())}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createIcon}>+</Text>
                  <Text variant="body" color="secondary">
                    Create "{query.trim()}" as new exercise
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  cancelBtn: { minWidth: 60 },
  headerTitle: { textAlign: 'center' },
  searchRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.text.primary,
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
    borderBottomColor: Colors.border,
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
    borderTopColor: Colors.border,
  },
  createIcon: {
    fontSize: 18,
    color: Colors.text.tertiary,
    lineHeight: 22,
  },
});
