import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { useRouter, usePreventRemove } from 'expo-router';
import { DISPLAY_MAX_MULTIPLIER, Text } from '@/components/ui/Text';
import { DraggableList } from '@/components/DraggableList';
import { ExerciseRow } from '@/components/ExerciseRow';
import { SectionGroup } from '@/components/SectionGroup';
import { Divider } from '@/components/ui/Divider';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { TagPicker } from '@/components/TagPicker';
import { TagChips } from '@/components/TagChips';
import { ExerciseSearchSheet } from '@/components/ExerciseSearchSheet';
import { SectionImportSheet } from '@/components/SectionImportSheet';
import {
  loadSequenceDraft,
  newSequenceDraft,
  saveSequenceDraft,
  type DraftExercise,
  type DraftSection,
} from '@/lib/db/sequenceDraft';
import { getAllTagValuesWithCategory, type ExerciseTag } from '@/lib/db/tags';
import { getAllLoadIcons, parseLoad, type LoadIcon } from '@/lib/db/loadIcons';
import { LoadEditor } from '@/components/LoadEditor';
import { VariationEditor } from '@/components/VariationEditor';
import { generateId } from '@/lib/utils/id';
import { splitDuration } from '@/lib/utils/time';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import { emitSequenceChange } from '@/lib/sequenceEvents';

interface Props {
  /** The sequence to edit; omit it to build a new one. */
  id?: string;
}

