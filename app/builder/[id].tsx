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
import { SectionGroup } from '@/components/SectionGroup';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { getSequenceById, updateSequence } from '@/lib/db/sequences';
import { getExercisesBySequenceId, upsertExercise, deleteExercise } from '@/lib/db/exercises';
import { getSectionsBySequenceId, upsertSection, deleteSection } from '@/lib/db/sections';
import { generateId } from '@/lib/utils/id';
import { emitSequenceChange } from '@/lib/sequenceEvents';

interface LocalSection {
  id: string;
  name: string;
  exercises: LocalExercise[];
}

export default function EditSequenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [sections, setSections] = useState<LocalSection[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seq = getSequenceById(id);
    if (!seq) { router.back(); return; }
    setName(seq.name);

    const dbSections = getSectionsBySequenceId(id);
    const allExercises = getExercisesBySequenceId(id);

    setSections(
      dbSections.map((s) => ({
        id: s.id,
        name: s.name,
        exercises: allExercises
          .filter((e) => e.section_id === s.id)
          .map((e) => ({ id: e.id, name: e.name, duration: e.duration, notes: e.notes })),
      }))
    );
    setLoading(false);
  }, [id, router]);

  const addSection = useCallback(() => {
    setSections((prev) => [...prev, { id: generateId(), name: '', exercises: [] }]);
  }, []);

  const renameSection = useCallback((sectionId: string, newName: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name: newName } : s))
    );
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const addExercise = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, exercises: [...s.exercises, { id: generateId(), name: '', duration: 30, notes: null }] }
          : s
      )
    );
  }, []);

  const updateExercise = useCallback((sectionId: string, exId: string, fields: Partial<LocalExercise>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, exercises: s.exercises.map((ex) => (ex.id === exId ? { ...ex, ...fields } : ex)) }
          : s
      )
    );
  }, []);

  const removeExercise = useCallback((sectionId: string, exId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, exercises: s.exercises.filter((ex) => ex.id !== exId) } : s
      )
    );
  }, []);

  const reorderExercises = useCallback((sectionId: string, from: number, to: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const next = [...s.exercises];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { ...s, exercises: next };
      })
    );
  }, []);

  const save = useCallback(() => {
    updateSequence(id, name.trim() || 'Untitled Sequence');

    // Snapshot current DB state
    const dbSectionIds = new Set(getSectionsBySequenceId(id).map((s) => s.id));
    const dbExerciseIds = new Set(getExercisesBySequenceId(id).map((e) => e.id));

    // Compute what the user kept
    const localSectionIds = new Set(sections.map((s) => s.id));
    const localExerciseIds = new Set(sections.flatMap((s) => s.exercises.map((e) => e.id)));

    // Delete exercises the user removed (before sections, to avoid FK orphans)
    for (const dbId of dbExerciseIds) {
      if (!localExerciseIds.has(dbId)) deleteExercise(dbId);
    }

    // Delete sections the user removed
    for (const dbId of dbSectionIds) {
      if (!localSectionIds.has(dbId)) deleteSection(dbId);
    }

    // Upsert everything in current order
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      upsertSection(section.id, id, section.name.trim() || 'Section', sIdx);

      for (let eIdx = 0; eIdx < section.exercises.length; eIdx++) {
        const ex = section.exercises[eIdx];
        upsertExercise(
          ex.id, id, section.id,
          ex.name.trim() || 'Exercise',
          ex.duration,
          eIdx,
          ex.notes ?? null
        );
      }
    }

    emitSequenceChange();
    router.back();
  }, [id, name, sections, router]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  const totalExercises = sections.reduce((sum, s) => sum + s.exercises.length, 0);
  const canSave = totalExercises > 0;

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

        {sections.map((section) => (
          <SectionGroup
            key={section.id}
            name={section.name}
            canDelete={sections.length > 1}
            onRename={(n) => renameSection(section.id, n)}
            onDelete={() => removeSection(section.id)}
            onAddExercise={() => addExercise(section.id)}
          >
            {section.exercises.length > 0 && (
              <DraggableList
                data={section.exercises}
                renderItem={(item) => (
                  <ExerciseRow
                    exercise={item}
                    onNameChange={(n) => updateExercise(section.id, item.id, { name: n })}
                    onDurationChange={(d) => updateExercise(section.id, item.id, { duration: d })}
                    onDelete={() => removeExercise(section.id, item.id)}
                  />
                )}
                onReorder={(from, to) => reorderExercises(section.id, from, to)}
                onDragStart={() => setScrollEnabled(false)}
                onDragEnd={() => setScrollEnabled(true)}
              />
            )}
          </SectionGroup>
        ))}

        <TouchableOpacity onPress={addSection} style={styles.addSectionRow} activeOpacity={0.7}>
          <Text style={styles.addIcon}>+</Text>
          <Text variant="body" color="tertiary">Add section</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.8}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        >
          <Text variant="label" color="inverse">Save Changes</Text>
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
  addSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  addIcon: {
    fontSize: 20,
    color: Colors.text.tertiary,
    lineHeight: 24,
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
