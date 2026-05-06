import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { TagChips } from '@/components/TagChips';
import { TagPicker } from '@/components/TagPicker';
import { LoadEditor } from '@/components/LoadEditor';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TabBar } from '@/components/TabBar';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import {
  getAllLibraryExercises,
  createLibraryExercise,
  updateLibraryExercise,
  updateLibraryExerciseLoad,
  updateLibraryExerciseBilateral,
  deleteLibraryExercise,
  setLibraryExerciseTags,
  getLinkedCount,
  type LibraryExerciseWithTags,
} from '@/lib/db/libraryExercises';
import { getAllLoadIcons, parseLoad, serializeLoad, type LoadIcon } from '@/lib/db/loadIcons';
import type { ExerciseTag } from '@/lib/db/tags';

function buildCatColors(accent: string, deep: string): string[] {
  return [
    accent,
    deep,
    `${accent}dd`,
    `${deep}dd`,
    `${accent}bb`,
    `${deep}bb`,
    `${accent}99`,
    `${deep}99`,
  ];
}

function getCatColor(name: string, allNames: string[], catColors: string[]) {
  const idx = allNames.indexOf(name);
  return catColors[Math.max(0, idx) % catColors.length];
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 14, paddingHorizontal: 14 },
    empty: { paddingTop: 80, alignItems: 'center' },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surfaceSolid,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 13,
      paddingVertical: 12,
      marginBottom: 16,
    },
    addInput: {
      flex: 1,
      fontSize: 14,
      color: c.text.primary,
      padding: 0,
    },
    actionBtn: {},
    actionAdd: {
      fontSize: 13,
      fontWeight: '600',
    },
    actionCancel: {
      fontSize: 13,
      fontWeight: '500',
      color: c.text.tertiary,
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
      backgroundColor: c.border,
    },
    groupCount: {
      fontSize: 10,
      color: c.text.tertiary,
      fontWeight: '500',
    },
    exCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.text.primary,
      letterSpacing: -0.2,
    },
    iconBtn: { padding: 4 },
    editIcon: { fontSize: 17, color: c.text.secondary },
    deleteIcon: { fontSize: 14, color: c.text.tertiary },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    editInput: {
      flex: 1,
      fontSize: 14,
      color: c.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: c.borderMid,
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
      color: c.text.tertiary,
    },
  });
}

export default function LibraryScreen() {
  const { top } = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const catColors = useMemo(
    () => buildCatColors(colors.accent, colors.accentDeep),
    [colors.accent, colors.accentDeep]
  );
  const [exercises, setExercises] = useState<LibraryExerciseWithTags[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilterTags, setActiveFilterTags] = useState<ExerciseTag[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newNameText, setNewNameText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');
  const [tagPickerExerciseId, setTagPickerExerciseId] = useState<string | null>(null);
  const [editLoadExerciseId, setEditLoadExerciseId] = useState<string | null>(null);
  const [allLoadIcons] = useState<LoadIcon[]>(() => getAllLoadIcons());

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

  const handleToggleBilateral = (ex: LibraryExerciseWithTags) => {
    updateLibraryExerciseBilateral(ex.id, !ex.is_bilateral);
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

  const editLoadTarget = editLoadExerciseId
    ? exercises.find((e) => e.id === editLoadExerciseId) ?? null
    : null;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScreenHeader
          title="library"
          countLabel={`${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`}
          safeTop={top}
          onAdd={() => setAddingNew(true)}
          search={search}
          onSearchChange={setSearch}
          tagPills={allTagPills}
          activeTagIds={activeFilterTags.map((t) => t.tagValueId)}
          onTagToggle={toggleTag}
        />

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
              placeholderTextColor={colors.text.tertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity onPress={handleAdd} style={styles.actionBtn} hitSlop={8}>
              <Text style={[styles.actionAdd, { color: colors.accent }]}>Add</Text>
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
              ? colors.text.tertiary
              : getCatColor(groupName, allGroupNames, catColors);
            return (
              <View key={groupName} style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: color }]} />
                  <Text style={[styles.groupLabel, { color: colors.text.tertiary }]}>
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
                    onEditLoad={allLoadIcons.length > 0 ? () => setEditLoadExerciseId(ex.id) : undefined}
                    onToggleBilateral={() => handleToggleBilateral(ex)}
                  />
                ))}
              </View>
            );
          })
        )}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>

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

      {editLoadTarget && (
        <LoadEditor
          visible
          loadModified={parseLoad(editLoadTarget.load_modified) ?? []}
          loadBase={parseLoad(editLoadTarget.load_base) ?? []}
          loadAmplified={parseLoad(editLoadTarget.load_amplified) ?? []}
          allIcons={allLoadIcons}
          onSave={(modified, base, amplified) => {
            updateLibraryExerciseLoad(
              editLoadTarget.id,
              serializeLoad(modified.length > 0 ? modified : null),
              serializeLoad(base.length > 0 ? base : null),
              serializeLoad(amplified.length > 0 ? amplified : null),
            );
            setEditLoadExerciseId(null);
            load();
          }}
          onClose={() => setEditLoadExerciseId(null)}
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
  onEditLoad?: () => void;
  onToggleBilateral: () => void;
}

function ExerciseItem({
  ex, accentColor, isEditing, editText, onEditText,
  onStartEdit, onFinishEdit, onCancelEdit, onDelete, onEditTags, onEditLoad, onToggleBilateral,
}: ExerciseItemProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const hasLoad = !!(ex.load_modified || ex.load_base || ex.load_amplified);
  const isBilateral = !!ex.is_bilateral;
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
              <Text style={[styles.actionAdd, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEdit} hitSlop={8}>
              <Text style={styles.actionCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exNameRow}>
            <Text style={styles.exName}>{ex.name}</Text>
            <TouchableOpacity onPress={onToggleBilateral} hitSlop={8} style={styles.iconBtn}>
              <Text style={[styles.editIcon, { color: isBilateral ? colors.accent : colors.text.tertiary }]}>⇌</Text>
            </TouchableOpacity>
            {onEditLoad && (
              <TouchableOpacity onPress={onEditLoad} hitSlop={8} style={styles.iconBtn}>
                <Text style={[styles.editIcon, { color: hasLoad ? colors.text.secondary : colors.text.tertiary }]}>⊙</Text>
              </TouchableOpacity>
            )}
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
