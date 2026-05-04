import {
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { SequenceCard } from '@/components/SequenceCard';
import { TabBar } from '@/components/TabBar';
import { Colors, Spacing } from '@/constants/theme';
import { useSequences } from '@/lib/hooks/useSequences';
import { deleteSequence, duplicateSequence } from '@/lib/db/sequences';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExerciseTag } from '@/lib/db/tags';

export default function SequencesScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { sequences, loading, refresh } = useSequences();
  const [search, setSearch] = useState('');
  const [activeFilterTags, setActiveFilterTags] = useState<ExerciseTag[]>([]);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const allTagPills = useMemo(() => {
    const seen = new Map<string, ExerciseTag>();
    for (const s of sequences) {
      for (const t of s.tags) seen.set(t.tagValueId, t);
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [sequences]);

  const filteredSequences = useMemo(() => {
    let result = sequences;
    if (activeFilterTags.length > 0) {
      result = result.filter((s) =>
        s.tags.some((t) => activeFilterTags.some((f) => f.tagValueId === t.tagValueId))
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [sequences, activeFilterTags, search]);

  const toggleTag = (tag: ExerciseTag) => {
    setActiveFilterTags((prev) =>
      prev.some((t) => t.tagValueId === tag.tagValueId)
        ? prev.filter((t) => t.tagValueId !== tag.tagValueId)
        : [...prev, tag]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.wordmark}>cue</Text>
              <Text style={styles.countLabel}>
                {sequences.length} sequence{sequences.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/builder')}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search sequences…"
            placeholderTextColor={Colors.text.tertiary}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {allTagPills.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
            keyboardShouldPersistTaps="handled"
          >
            {allTagPills.map((tag) => {
              const active = activeFilterTags.some((t) => t.tagValueId === tag.tagValueId);
              return (
                <TouchableOpacity
                  key={tag.tagValueId}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* List */}
      <View style={styles.listWrapper}>
        {loading ? null : filteredSequences.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color="tertiary">
              {search || activeFilterTags.length > 0 ? 'No sequences match.' : 'No sequences yet.'}
            </Text>
            {!search && activeFilterTags.length === 0 && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/builder')}
                activeOpacity={0.8}
              >
                <Text variant="label" color="inverse">New Sequence</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={filteredSequences}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SequenceCard
                sequence={item}
                onPress={() => router.push(`/sequence/${item.id}`)}
                onPlay={() => router.push(`/sequence/${item.id}/timer`)}
                onDuplicate={() => { duplicateSequence(item.id); refresh(); }}
                onDelete={() => { deleteSequence(item.id); refresh(); }}
              />
            )}
          />
        )}
      </View>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  wordmarkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentBar: {
    width: 3,
    height: 62,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  wordmark: {
    fontSize: 66,
    fontWeight: '800',
    letterSpacing: -3.5,
    color: Colors.text.primary,
    lineHeight: 57,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 7,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.accent,
    lineHeight: 26,
    marginTop: -1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.text.tertiary,
    lineHeight: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    padding: 0,
  },
  searchClear: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: 4,
  },
  pill: {
    backgroundColor: Colors.pill.bg,
    borderWidth: 1,
    borderColor: Colors.pill.border,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 6,
    paddingLeft: 11,
    paddingRight: 13,
  },
  pillActive: {
    backgroundColor: Colors.pill.activeBg,
    borderColor: Colors.accent,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.pill.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillTextActive: {
    color: Colors.pill.activeText,
  },
  listWrapper: {
    flex: 1,
  },
  list: {
    padding: 14,
    paddingBottom: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.fill.primary,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
});
