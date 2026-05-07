import {
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Text } from './ui/Text';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import type { VariationItem } from '@/lib/db/exercises';
import { formatSeconds } from '@/lib/utils/time';

type EditorItem = VariationItem & { _key: number };

interface Props {
  visible: boolean;
  variationSets: VariationItem[];
  exerciseDuration: number;
  onSave: (items: VariationItem[]) => void;
  onClose: () => void;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerBtn: { minWidth: 60 },
    headerTitle: { textAlign: 'center' },
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
      fontSize: FontSize.base,
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
      fontSize: 12,
      color: c.text.secondary,
      fontVariant: ['tabular-nums' as const],
    },
    timeBtnHint: {
      fontSize: 11,
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
      fontSize: FontSize.sm,
      color: c.accent,
    },
    empty: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: FontSize.sm,
      color: c.text.tertiary,
      textAlign: 'center',
    },
    hint: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    hintText: {
      fontSize: 11,
      color: c.text.tertiary,
      lineHeight: 16,
    },
  });
}

export function VariationEditor({ visible, variationSets, exerciseDuration, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [items, setItems] = useState<EditorItem[]>([]);
  const keyCounter = useRef(0);

  const nextKey = () => ++keyCounter.current;

  useEffect(() => {
    if (visible) setItems(variationSets.length ? variationSets.map((v) => ({ ...v, _key: nextKey() })) : []);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setItems((prev) => [...prev, { instruction: '', atSeconds: null, _key: nextKey() }]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text variant="label" color="secondary">Cancel</Text>
          </TouchableOpacity>
          <Text variant="label" style={styles.headerTitle}>Variations</Text>
          <TouchableOpacity onPress={() => onSave(items.filter((it) => it.instruction.trim()).map(({ _key: _, ...rest }) => rest))} style={styles.headerBtn}>
            <Text variant="label">Done</Text>
          </TouchableOpacity>
        </View>

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
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="done"
                maxLength={80}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.timeBtn} onPress={() => promptTime(item._key)} hitSlop={8}>
                  {item.atSeconds != null ? (
                    <Text style={styles.timeBtnText}>{formatSeconds(item.atSeconds)}</Text>
                  ) : (
                    <Text style={styles.timeBtnHint}>even</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item._key)} hitSlop={8}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addRow} onPress={addItem}>
            <Text style={styles.addLabel}>+ Add variation</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
