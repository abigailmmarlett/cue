import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { TagChips } from '@/components/TagChips';
import { TagPicker } from '@/components/TagPicker';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import {
  getAllLibraryExercises,
  createLibraryExercise,
  updateLibraryExercise,
  deleteLibraryExercise,
  setLibraryExerciseTags,
  getLinkedCount,
  type LibraryExerciseWithTags,
} from '@/lib/db/libraryExercises';

export default function ExerciseLibraryScreen() {
  const [exercises, setExercises] = useState<LibraryExerciseWithTags[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newNameText, setNewNameText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');
  const [tagPickerExerciseId, setTagPickerExerciseId] = useState<string | null>(null);

  const load = useCallback(() => {
    setExercises(getAllLibraryExercises());
  }, []);

  useEffect(() => { load(); }, [load]);

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
      ? `This will unlink "${ex.name}" from ${count} sequence${count === 1 ? '' : 's'}. Their names and current tags will be preserved.`
      : `"${ex.name}" is not used in any sequences.`;
    Alert.alert(`Delete "${ex.name}"?`, detail, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => { deleteLibraryExercise(ex.id); load(); },
      },
    ]);
  };

  const tagPickerExercise = tagPickerExerciseId
    ? exercises.find((e) => e.id === tagPickerExerciseId) ?? null
    : null;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      {exercises.map((ex) => (
        <View key={ex.id} style={styles.row}>
          {editingId === ex.id ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={editNameText}
                onChangeText={setEditNameText}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => handleRename(ex)}
                onBlur={() => handleRename(ex)}
              />
              <TouchableOpacity onPress={() => handleRename(ex)} style={styles.actionBtn}>
                <Text variant="label">Done</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingId(null)} style={styles.actionBtn}>
                <Text variant="label" color="tertiary">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text variant="body" style={styles.exerciseName}>{ex.name}</Text>
              <TouchableOpacity
                onPress={() => { setEditingId(ex.id); setEditNameText(ex.name); }}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Text style={styles.editIcon}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(ex)} hitSlop={8} style={styles.actionBtn}>
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.tagsRow}>
            {ex.tags.length > 0 && <TagChips tags={ex.tags} style={styles.tagChips} />}
            <TouchableOpacity
              onPress={() => setTagPickerExerciseId(ex.id)}
              hitSlop={8}
              style={styles.editTagsBtn}
            >
              <Text variant="caption" color="tertiary">
                {ex.tags.length > 0 ? 'Edit tags' : '+ Add tags'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Add new */}
      <View style={styles.addSection}>
        {addingNew ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={newNameText}
              onChangeText={setNewNameText}
              placeholder="Exercise name"
              placeholderTextColor={Colors.text.tertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity onPress={handleAdd} style={styles.actionBtn}>
              <Text variant="label">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAddingNew(false); setNewNameText(''); }}
              style={styles.actionBtn}
            >
              <Text variant="label" color="tertiary">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addRow} onPress={() => setAddingNew(true)} activeOpacity={0.7}>
            <Text style={styles.addIcon}>+</Text>
            <Text variant="body" color="secondary">New exercise</Text>
          </TouchableOpacity>
        )}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: Spacing.xl },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: { flex: 1 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderStrong,
    paddingVertical: 2,
  },
  actionBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  editIcon: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  deleteIcon: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tagChips: { flex: 1 },
  editTagsBtn: {},
  addSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  addIcon: {
    fontSize: 18,
    color: Colors.text.tertiary,
    lineHeight: 22,
  },
});
