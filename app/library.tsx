import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { TagChips } from '@/components/TagChips';
import { TagPicker } from '@/components/TagPicker';
import { TabBar } from '@/components/TabBar';
import { Colors, Spacing } from '@/constants/theme';
import {
  getAllLibraryExercises,
  createLibraryExercise,
  updateLibraryExercise,
  deleteLibraryExercise,
  setLibraryExerciseTags,
  getLinkedCount,
  type LibraryExerciseWithTags,
} from '@/lib/db/libraryExercises';
import type { ExerciseTag } from '@/lib/db/tags';

const CAT_COLORS = [
  '#16a34a', '#15803d', '#4d7c0f', '#065f46',
  '#047857', '#166534', '#14532d', '#1a5c2a',
];

function getCatColor(name: string, allNames: string[]) {
  const idx = allNames.indexOf(name);
  return CAT_COLORS[Math.max(0, idx) % CAT_COLORS.length];
}

export default function LibraryScreen() {
  const { top } = useSafeAreaInsets();
  const [exercises, setExercises] = useState<LibraryExerciseWithTags[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilterTags, setActiveFilterTags] = useState<ExerciseTag[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newNameText, setNewNameText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');
  const [tagPickerExerciseId, setTagPickerExerciseId] = useState<string | null>(null);

  const load = useCallback(() => {
    setExercises(getAllLibraryExercises());
  }, []);

  useEffect(() => { load(); }, [load]);

  const allTagPills = useMemo(() => {
    const seen = new Map<string, ExerciseTag>();
    for (const ex of exercises) {
      for (const t of ex.tags) seen.set(t.tagValueId, t);
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [exercises]);

  const allGroupNames = useMemo(() => {
    const names = new Set<string>();
    for (const ex of exercises) {
      if (ex.tags.length > 0) names.add(ex.tags[0].categoryName ?? ex.tags[0].label);
    }
    names.add('Untagged');
    return [...names];
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase());
      const matchTag = activeFilterTags.length === 0 ||
        ex.tags.some((t) => activeFilterTags.some((f) => f.tagValueId === t.tagValueId));
      return matchSearch && matchTag;
    });
  }, [exercises, search, activeFilterTags]);

  const grouped = useMemo(() => {
    const map = new Map<string, LibraryExerciseWithTags[]>();
    for (const ex of filtered) {
      const key = ex.tags.length > 0 ? (ex.tags[0].categoryName ?? ex.tags[0].label) : 'Untagged';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ex);
    }
    return map;
  }, [filtered]);

  const toggleTag = (tag: ExerciseTag) => {
    setActiveFilterTags((prev) =>
      prev.some((t) => t.tagValueId === tag.tagValueId)
        ? prev.filter((t) => t.tagValueId !== tag.tagValueId)
        : [...prev, tag]
    );
  };

  const handleAdd = () => {
    const name = newNameText.trim();
    if (!name) return;
    createLibraryExercise(name);
    setNewNameText('');
    setAddingNew(false);
    load();
  };

  const handleRename = (ex: LibraryExerciseWithTags) => {
    const name = editNameText.trim();
    if (name && name !== ex.name) updateLibraryExercise(ex.id, name);
    setEditingId(null);
    load();
  };

  const handleDelete = (ex: LibraryExerciseWithTags) => {
    const count = getLinkedCount(ex.id);
    const detail = count > 0
      ? `This will unlink "${ex.name}" from ${count} sequence${count === 1 ? '' : 's'}. Names and tags will be preserved.`
      : `"${ex.name}" is not used in any sequences.`;
    Alert.alert(`Delete "${ex.name}"?`, detail, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteLibraryExercise(ex.id); load(); } },
    ]);
  };

  const tagPickerExercise = tagPickerExerciseId
    ? exercises.find((e) => e.id === tagPickerExerciseId) ?? null
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.wordmark}>library</Text>
              <Text style={styles.countLabel}>
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddingNew(true)}
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
            placeholder="Search exercises…"
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

      {/* Exercise list */}
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {addingNew && (
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newNameText}
              onChangeText={setNewNameText}
              placeholder="Exercise name"
              placeholderTextColor={Colors.text.tertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity onPress={handleAdd} style={styles.actionBtn} hitSlop={8}>
              <Text style={styles.actionAdd}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAddingNew(false); setNewNameText(''); }} hitSlop={8}>
              <Text style={styles.actionCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {grouped.size === 0 && !addingNew ? (
          <View style={styles.empty}>
            <Text variant="body" color="tertiary">
              {search || activeFilterTags.length > 0 ? 'No exercises match.' : 'No exercises yet.'}
            </Text>
          </View>
        ) : (
          Array.from(grouped.entries()).map(([groupName, exs]) => {
            const color = groupName === 'Untagged'
              ? Colors.text.tertiary
              : getCatColor(groupName, allGroupNames);
            return (
              <View key={groupName} style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: color }]} />
                  <Text style={[styles.groupLabel, { color: Colors.text.tertiary }]}>
                    {groupName.toUpperCase()}
                  </Text>
                  <View style={styles.groupLine} />
                  <Text style={styles.groupCount}>{exs.length}</Text>
                </View>

                {exs.map((ex) => (
                  <ExerciseItem
                    key={ex.id}
                    ex={ex}
                    accentColor={color}
                    isEditing={editingId === ex.id}
                    editText={editNameText}
                    onEditText={setEditNameText}
                    onStartEdit={() => { setEditingId(ex.id); setEditNameText(ex.name); }}
                    onFinishEdit={() => handleRename(ex)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => handleDelete(ex)}
                    onEditTags={() => setTagPickerExerciseId(ex.id)}
                  />
                ))}
              </View>
            );
          })
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <TabBar />

      {tagPickerExercise && (
        <TagPicker
          selectedTagValueIds={tagPickerExercise.tags.map((t) => t.tagValueId)}
          onConfirm={(ids) => {
            setLibraryExerciseTags(tagPickerExercise.id, ids);
            setTagPickerExerciseId(null);
            load();
          }}
          onClose={() => setTagPickerExerciseId(null)}
        />
      )}
    </View>
  );
}

