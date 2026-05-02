import { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { DraggableList } from '@/components/DraggableList';
import { ExerciseRow, type LocalExercise } from '@/components/ExerciseRow';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { getSequenceById, updateSequence } from '@/lib/db/sequences';
import { getExercisesBySequenceId, deleteExercise, createExercise } from '@/lib/db/exercises';
import { generateId } from '@/lib/utils/id';
import { emitSequenceChange } from '@/lib/sequenceEvents';

export default function EditSequenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seq = getSequenceById(id);
    if (!seq) { router.back(); return; }
    setName(seq.name);
    const exs = getExercisesBySequenceId(id);
    setExercises(
      exs.map((e) => ({ id: e.id, name: e.name, duration: e.duration, notes: e.notes }))
    );
    setLoading(false);
  }, [id, router]);

  const addExercise = useCallback(() => {
    setExercises((prev) => [
      ...prev,
      { id: generateId(), name: '', duration: 30, notes: null },
    ]);
  }, []);

  const updateExercise = useCallback((exId: string, fields: Partial<LocalExercise>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exId ? { ...ex, ...fields } : ex))
    );
  }, []);

  const removeExercise = useCallback((exId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exId));
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    const trimmedName = name.trim() || 'Untitled Sequence';
    updateSequence(id, trimmedName);

    // Replace all exercises with current state
    const existing = getExercisesBySequenceId(id);
    existing.forEach((e) => deleteExercise(e.id));
    exercises.forEach((ex) => {
      createExercise(id, ex.name.trim() || 'Exercise', ex.duration, ex.notes ?? undefined);
    });

    emitSequenceChange();
    router.back();
  }, [id, name, exercises, router]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  const canSave = exercises.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Sequence name"
          placeholderTextColor={Colors.text.tertiary}
          returnKeyType="done"
          maxLength={80}
        />

        <Divider style={styles.divider} />

        {exercises.length > 0 && (
          <DraggableList
            data={exercises}
            renderItem={(item) => (
              <ExerciseRow
                exercise={item}
                onNameChange={(n) => updateExercise(item.id, { name: n })}
                onDurationChange={(d) => updateExercise(item.id, { duration: d })}
                onDelete={() => removeExercise(item.id)}
              />
            )}
            onReorder={handleReorder}
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
          />
        )}

        {exercises.length === 0 && (
          <View style={styles.emptyExercises}>
            <Text variant="body" color="tertiary" style={styles.emptyText}>
              Add exercises below
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={addExercise} style={styles.addRow} activeOpacity={0.7}>
          <Text style={styles.addIcon}>+</Text>
          <Text variant="body" color="secondary">
            Add exercise
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.8}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        >
          <Text variant="label" color="inverse">
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing.xl },
  nameInput: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    letterSpacing: -0.5,
  },
  divider: { marginBottom: Spacing.xs },
  emptyExercises: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  addIcon: {
    fontSize: 22,
    color: Colors.text.secondary,
    lineHeight: 26,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveButton: {
    backgroundColor: Colors.fill.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.35 },
});
