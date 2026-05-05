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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { DraggableList } from '@/components/DraggableList';
import { ExerciseRow, type LocalExercise } from '@/components/ExerciseRow';
import { SectionGroup } from '@/components/SectionGroup';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { TagPicker } from '@/components/TagPicker';
import { TagChips } from '@/components/TagChips';
import { ExerciseSearchSheet } from '@/components/ExerciseSearchSheet';
import { getSequenceById, updateSequence } from '@/lib/db/sequences';
import { getExercisesBySequenceId, upsertExercise, deleteExercise } from '@/lib/db/exercises';
import { getSectionsBySequenceId, upsertSection, deleteSection } from '@/lib/db/sections';
import {
  getTagsForExercise,
  setExerciseTags,
  getTagsForSequence,
  setSequenceTags as saveSequenceTags,
  getAllTagValuesWithCategory,
  type ExerciseTag,
} from '@/lib/db/tags';
import { createLibraryExercise, setLibraryExerciseTags } from '@/lib/db/libraryExercises';
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
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [name, setName] = useState('');
  const [sections, setSections] = useState<LocalSection[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tagPickerExerciseId, setTagPickerExerciseId] = useState<string | null>(null);
  const [sequenceTags, setSequenceTags] = useState<ExerciseTag[]>([]);
  const [showSequenceTagPicker, setShowSequenceTagPicker] = useState(false);
  const [exerciseSheetSectionId, setExerciseSheetSectionId] = useState<string | null>(null);

  const activeExercise = tagPickerExerciseId
    ? sections.flatMap((s) => s.exercises).find((e) => e.id === tagPickerExerciseId) ?? null
    : null;

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
          .map((e) => ({
            id: e.id,
            name: e.name,
            duration: e.duration,
            notes: e.notes,
            tagValueIds: getTagsForExercise(e.id).map((t) => t.tagValueId),
            libraryExerciseId: e.library_exercise_id,
          })),
      }))
    );
    setSequenceTags(getTagsForSequence(id));
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

  const addExercise = useCallback((sectionId: string, name = '', libraryExerciseId: string | null = null, tagValueIds: string[] = []) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, exercises: [...s.exercises, { id: generateId(), name, duration: 30, notes: null, tagValueIds, libraryExerciseId }] }
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

  const doSave = useCallback((sectionsToSave: typeof sections) => {
    updateSequence(id, name.trim() || 'Untitled Sequence');
    saveSequenceTags(id, sequenceTags.map((t) => t.tagValueId));

    const dbSectionIds = new Set(getSectionsBySequenceId(id).map((s) => s.id));
    const dbExerciseIds = new Set(getExercisesBySequenceId(id).map((e) => e.id));
    const localSectionIds = new Set(sectionsToSave.map((s) => s.id));
    const localExerciseIds = new Set(sectionsToSave.flatMap((s) => s.exercises.map((e) => e.id)));

    for (const dbId of dbExerciseIds) {
      if (!localExerciseIds.has(dbId)) deleteExercise(dbId);
    }
    for (const dbId of dbSectionIds) {
      if (!localSectionIds.has(dbId)) deleteSection(dbId);
    }

    for (let sIdx = 0; sIdx < sectionsToSave.length; sIdx++) {
      const section = sectionsToSave[sIdx];
      upsertSection(section.id, id, section.name.trim() || 'Section', sIdx);
      for (let eIdx = 0; eIdx < section.exercises.length; eIdx++) {
        const ex = section.exercises[eIdx];
        const libId = ex.libraryExerciseId ?? null;
        upsertExercise(ex.id, id, section.id, ex.name.trim() || 'Exercise', ex.duration, eIdx, ex.notes ?? null, libId);
        if (!libId) setExerciseTags(ex.id, ex.tagValueIds);
      }
    }

    emitSequenceChange();
    router.back();
  }, [id, name, sequenceTags, router]);

  const save = useCallback(() => {
    const unlinked = sections
      .flatMap((s) => s.exercises)
      .filter((e) => !e.libraryExerciseId && e.name.trim());

    if (unlinked.length > 0) {
      const names = unlinked.map((e) => e.name.trim()).join(', ');
      Alert.alert(
        'Save to exercise library?',
        `${names} ${unlinked.length === 1 ? 'isn\'t' : 'aren\'t'} in your library yet.`,
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => doSave(sections),
          },
          {
            text: 'Add to library',
            onPress: () => {
              const updated = sections.map((s) => ({
                ...s,
                exercises: s.exercises.map((ex) => {
                  if (ex.libraryExerciseId || !ex.name.trim()) return ex;
                  const libEx = createLibraryExercise(ex.name.trim());
                  if (ex.tagValueIds.length > 0) setLibraryExerciseTags(libEx.id, ex.tagValueIds);
                  return { ...ex, libraryExerciseId: libEx.id };
                }),
              }));
              doSave(updated);
            },
          },
        ]
      );
    } else {
      doSave(sections);
    }
  }, [sections, doSave]);

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
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          maxLength={80}
        />

        <View style={styles.sequenceTagsRow}>
          {sequenceTags.length > 0 && <TagChips tags={sequenceTags} style={styles.sequenceTagChips} />}
          <TouchableOpacity onPress={() => setShowSequenceTagPicker(true)} hitSlop={8}>
            <Text variant="caption" color="tertiary">
              {sequenceTags.length > 0 ? 'Edit tags' : '+ Add tags'}
            </Text>
          </TouchableOpacity>
        </View>

        <Divider style={styles.divider} />

        {sections.map((section) => (
          <SectionGroup
            key={section.id}
            name={section.name}
            canDelete={sections.length > 1}
            onRename={(n) => renameSection(section.id, n)}
            onDelete={() => removeSection(section.id)}
            onAddExercise={() => setExerciseSheetSectionId(section.id)}
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
                    onEditTags={() => setTagPickerExerciseId(item.id)}
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
          style={[styles.saveButton, { backgroundColor: colors.fill.primary }, !canSave && styles.saveButtonDisabled]}
        >
          <Text variant="label" color="inverse">Save Changes</Text>
        </TouchableOpacity>
      </View>

      {activeExercise && tagPickerExerciseId && (
        <TagPicker
          selectedTagValueIds={activeExercise.tagValueIds}
          onConfirm={(ids) => {
            const sectionId = sections.find((s) =>
              s.exercises.some((e) => e.id === tagPickerExerciseId)
            )?.id;
            if (sectionId) updateExercise(sectionId, tagPickerExerciseId, { tagValueIds: ids });
            setTagPickerExerciseId(null);
          }}
          onClose={() => setTagPickerExerciseId(null)}
        />
      )}

      {showSequenceTagPicker && (
        <TagPicker
          selectedTagValueIds={sequenceTags.map((t) => t.tagValueId)}
          onConfirm={(ids) => {
            const all = getAllTagValuesWithCategory();
            const map = new Map(all.map((t) => [t.id, t]));
            setSequenceTags(ids.flatMap((id) => {
              const t = map.get(id);
              return t ? [{ tagValueId: t.id, categoryName: t.categoryName, label: t.label }] : [];
            }));
            setShowSequenceTagPicker(false);
          }}
          onClose={() => setShowSequenceTagPicker(false)}
        />
      )}

      {exerciseSheetSectionId && (
        <ExerciseSearchSheet
          onSelect={(libEx) => {
            addExercise(exerciseSheetSectionId, libEx.name, libEx.id, libEx.tags.map((t) => t.tagValueId));
            setExerciseSheetSectionId(null);
          }}
          onCreateNew={(name) => {
            addExercise(exerciseSheetSectionId, name, null, []);
            setExerciseSheetSectionId(null);
          }}
          onClose={() => setExerciseSheetSectionId(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: Spacing.xl },
    nameInput: {
      fontSize: FontSize['2xl'],
      fontWeight: FontWeight.bold,
      color: c.text.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      letterSpacing: -0.5,
    },
    sequenceTagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    sequenceTagChips: { flex: 1 },
    divider: { marginBottom: Spacing.xs },
    addSectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      marginTop: Spacing.sm,
    },
    addIcon: {
      fontSize: 20,
      color: c.text.tertiary,
      lineHeight: 24,
    },
    footer: {
      padding: Spacing.md,
      paddingBottom: Spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
    saveButton: {
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm + 2,
      alignItems: 'center',
    },
    saveButtonDisabled: { opacity: 0.35 },
  });
}