interface ExerciseItemProps {
  ex: LibraryExerciseWithTags;
  accentColor: string;
  isEditing: boolean;
  editText: string;
  onEditText: (t: string) => void;
  onStartEdit: () => void;
  onFinishEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditTags: () => void;
}

function ExerciseItem({
  ex, accentColor, isEditing, editText, onEditText,
  onStartEdit, onFinishEdit, onCancelEdit, onDelete, onEditTags,
}: ExerciseItemProps) {
  return (
    <View style={styles.exCard}>
      <View style={[styles.exAccentBar, { backgroundColor: accentColor }]} />
      <View style={styles.exBody}>
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={onEditText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onFinishEdit}
              onBlur={onFinishEdit}
            />
            <TouchableOpacity onPress={onFinishEdit} hitSlop={8}>
              <Text style={styles.actionAdd}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEdit} hitSlop={8}>
              <Text style={styles.actionCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exNameRow}>
            <Text style={styles.exName}>{ex.name}</Text>
            <TouchableOpacity onPress={onStartEdit} hitSlop={8} style={styles.iconBtn}>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.iconBtn}>
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.exTagsRow}>
          {ex.tags.length > 0 && <TagChips tags={ex.tags} />}
          <TouchableOpacity onPress={onEditTags} hitSlop={8}>
            <Text style={styles.editTagsLabel}>
              {ex.tags.length > 0 ? 'Edit tags' : '+ Add tags'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    height: 50,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  wordmark: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2.5,
    color: Colors.text.primary,
    lineHeight: 45,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 14, paddingHorizontal: 14 },
  empty: { paddingTop: 80, alignItems: 'center' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    padding: 0,
  },
  actionAdd: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  actionCancel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  group: { marginBottom: 22 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  groupCount: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  exCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
    overflow: 'hidden',
  },
  exAccentBar: {
    width: 2,
    opacity: 0.6,
  },
  exBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  exNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  iconBtn: { padding: 4 },
  editIcon: { fontSize: 14, color: Colors.text.secondary },
  deleteIcon: { fontSize: 12, color: Colors.text.tertiary },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMid,
    paddingVertical: 2,
    padding: 0,
  },
  exTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  editTagsLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
});
