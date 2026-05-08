import { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { Text } from '@/components/ui/Text';
import { DraggableList } from '@/components/DraggableList';
import { ExerciseRow, type LocalExercise } from '@/components/ExerciseRow';
import { SectionGroup } from '@/components/SectionGroup';
import { TagPicker } from '@/components/TagPicker';
import { ExerciseSearchSheet } from '@/components/ExerciseSearchSheet';
import { SectionImportSheet } from '@/components/SectionImportSheet';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { TagChips } from '@/components/TagChips';
import { createSequence } from '@/lib/db/sequences';
import { createExercise } from '@/lib/db/exercises';
import { createSection } from '@/lib/db/sections';
import {
  setExerciseTags,
  setSequenceTags as saveSequenceTags,
  getAllTagValuesWithCategory,
  type ExerciseTag,
} from '@/lib/db/tags';
import { createLibraryExercise, setLibraryExerciseTags } from '@/lib/db/libraryExercises';
import { generateId } from '@/lib/utils/id';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import { emitSequenceChange } from '@/lib/sequenceEvents';

interface LocalSection {
  id: string;
  name: string;
  exercises: LocalExercise[];
}

export default function NewSequenceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);
  const [isDirty, setIsDirty] = useState(false);
  const [name, setName] = useState('');
  const [sections, setSections] = useState<LocalSection[]>([
    { id: generateId(), name: 'Main', exercises: [] },
  ]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [tagPickerExerciseId, setTagPickerExerciseId] = useState<string | null>(null);
  const [sequenceTags, setSequenceTags] = useState<ExerciseTag[]>([]);
  const [showSequenceTagPicker, setShowSequenceTagPicker] = useState(false);
  const [exerciseSheetSectionId, setExerciseSheetSectionId] = useState<string | null>(null);
  const [showSectionImport, setShowSectionImport] = useState(false);

  usePreventRemove(isDirty, ({ data }) => {
    Alert.alert(
      'Discard changes?',
      'You have unsaved changes. Are you sure you want to leave?',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
      ]
    );
  });

  const activeExercise = tagPickerExerciseId
    ? sections.flatMap((s) => s.exercises).find((e) => e.id === tagPickerExerciseId) ?? null
    : null;

  const importSection = useCallback((section: LocalSection) => {
    setIsDirty(true);
    setSections((prev) => [...prev, section]);
  }, []);

  const addSection = useCallback(() => {
    setIsDirty(true);
    setSections((prev) => [...prev, { id: generateId(), name: '', exercises: [] }]);
  }, []);

  const renameSection = useCallback((sectionId: string, newName: string) => {
    setIsDirty(true);
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name: newName } : s))
    );
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setIsDirty(true);
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const addExercise = useCallback((sectionId: string, name = '', libraryExerciseId: string | null = null, tagValueIds: string[] = [], isBilateral = false, tags: ExerciseTag[] = []) => {
    setIsDirty(true);
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, exercises: [...s.exercises, { id: generateId(), name, duration: 30, notes: null, tagValueIds, tags, libraryExerciseId, loadModified: null, loadBase: null, loadAmplified: null, variation: null, variationSets: null, isBilateral, side: null }] }
          : s
      )
    );
  }, []);

  const updateExercise = useCallback((sectionId: string, exId: string, fields: Partial<LocalExercise>) => {
    setIsDirty(true);
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, exercises: s.exercises.map((ex) => (ex.id === exId ? { ...ex, ...fields } : ex)) }
          : s
      )
    );
  }, []);

  const removeExercise = useCallback((sectionId: string, exId: string) => {
    setIsDirty(true);
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, exercises: s.exercises.filter((ex) => ex.id !== exId) } : s
      )
    );
  }, []);

  const reorderExercises = useCallback((sectionId: string, from: number, to: number) => {
    setIsDirty(true);
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

  const setTotalSectionDuration = useCallback((sectionId: string, total: number) => {
    setIsDirty(true);
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId || s.exercises.length === 0) return s;
      const perEx = Math.floor(total / s.exercises.length);
      return {
        ...s,
        exercises: s.exercises.map((ex, i) => ({
          ...ex,
          duration: i === s.exercises.length - 1 ? total - perEx * (s.exercises.length - 1) : perEx,
        })),
      };
    }));
  }, []);

  const doSave = useCallback((sectionsToSave: typeof sections) => {
    const trimmedName = name.trim() || 'Untitled Sequence';
    const seq = createSequence(trimmedName);
    if (sequenceTags.length > 0) saveSequenceTags(seq.id, sequenceTags.map((t) => t.tagValueId));
    for (const section of sectionsToSave) {
      const dbSection = createSection(seq.id, section.name.trim() || 'Section');
      for (const ex of section.exercises) {
        const libId = ex.libraryExerciseId ?? null;
        createExercise(seq.id, dbSection.id, ex.name.trim() || 'Exercise', ex.duration, ex.notes ?? undefined, libId, ex.variation ?? null, ex.side ?? null, ex.variationSets ?? null);
        if (!libId && ex.tagValueIds.length > 0) setExerciseTags(ex.id, ex.tagValueIds);
      }
    }
    emitSequenceChange();
    setIsDirty(false);
    router.back();
  }, [name, sequenceTags, router]);

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
          onChangeText={(v) => { setIsDirty(true); setName(v); }}
          placeholder="Sequence name"
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          maxLength={80}
          autoFocus
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
            totalDuration={section.exercises.reduce((sum, e) => sum + e.duration, 0)}
            onSetTotalDuration={(t) => setTotalSectionDuration(section.id, t)}
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
                    onSideChange={(side) => updateExercise(section.id, item.id, { side })}
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

        <TouchableOpacity onPress={() => setShowSectionImport(true)} style={styles.addSectionRow} activeOpacity={0.7}>
          <Text style={styles.addIcon}>↓</Text>
          <Text variant="body" color="tertiary">Import section from another sequence</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.8}
          style={[styles.saveButton, { backgroundColor: colors.fill.primary }, !canSave && styles.saveButtonDisabled]}
        >
          <Text variant="label" color="inverse">Save Sequence</Text>
        </TouchableOpacity>
      </View>

      {activeExercise && tagPickerExerciseId && (
        <TagPicker
          selectedTagValueIds={activeExercise.tagValueIds}
          onConfirm={(ids) => {
            const sectionId = sections.find((s) =>
              s.exercises.some((e) => e.id === tagPickerExerciseId)
            )?.id;
            if (sectionId) {
              const all = getAllTagValuesWithCategory();
              const map = new Map(all.map((t) => [t.id, t]));
              const tags = ids.flatMap((id) => {
                const t = map.get(id);
                return t ? [{ tagValueId: t.id, categoryName: t.categoryName, label: t.label }] : [];
              });
              updateExercise(sectionId, tagPickerExerciseId, { tagValueIds: ids, tags });
            }
            setTagPickerExerciseId(null);
          }}
          onClose={() => setTagPickerExerciseId(null)}
        />
      )}

      {exerciseSheetSectionId && (
        <ExerciseSearchSheet
          onSelect={(libEx) => {
            addExercise(exerciseSheetSectionId, libEx.name, libEx.id, [], !!libEx.is_bilateral, libEx.tags);
            setExerciseSheetSectionId(null);
          }}
          onCreateNew={(name) => {
            addExercise(exerciseSheetSectionId, name, null, []);
            setExerciseSheetSectionId(null);
          }}
          onClose={() => setExerciseSheetSectionId(null)}
        />
      )}

      {showSectionImport && (
        <SectionImportSheet
          onImport={(s) => { importSection(s); setShowSectionImport(false); }}
          onClose={() => setShowSectionImport(false)}
        />
      )}

      {showSequenceTagPicker && (
        <TagPicker
          selectedTagValueIds={sequenceTags.map((t) => t.tagValueId)}
          onConfirm={(ids) => {
            const all = getAllTagValuesWithCategory();
            const map = new Map(all.map((t) => [t.id, t]));
            setIsDirty(true);
            setSequenceTags(ids.flatMap((id) => {
              const t = map.get(id);
              return t ? [{ tagValueId: t.id, categoryName: t.categoryName, label: t.label }] : [];
            }));
            setShowSequenceTagPicker(false);
          }}
          onClose={() => setShowSequenceTagPicker(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: typeof Colors, textScale = 1.0) {
  return StyleSheet.create({
    flex: { flex: 1 },
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
      fontSize: Math.round(20 * textScale),
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
