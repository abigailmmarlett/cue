import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Text } from './ui/Text';
import { Sheet } from './ui/Sheet';
import { LoadDot } from './LoadDot';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import type { LoadIcon } from '@/lib/db/loadIcons';

type Level = 'modified' | 'base' | 'amplified';

const LEVELS: { key: Level; label: string }[] = [
  { key: 'modified', label: 'MODIFIED' },
  { key: 'base', label: 'BASE' },
  { key: 'amplified', label: 'AMPLIFIED' },
];

interface Props {
  loadModified: string[];
  loadBase: string[];
  loadAmplified: string[];
  allIcons: LoadIcon[];
  onSave: (modified: string[], base: string[], amplified: string[]) => void;
  onClose: () => void;
}

function makeStyles(c: typeof Colors, textScale: number) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    section: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sectionLabel: {
      fontSize: Math.round(10 * textScale),
      fontWeight: '800',
      letterSpacing: 1.2,
      color: c.text.tertiary,
      marginBottom: Spacing.sm,
    },
    selectedRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      minHeight: 30,
      marginBottom: Spacing.md,
      alignItems: 'center',
    },
    emptyHint: {
      fontSize: Math.round(14 * textScale),
      color: c.text.tertiary,
    },
    selectedDotBtn: {
      position: 'relative',
      padding: 3,
    },
    removeBadge: {
      position: 'absolute',
      top: -1,
      right: -1,
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: c.surfaceSolid,
      borderWidth: 1,
      borderColor: c.borderMid,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBadgeText: {
      fontSize: 8,
      color: c.text.secondary,
      lineHeight: 11,
    },
    addLabel: {
      fontSize: Math.round(10 * textScale),
      fontWeight: '600',
      letterSpacing: 0.6,
      color: c.text.tertiary,
      marginBottom: 8,
    },
    addRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    addDotBtn: {
      padding: 5,
      borderRadius: Radius.sm,
      backgroundColor: c.surface,
    },
  });
}

/** Edits an exercise's loads; mount it to open it, and it starts from the loads passed in. */
export function LoadEditor({ loadModified, loadBase, loadAmplified, allIcons, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);

  const [mod, setMod] = useState(loadModified);
  const [base, setBase] = useState(loadBase);
  const [amp, setAmp] = useState(loadAmplified);

  const getters: Record<Level, string[]> = { modified: mod, base, amplified: amp };
  const setters: Record<Level, React.Dispatch<React.SetStateAction<string[]>>> = {
    modified: setMod,
    base: setBase,
    amplified: setAmp,
  };

  return (
    <Sheet
      title="Load"
      onClose={onClose}
      left={{ label: 'Cancel', onPress: onClose }}
      right={{ label: 'Done', onPress: () => onSave(mod, base, amp), primary: true }}
    >
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {LEVELS.map(({ key, label }) => {
          const selection = getters[key];
          const setSelection = setters[key];
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionLabel}>{label}</Text>

              <View style={styles.selectedRow}>
                {selection.length === 0 ? (
                  <Text style={styles.emptyHint}>—</Text>
                ) : (
                  selection.map((iconId, idx) => {
                    const icon = allIcons.find((i) => i.id === iconId);
                    if (!icon) return null;
                    return (
                      <TouchableOpacity
                        key={`${iconId}-${idx}`}
                        style={styles.selectedDotBtn}
                        onPress={() => setSelection((prev) => prev.filter((_, i) => i !== idx))}
                        activeOpacity={0.75}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${icon.label}`}
                      >
                        <LoadDot color={icon.color} size={icon.size} diameter={26} />
                        <View style={styles.removeBadge}>
                          <Text style={styles.removeBadgeText}>×</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              <Text style={styles.addLabel}>ADD</Text>
              <View style={styles.addRow}>
                {allIcons.map((icon) => (
                  <TouchableOpacity
                    key={icon.id}
                    style={styles.addDotBtn}
                    onPress={() => setSelection((prev) => [...prev, icon.id])}
                    activeOpacity={0.75}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${icon.label}`}
                  >
                    <LoadDot color={icon.color} size={icon.size} diameter={26} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}
