import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SequenceCard } from '@/components/SequenceCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TabBar } from '@/components/TabBar';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSequences } from '@/lib/hooks/useSequences';
import { deleteSequence, duplicateSequence } from '@/lib/db/sequences';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExerciseTag } from '@/lib/db/tags';

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
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
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.xl,
      borderRadius: 12,
      marginTop: Spacing.sm,
    },
  });
}

export default function SequencesScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { colors } = useTheme();
  const { sequences, loading, refresh } = useSequences();
  const [search, setSearch] = useState('');
  const [activeFilterTags, setActiveFilterTags] = useState<ExerciseTag[]>([]);
  const listRef = useRef<FlatList>(null);
  const styles = makeStyles(colors);

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
      <ScreenHeader
        title="cue"
        countLabel={`${sequences.length} sequence${sequences.length !== 1 ? 's' : ''}`}
        safeTop={top}
        onAdd={() => router.push('/builder')}
        search={search}
        onSearchChange={setSearch}
        tagPills={allTagPills}
        activeTagIds={activeFilterTags.map((t) => t.tagValueId)}
        onTagToggle={toggleTag}
      />

      <View style={styles.listWrapper}>
        {loading ? null : filteredSequences.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color="tertiary">
              {search || activeFilterTags.length > 0 ? 'No sequences match.' : 'No sequences yet.'}
            </Text>
            {!search && activeFilterTags.length === 0 && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.fill.primary }]}
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