/** The builder screen for both new and existing sequences. Nothing is saved until Save. */
export function SequenceBuilder({ id }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);
  // Null when the sequence to edit no longer exists.
  const [initial] = useState(() => (id ? loadSequenceDraft(id) : newSequenceDraft()));
  const [isDirty, setIsDirty] = useState(false);
  const [name, setName] = useState(initial?.name ?? '');
  const [sections, setSections] = useState<DraftSection[]>(initial?.sections ?? []);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [tagPickerExerciseId, setTagPickerExerciseId] = useState<string | null>(null);
  const [sequenceTags, setSequenceTags] = useState<ExerciseTag[]>(initial?.tags ?? []);
  const [showSequenceTagPicker, setShowSequenceTagPicker] = useState(false);
  const [exerciseSheetSectionId, setExerciseSheetSectionId] = useState<string | null>(null);
  const [showSectionImport, setShowSectionImport] = useState(false);
  const [editLoadExerciseId, setEditLoadExerciseId] = useState<string | null>(null);
  const [editVariationExerciseId, setEditVariationExerciseId] = useState<string | null>(null);
  const [allLoadIcons] = useState<LoadIcon[]>(() => getAllLoadIcons());

  const activeExercise = tagPickerExerciseId
    ? (sections.flatMap((s) => s.exercises).find((e) => e.id === tagPickerExerciseId) ?? null)
    : null;

  const hasSavedRef = useRef(false);

  usePreventRemove(isDirty, ({ repeat }) => {
    // Right after a save, isDirty is still true until the next render; leave without asking.
    if (hasSavedRef.current) {
      repeat();
      return;
    }
    Alert.alert('Discard changes?', 'You have unsaved changes. Are you sure you want to leave?', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setIsDirty(false);
          repeat();
        },
      },
    ]);
  });

  useEffect(() => {
    if (!initial) router.back();
  }, [initial, router]);

  const importSection = useCallback((section: DraftSection) => {
    setIsDirty(true);
    setSections((prev) => [...prev, section]);
  }, []);

  const addSection = useCallback(() => {
    setIsDirty(true);
    setSections((prev) => [...prev, { id: generateId(), name: '', exercises: [] }]);
  }, []);

  const renameSection = useCallback((sectionId: string, newName: string) => {
    setIsDirty(true);
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, name: newName } : s)));
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setIsDirty(true);
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const addExercise = useCallback(
    (
      sectionId: string,
      name = '',
      libraryExerciseId: string | null = null,
      tagValueIds: string[] = [],
      loadModified: string[] | null = null,
      loadBase: string[] | null = null,
      loadAmplified: string[] | null = null,
      isBilateral = false,
      tags: ExerciseTag[] = []
    ) => {
      setIsDirty(true);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                exercises: [
                  ...s.exercises,
                  {
                    id: generateId(),
                    name,
                    duration: 30,
                    notes: null,
                    tagValueIds,
                    tags,
                    libraryExerciseId,
                    loadModified,
                    loadBase,
                    loadAmplified,
                    variation: null,
                    variationSets: null,
                    isBilateral,
                    side: null,
                  },
                ],
              }
            : s
        )
      );
    },
    []
  );

  const updateExercise = useCallback((sectionId: string, exId: string, fields: Partial<DraftExercise>) => {
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
      prev.map((s) => (s.id === sectionId ? { ...s, exercises: s.exercises.filter((ex) => ex.id !== exId) } : s))
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
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.exercises.length === 0) return s;
        const durations = splitDuration(total, s.exercises.length);
        return {
          ...s,
          exercises: s.exercises.map((ex, i) => ({ ...ex, duration: durations[i] })),
        };
      })
    );
  }, []);

  const doSave = useCallback(
    (shouldAddUnlinkedToLibrary: boolean) => {
      if (hasSavedRef.current) return;
      try {
        saveSequenceDraft(id ?? null, { name, tags: sequenceTags, sections }, shouldAddUnlinkedToLibrary);
      } catch {
        Alert.alert(
          "Couldn't save",
          id
            ? "Something went wrong, so your changes weren't saved. Please try again."
            : 'Something went wrong, so nothing was saved. Please try again.'
        );
        return;
      }
      hasSavedRef.current = true;
      emitSequenceChange();
      setIsDirty(false);
      router.back();
    },
    [id, name, sections, sequenceTags, router]
  );

  const save = useCallback(() => {
    const unlinked = sections.flatMap((s) => s.exercises).filter((e) => !e.libraryExerciseId && e.name.trim());

    if (unlinked.length > 0) {
      const names = unlinked.map((e) => e.name.trim()).join(', ');
      Alert.alert(
        'Save to exercise library?',
        `${names} ${unlinked.length === 1 ? "isn't" : "aren't"} in your library yet.`,
        [
          { text: 'Not now', style: 'cancel', onPress: () => doSave(false) },
          { text: 'Add to library', onPress: () => doSave(true) },
        ]
      );
    } else {
      doSave(false);
    }
  }, [sections, doSave]);

  const editLoadTarget = useMemo(() => {
    if (!editLoadExerciseId) return null;
    const ex = sections.flatMap((s) => s.exercises).find((e) => e.id === editLoadExerciseId);
    const section = sections.find((s) => s.exercises.some((e) => e.id === editLoadExerciseId));
    if (!ex || !section) return null;
    return { ex, sectionId: section.id };
  }, [editLoadExerciseId, sections]);

  const editVariationTarget = useMemo(() => {
    if (!editVariationExerciseId) return null;
    const ex = sections.flatMap((s) => s.exercises).find((e) => e.id === editVariationExerciseId);
    const section = sections.find((s) => s.exercises.some((e) => e.id === editVariationExerciseId));
    if (!ex || !section) return null;
    return { ex, sectionId: section.id };
  }, [editVariationExerciseId, sections]);

  if (!initial) return null;

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
          maxFontSizeMultiplier={DISPLAY_MAX_MULTIPLIER}
          value={name}
          onChangeText={(v) => {
            setIsDirty(true);
            setName(v);
          }}
          autoFocus={!id}
          placeholder="Sequence name"
          accessibilityLabel="Sequence name"
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          maxLength={80}
        />

        <View style={styles.sequenceTagsRow}>
          {sequenceTags.length > 0 && <TagChips tags={sequenceTags} style={styles.sequenceTagChips} />}
          <TouchableOpacity onPress={() => setShowSequenceTagPicker(true)} hitSlop={12} accessibilityRole="button">
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
                renderItem={(item, _index, mover) => (
                  <ExerciseRow
                    exercise={item}
                    mover={mover}
                    onNameChange={(n) => updateExercise(section.id, item.id, { name: n })}
                    onDurationChange={(d) => updateExercise(section.id, item.id, { duration: d })}
                    onDelete={() => removeExercise(section.id, item.id)}
                    onEditTags={() => setTagPickerExerciseId(item.id)}
                    onEditLoad={allLoadIcons.length > 0 ? () => setEditLoadExerciseId(item.id) : undefined}
                    onEditVariation={() => setEditVariationExerciseId(item.id)}
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

        <TouchableOpacity
          onPress={addSection}
          style={styles.addSectionRow}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add section"
        >
          <Text style={styles.addIcon}>+</Text>
          <Text variant="body" color="tertiary">
            Add section
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowSectionImport(true)}
          style={styles.addSectionRow}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Import section from another sequence"
        >
          <Text style={styles.addIcon}>↓</Text>
          <Text variant="body" color="tertiary">
            Import section from another sequence
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          style={[styles.saveButton, { backgroundColor: colors.fill.primary }, !canSave && styles.saveButtonDisabled]}
        >
          <Text variant="label" color="inverse">
            {id ? 'Save Changes' : 'Save Sequence'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeExercise && tagPickerExerciseId && (
        <TagPicker
          selectedTagValueIds={activeExercise.tagValueIds}
          onConfirm={(ids) => {
            const sectionId = sections.find((s) => s.exercises.some((e) => e.id === tagPickerExerciseId))?.id;
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

      {showSectionImport && (
        <SectionImportSheet
          currentSequenceId={id}
          onImport={(s) => {
            importSection(s);
            setShowSectionImport(false);
          }}
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
            setSequenceTags(
              ids.flatMap((id) => {
                const t = map.get(id);
                return t ? [{ tagValueId: t.id, categoryName: t.categoryName, label: t.label }] : [];
              })
            );
            setShowSequenceTagPicker(false);
          }}
          onClose={() => setShowSequenceTagPicker(false)}
        />
      )}

      {editLoadTarget && (
        <LoadEditor
          loadModified={editLoadTarget.ex.loadModified ?? []}
          loadBase={editLoadTarget.ex.loadBase ?? []}
          loadAmplified={editLoadTarget.ex.loadAmplified ?? []}
          allIcons={allLoadIcons}
          onSave={(modified, base, amplified) => {
            updateExercise(editLoadTarget.sectionId, editLoadTarget.ex.id, {
              loadModified: modified.length > 0 ? modified : null,
              loadBase: base.length > 0 ? base : null,
              loadAmplified: amplified.length > 0 ? amplified : null,
            });
            setEditLoadExerciseId(null);
          }}
          onClose={() => setEditLoadExerciseId(null)}
        />
      )}

      {editVariationTarget && (
        <VariationEditor
          variationSets={editVariationTarget.ex.variationSets ?? []}
          exerciseDuration={editVariationTarget.ex.duration}
          onSave={(items) => {
            updateExercise(editVariationTarget.sectionId, editVariationTarget.ex.id, {
              variationSets: items.length > 0 ? items : null,
            });
            setEditVariationExerciseId(null);
          }}
          onClose={() => setEditVariationExerciseId(null)}
        />
      )}

      {exerciseSheetSectionId && (
        <ExerciseSearchSheet
          onSelect={(libEx) => {
            addExercise(
              exerciseSheetSectionId,
              libEx.name,
              libEx.id,
              [],
              parseLoad(libEx.load_modified),
              parseLoad(libEx.load_base),
              parseLoad(libEx.load_amplified),
              !!libEx.is_bilateral,
              libEx.tags
            );
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
