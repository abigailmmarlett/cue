import { ScreenHeader } from '@/components/ScreenHeader';
import { TabBar } from '@/components/TabBar';
import { LoadDot } from '@/components/LoadDot';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { THEME_PRESETS, useTheme, type ThemeId, type Mode } from '@/lib/contexts/ThemeContext';
import { getAllLoadIcons, createLoadIcon, deleteLoadIcon, type LoadIcon } from '@/lib/db/loadIcons';
import { usePreferences } from '@/lib/hooks/usePreferences';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOAD_COLORS: { hex: string; name: string }[] = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#9CA3AF', name: 'Lt Gray' },
  { hex: '#6B7280', name: 'Gray' },
  { hex: '#1F2937', name: 'Black' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#22C55E', name: 'Green' },
  { hex: '#EAB308', name: 'Yellow' },
  { hex: '#A855F7', name: 'Purple' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#14B8A6', name: 'Teal' },
];

const COLOR_NAMES = new Map(LOAD_COLORS.map((c) => [c.hex, c.name]));

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: 18,
      paddingTop: 22,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: c.text.tertiary,
      letterSpacing: 1.4,
      marginBottom: 8,
      marginLeft: 2,
    },
    card: {
      backgroundColor: c.surfaceSolid,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 22,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: c.text.primary,
    },
    rowValue: {
      fontSize: 14,
      color: c.text.tertiary,
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 14,
      paddingHorizontal: 8,
      paddingTop: 12,
      paddingBottom: 16,
    },
    swatchWrap: {
      alignItems: 'center',
      gap: 6,
    },
    swatch: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchActive: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    swatchCheck: {
      fontSize: 18,
      color: '#ffffff',
      fontWeight: '700',
    },
    swatchName: {
      fontSize: 10,
      fontWeight: '600',
      color: c.text.tertiary,
      letterSpacing: 0.3,
    },
    modeCard: {
      flexDirection: 'row',
      padding: 4,
      marginBottom: 22,
    },
    modeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 8,
    },
    modeLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text.secondary,
      letterSpacing: 0.2,
    },
    modeLabelActive: {
      color: '#ffffff',
    },
    iconListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
    },
    iconLabel: {
      flex: 1,
      fontSize: 14,
      color: c.text.primary,
    },
    deleteIconBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    addFormSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      gap: 12,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
    },
    colorSwatchActive: {
      borderWidth: 2.5,
    },
    sizePills: {
      flexDirection: 'row',
      gap: 8,
    },
    sizePill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: Radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    sizePillActive: {
      borderColor: c.accent,
    },
    sizePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text.secondary,
    },
    sizePillTextActive: {
      color: c.accent,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    addIconBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: Radius.sm,
      backgroundColor: c.fill.primary,
      alignSelf: 'flex-start',
    },
    addIconBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text.inverse,
    },
    addTriggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
  });
}

export default function PreferencesScreen() {
  const { top } = useSafeAreaInsets();
  const { themeId, setTheme, colors, mode, setMode } = useTheme();
  const { hapticsEnabled, setHapticsEnabled, showExerciseNotes, setShowExerciseNotes } = usePreferences();
  const styles = makeStyles(colors);

  const [loadIcons, setLoadIcons] = useState<LoadIcon[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newSize, setNewSize] = useState<'S' | 'M' | 'L' | null>(null);

  useEffect(() => {
    setLoadIcons(getAllLoadIcons());
  }, []);

  const handleCreateIcon = () => {
    const colorName = COLOR_NAMES.get(newColor) ?? newColor;
    const label = newSize ? `${colorName} ${newSize}` : colorName;
    createLoadIcon(newColor, newSize, label);
    setLoadIcons(getAllLoadIcons());
    setShowAddForm(false);
    setNewColor('#3B82F6');
    setNewSize(null);
  };

  const handleDeleteIcon = (id: string) => {
    Alert.alert('Delete icon?', 'Exercises using this icon will no longer display it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteLoadIcon(id);
          setLoadIcons(getAllLoadIcons());
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="settings" countLabel="set user preferences" safeTop={top} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>

        <View style={styles.card}>
          <View style={styles.swatchRow}>
            {THEME_PRESETS.map((preset) => {
              const active = themeId === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => setTheme(preset.id as ThemeId)}
                  activeOpacity={0.75}
                  style={styles.swatchWrap}
                >
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: preset.accent },
                      active && styles.swatchActive,
                    ]}
                  >
                    {active && <Text style={styles.swatchCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.swatchName, active && { color: colors.accent }]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, styles.modeCard]}>
          {(['light', 'system', 'dark'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                activeOpacity={0.75}
                style={[
                  styles.modeOption,
                  active && { backgroundColor: colors.accent },
                ]}
              >
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>LOAD ICONS</Text>

        <View style={styles.card}>
          {loadIcons.map((icon, idx) => (
            <View
              key={icon.id}
              style={[styles.iconListRow, idx > 0 && styles.rowBorder]}
            >
              <LoadDot color={icon.color} size={icon.size} diameter={20} />
              <Text style={styles.iconLabel}>{icon.label}</Text>
              <TouchableOpacity onPress={() => handleDeleteIcon(icon.id)} style={styles.deleteIconBtn} hitSlop={8}>
                <Text variant="caption" color="tertiary">✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {showAddForm ? (
            <View style={[styles.addFormSection, loadIcons.length > 0 && styles.rowBorder]}>
              <View style={styles.colorGrid}>
                {LOAD_COLORS.map((c) => {
                  const isWhite = c.hex === '#FFFFFF';
                  const active = newColor === c.hex;
                  return (
                    <TouchableOpacity
                      key={c.hex}
                      onPress={() => setNewColor(c.hex)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: c.hex, borderColor: active ? colors.accent : isWhite ? colors.borderMid : 'rgba(0,0,0,0.15)' },
                          active && styles.colorSwatchActive,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.sizePills}>
                {([null, 'S', 'M', 'L'] as const).map((s) => {
                  const active = newSize === s;
                  return (
                    <TouchableOpacity
                      key={String(s)}
                      onPress={() => setNewSize(s)}
                      style={[styles.sizePill, active && styles.sizePillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.sizePillText, active && styles.sizePillTextActive]}>
                        {s ?? 'None'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.previewRow}>
                <LoadDot color={newColor} size={newSize} diameter={28} />
                <Text variant="caption" color="secondary">
                  {newSize
                    ? `${COLOR_NAMES.get(newColor) ?? newColor} ${newSize}`
                    : COLOR_NAMES.get(newColor) ?? newColor}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={handleCreateIcon} style={styles.addIconBtn} activeOpacity={0.8}>
                  <Text style={styles.addIconBtnText}>Save Icon</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowAddForm(false); setNewColor('#3B82F6'); setNewSize(null); }}
                  style={[styles.addIconBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.addIconBtnText, { color: colors.text.secondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={[styles.addTriggerRow, loadIcons.length > 0 && styles.rowBorder]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18, color: colors.text.tertiary, lineHeight: 22 }}>+</Text>
              <Text variant="body" color="tertiary">New icon</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>WORKOUT</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Haptic Feedback</Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: colors.borderMid, true: colors.accent }}
              thumbColor={colors.surfaceSolid}
            />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Show Tags in Timer</Text>
            <Switch
              value={showExerciseNotes}
              onValueChange={setShowExerciseNotes}
              trackColor={{ false: colors.borderMid, true: colors.accent }}
              thumbColor={colors.surfaceSolid}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <TabBar />
    </View>
  );
}
