import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { useRef, useState } from 'react';
import { Text } from './ui/Text';
import { Sheet } from './ui/Sheet';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import type { VariationItem } from '@/lib/db/exercises';
import { formatSeconds, spokenDuration } from '@/lib/utils/time';
import { IconButton } from './ui/IconButton';

type EditorItem = VariationItem & { _key: number };

interface Props {
  variationSets: VariationItem[];
  exerciseDuration: number;
  onSave: (items: VariationItem[]) => void;
  onClose: () => void;
}

function makeStyles(c: typeof Colors, textScale: number) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      gap: Spacing.sm,
    },
    instructionInput: {
      flex: 1,
      fontSize: Math.round(FontSize.base * textScale),
      color: c.text.primary,
      paddingVertical: 4,
    },
    timeBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      backgroundColor: c.surface,
      borderRadius: Radius.sm,
      minWidth: 52,
      alignItems: 'center',
    },
    timeBtnText: {
      fontSize: Math.round(12 * textScale),
      color: c.text.secondary,
      fontVariant: ['tabular-nums' as const],
    },
    timeBtnHint: {
      fontSize: Math.round(11 * textScale),
      color: c.text.tertiary,
    },
    deleteBtn: {
      width: 28,
      alignItems: 'center',
    },
    deleteBtnText: {
      fontSize: 14,
      color: c.text.tertiary,
    },
    addRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    addLabel: {
      fontSize: Math.round(FontSize.sm * textScale),
      color: c.accentText,
    },
    empty: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: Math.round(FontSize.sm * textScale),
      color: c.text.tertiary,
      textAlign: 'center',
    },
    hint: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    hintText: {
      fontSize: Math.round(11 * textScale),
      color: c.text.tertiary,
      lineHeight: Math.round(16 * textScale),
    },
  });
}

/** Edits an exercise's variations; mount it to open it, and it starts from the variations passed in. */
export function VariationEditor({ variationSets, exerciseDuration, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);
  // Rows have no ids of their own, so each gets a key for React: its starting index, or the next unused number.
  const [items, setItems] = useState<EditorItem[]>(() => variationSets.map((v, i) => ({ ...v, _key: i })));
  const keyCounter = useRef(variationSets.length);

  const updateInstruction = (key: number, instruction: string) => {
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, instruction } : it)));
  };

  const promptTime = (key: number) => {
    if (Platform.OS !== 'ios') return;
    const current = items.find((it) => it._key === key)?.atSeconds ?? null;
    Alert.prompt(
      'Set time',
      `Enter seconds into the exercise (0–${exerciseDuration}). Leave blank to space evenly.`,
      (text) => {
        if (text.trim() === '') {
          setItems((prev) => prev.map((it) => (it._key === key ? { ...it, atSeconds: null } : it)));
          return;
        }
        const n = parseInt(text, 10);
        if (!isNaN(n) && n >= 0 && n <= exerciseDuration) {
          setItems((prev) => prev.map((it) => (it._key === key ? { ...it, atSeconds: n } : it)));
        }
      },
      'plain-text',
      current != null ? String(current) : ''
    );
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const addItem = () => {
    const key = keyCounter.current++;
    setItems((prev) => [...prev, { instruction: '', atSeconds: null, _key: key }]);
  };

  return (
    <Sheet
      title="Variations"
      onClose={onClose}
      left={{ label: 'Cancel', onPress: onClose }}
      right={{
        label: 'Done',
        onPress: () => onSave(items.filter((it) => it.instruction.trim()).map(({ _key: _, ...rest }) => rest)),
        primary: true,
      }}
    >
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {items.length > 0 && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Tap the time button to set when each cue fires. Leave unset to space them evenly.
            </Text>
          </View>
        )}

        {items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No variations yet. Add one below.</Text>
          </View>
        )}

        {items.map((item) => (
          <View key={item._key} style={styles.row}>
            <TextInput
              style={styles.instructionInput}
              value={item.instruction}
              onChangeText={(t) => updateInstruction(item._key, t)}
              placeholder="Cue (e.g. narrow grip)"
              accessibilityLabel="Variation cue"
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="done"
              maxLength={80}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => promptTime(item._key)}
                hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={
                  item.atSeconds != null
                    ? `Starts at ${spokenDuration(item.atSeconds)}`
                    : 'Starts evenly spaced. Set a time'
                }
              >
                {item.atSeconds != null ? (
                  <Text style={styles.timeBtnText}>{formatSeconds(item.atSeconds)}</Text>
                ) : (
                  <Text style={styles.timeBtnHint}>even</Text>
                )}
              </TouchableOpacity>
            )}
            <IconButton label="Remove variation" style={styles.deleteBtn} onPress={() => removeItem(item._key)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </IconButton>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addRow}
          onPress={addItem}
          accessibilityRole="button"
          accessibilityLabel="Add variation"
        >
          <Text style={styles.addLabel}>+ Add variation</Text>
        </TouchableOpacity>
      </ScrollView>
    </Sheet>
  );
}
