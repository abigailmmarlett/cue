import { View, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { SequenceCard } from '@/components/SequenceCard';
import { TagPicker } from '@/components/TagPicker';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useSequences } from '@/lib/hooks/useSequences';
import { deleteSequence, duplicateSequence } from '@/lib/db/sequences';
import type { ExerciseTag } from '@/lib/db/tags';

interface FilterBarProps {
  activeFilterTags: ExerciseTag[];
  onRemoveTag: (tagValueId: string) => void;
  onOpenPicker: () => void;
  onClear: () => void;
}

function FilterBar({ activeFilterTags, onRemoveTag, onOpenPicker, onClear }: FilterBarProps) {
  if (activeFilterTags.length === 0) {
    return (
      <View style={styles.filterBar}>
        <TouchableOpacity onPress={onOpenPicker} style={styles.filterPill} activeOpacity={0.7}>
          <Text style={styles.filterIcon}>🏷</Text>
          <Text variant="caption" color="secondary">Filter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activeFilterRow}
        keyboardShouldPersistTaps="handled"
      >
        {activeFilterTags.map((tag) => (
          <TouchableOpacity
            key={tag.tagValueId}
            style={styles.filterChip}
            onPress={() => onRemoveTag(tag.tagValueId)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipLabel}>{tag.label}</Text>
            <Text style={styles.filterChipRemove}>✕</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onOpenPicker} style={styles.filterAddChip} activeOpacity={0.7}>
          <Text style={styles.filterAddIcon}>+</Text>
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity onPress={onClear} style={styles.clearButton} hitSlop={8}>
        <Text variant="caption" color="secondary">Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const { sequences, loading, refresh } = useSequences();
  const flatListRef = useRef<FlatList>(null);
  const prevLengthRef = useRef(0);

  const [activeFilterTags, setActiveFilterTags] = useState<ExerciseTag[]>([]);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const filteredSequences = activeFilterTags.length === 0
    ? sequences
    : sequences.filter((s) =>
        s.tags.some((t) => activeFilterTags.some((f) => f.tagValueId === t.tagValueId))
      );

  const handleFilterConfirm = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      setActiveFilterTags([]);
      setShowFilterPicker(false);
      return;
    }
    const tagMap = new Map<string, ExerciseTag>();
    for (const s of sequences) {
      for (const t of s.tags) tagMap.set(t.tagValueId, t);
    }
    setActiveFilterTags(ids.flatMap((id) => tagMap.has(id) ? [tagMap.get(id)!] : []));
    setShowFilterPicker(false);
  }, [sequences]);

  useEffect(() => {
    if (sequences.length > prevLengthRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
    prevLengthRef.current = sequences.length;
  }, [sequences.length]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => router.push('/tags')}
            hitSlop={8}
            style={styles.tagsButton}
          >
            <Text style={styles.tagsIcon}>🏷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/builder')}
            hitSlop={8}
            style={styles.addButton}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, router]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading) {
    return <View style={styles.empty} />;
  }

  if (sequences.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="heading" style={styles.emptyTitle}>
          No sequences yet
        </Text>
        <Text variant="body" color="secondary" style={styles.emptySubtitle}>
          Create your first workout sequence to get started.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/builder')}
          activeOpacity={0.8}
        >
          <Text variant="label" color="inverse">
            New Sequence
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FilterBar
        activeFilterTags={activeFilterTags}
        onRemoveTag={(id) => setActiveFilterTags((prev) => prev.filter((t) => t.tagValueId !== id))}
        onOpenPicker={() => setShowFilterPicker(true)}
        onClear={() => setActiveFilterTags([])}
      />

      {filteredSequences.length === 0 ? (
        <View style={styles.noResults}>
          <Text variant="body" color="tertiary">No sequences match these filters.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredSequences}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: Spacing.md + bottom }]}
          renderItem={({ item }) => (
            <SequenceCard
              sequence={item}
              onPress={() => router.push(`/sequence/${item.id}`)}
              onDuplicate={() => {
                duplicateSequence(item.id);
                refresh();
              }}
              onDelete={() => {
                deleteSequence(item.id);
                refresh();
              }}
            />
          )}
        />
      )}

      {showFilterPicker && (
        <TagPicker
          selectedTagValueIds={activeFilterTags.map((t) => t.tagValueId)}
          onConfirm={handleFilterConfirm}
          onClose={() => setShowFilterPicker(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    padding: Spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  tagsButton: {},
  tagsIcon: {
    fontSize: 20,
    lineHeight: 26,
  },
  addButton: {},
  addIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.text.primary,
    lineHeight: 32,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filterIcon: {
    fontSize: 13,
    lineHeight: 18,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.fill.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  filterChipLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.text.inverse,
  },
  filterChipRemove: {
    fontSize: 10,
    color: Colors.text.inverse,
  },
  filterAddChip: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterAddIcon: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  createButton: {
    backgroundColor: Colors.fill.primary,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
});
