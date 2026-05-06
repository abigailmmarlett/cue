import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Text } from './ui/Text';
import { LoadDot } from './LoadDot';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import type { LoadIcon } from '@/lib/db/loadIcons';

type Level = 'modified' | 'base' | 'amplified';

const LEVELS: { key: Level; label: string }[] = [
  { key: 'modified', label: 'MODIFIED' },
  { key: 'base', label: 'BASE' },
  { key: 'amplified', label: 'AMPLIFIED' },
];

interface Props {
  visible: boolean;
  loadModified: string[];
  loadBase: string[];
  loadAmplified: string[];
  allIcons: LoadIcon[];
  onSave: (modified: string[], base: string[], amplified: string[]) => void;
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
    section: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sectionLabel: {
      fontSize: 10,
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
      fontSize: 14,
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
      fontSize: 10,
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

export function LoadEditor({
  visible,
  loadModified,
  loadBase,
  loadAmplified,
  allIcons,
  onSave,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [mod, setMod] = useState<string[]>([]);
  const [base, setBase] = useState<string[]>([]);
  const [amp, setAmp] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setMod([...loadModified]);
      setBase([...loadBase]);
      setAmp([...loadAmplified]);
    }
  }, [visible]);

  const getters: Record<Level, string[]> = { modified: mod, base, amplified: amp };
  const setters: Record<Level, React.Dispatch<React.SetStateAction<string[]>>> = {
    modified: setMod,
    base: setBase,
    amplified: setAmp,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text variant="label" color="secondary">Cancel</Text>
          </TouchableOpacity>
          <Text variant="label" style={styles.headerTitle}>Load</Text>
          <TouchableOpacity onPress={() => onSave(mod, base, amp)} style={styles.headerBtn}>
            <Text variant="label">Done</Text>
          </TouchableOpacity>
        </View>

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
                          onPress={() =>
                            setSelection((prev) => prev.filter((_, i) => i !== idx))
                          }
                          activeOpacity={0.75}
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
                    >
                      <LoadDot color={icon.color} size={icon.size} diameter={26} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
