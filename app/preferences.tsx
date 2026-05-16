import { ScreenHeader } from '@/components/ScreenHeader';
import { TabBar } from '@/components/TabBar';
import { LoadDot } from '@/components/LoadDot';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { THEME_PRESETS, useTheme, type ThemeId, type Mode } from '@/lib/contexts/ThemeContext';
import { getAllLoadIcons, createLoadIcon, deleteLoadIcon, type LoadIcon } from '@/lib/db/loadIcons';
import { usePreferences, type HapticSettings, type BasicEvent, type CountdownEvent, type CountdownWarning, type HapticStyle, type ActionButtonSize, type TextSize } from '@/lib/hooks/usePreferences';
import { fireHaptic } from '@/lib/hooks/useHapticFeedback';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTour } from '@/lib/contexts/TourContext';
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
    rowSubLabel: {
      fontSize: 12,
      color: c.text.tertiary,
      marginTop: 1,
    },
    timingChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    timingChipText: {
      fontSize: 13,
      color: c.text.secondary,
    },
    countdownTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 10,
    },
    countdownTagText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: c.text.primary,
    },
    deleteBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
  });
}

const COUNTDOWN_OPTIONS = [5, 10, 15, 20, 25, 30];

const TIMING_LABELS: Record<string, string> = {
  at_transition: 'At transition',
  '5': '5s before',
  '10': '10s before',
  '15': '15s before',
  '20': '20s before',
  '25': '25s before',
  '30': '30s before',
};

function timingLabel(event: CountdownEvent): string {
  if (event.timing === 'at_transition') return 'At transition';
  return TIMING_LABELS[String(event.secondsBefore)] ?? `${event.secondsBefore}s before`;
}

const HAPTIC_STYLES: { value: HapticStyle; label: string }[] = [
  { value: 'light',   label: 'Light' },
  { value: 'medium',  label: 'Medium' },
  { value: 'heavy',   label: 'Heavy' },
  { value: 'rigid',   label: 'Rigid' },
  { value: 'soft',    label: 'Soft' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error',   label: 'Error' },
];

function styleLabel(style: HapticStyle): string {
  return HAPTIC_STYLES.find((s) => s.value === style)?.label ?? style;
}

export default function PreferencesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { themeId, setTheme, colors, mode, setMode } = useTheme();
  const { hapticSettings, setHapticSettings, showExerciseNotes, setShowExerciseNotes, actionButtonSize, setActionButtonSize, textSize, setTextSize } = usePreferences();
  const styles = makeStyles(colors);

  const { registerTarget, unregisterTarget, startTour } = useTour();
  const contentRef = useRef<View>(null);

  useEffect(() => {
    registerTarget('preferences-content', contentRef);
    return () => unregisterTarget('preferences-content');
  }, [registerTarget, unregisterTarget]);

  function updateHaptic(patch: Partial<HapticSettings>) {
    setHapticSettings({ ...hapticSettings, ...patch });
  }

  function updateBasicEvent(key: 'onExerciseTransition' | 'onSectionTransition' | 'onCompletion' | 'onMark', patch: Partial<BasicEvent>) {
    setHapticSettings({ ...hapticSettings, [key]: { ...hapticSettings[key], ...patch } });
  }

  function updateContextualEvent(key: 'onLoadChange' | 'onSideChange' | 'onVariationChange', patch: Partial<CountdownEvent>) {
    setHapticSettings({ ...hapticSettings, [key]: { ...hapticSettings[key], ...patch } });
  }

  function addCountdownWarning() {
    const usedSeconds = hapticSettings.countdownWarnings.map((w) => w.seconds);
    const available = COUNTDOWN_OPTIONS.filter((s) => !usedSeconds.includes(s));
    if (available.length === 0) return;
    Alert.alert('Add countdown warning', 'Fire a buzz this many seconds before the exercise ends', [
      ...available.map((s) => ({
        text: `${s} seconds`,
        onPress: () => {
          const updated = [...hapticSettings.countdownWarnings, { seconds: s, style: 'medium' as const }]
            .sort((a, b) => b.seconds - a.seconds);
          updateHaptic({ countdownWarnings: updated });
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function removeCountdownWarning(seconds: number) {
    updateHaptic({ countdownWarnings: hapticSettings.countdownWarnings.filter((w) => w.seconds !== seconds) });
  }

  function pickTiming(key: 'onLoadChange' | 'onSideChange' | 'onVariationChange') {
    Alert.alert('When to alert', undefined, [
      {
        text: 'At transition',
        onPress: () => updateContextualEvent(key, { timing: 'at_transition', secondsBefore: 0 }),
      },
      ...COUNTDOWN_OPTIONS.map((s) => ({
        text: `${s}s before`,
        onPress: () => updateContextualEvent(key, { timing: 'countdown', secondsBefore: s }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function pickStyle(
    onChange: (style: HapticStyle) => void,
    current: HapticStyle,
  ) {
    Alert.alert('Vibration pattern', undefined, [
      ...HAPTIC_STYLES.map(({ value, label }) => ({
        text: label + (value === current ? ' ✓' : ''),
        onPress: () => {
          fireHaptic(value);
          onChange(value);
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function updateCountdownWarningStyle(seconds: number, style: HapticStyle) {
    updateHaptic({
      countdownWarnings: hapticSettings.countdownWarnings.map((w) =>
        w.seconds === seconds ? { ...w, style } : w
      ),
    });
  }

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

      <View ref={contentRef} style={styles.scroll}>
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

        <Text style={styles.sectionLabel}>BUILDER</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Text size</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['small', 'default', 'large'] as TextSize[]).map((opt) => {
                const active = textSize === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.timingChip, active && { backgroundColor: colors.fill.primary, borderColor: colors.fill.primary }]}
                    onPress={() => setTextSize(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timingChipText, active && { color: colors.text.inverse }]}>
                      {opt === 'small' ? 'S' : opt === 'default' ? 'M' : 'L'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Action button size</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['small', 'default', 'large'] as ActionButtonSize[]).map((opt) => {
                const active = actionButtonSize === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.timingChip, active && { backgroundColor: colors.fill.primary, borderColor: colors.fill.primary }]}
                    onPress={() => setActionButtonSize(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timingChipText, active && { color: colors.text.inverse }]}>
                      {opt === 'small' ? 'S' : opt === 'default' ? 'M' : 'L'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>HAPTICS</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Haptic Feedback</Text>
            <Switch
              value={hapticSettings.enabled}
              onValueChange={(v) => updateHaptic({ enabled: v })}
              trackColor={{ false: colors.borderMid, true: colors.accent }}
              thumbColor={colors.surfaceSolid}
            />
          </View>
          {hapticSettings.enabled && (
            <>
              {(
                [
                  ['onExerciseTransition', 'Exercise transition'],
                  ['onSectionTransition', 'Section transition'],
                  ['onCompletion', 'Workout complete'],
                  ['onMark', 'Mark rep'],
                ] as const
              ).map(([key, label]) => {
                const event = hapticSettings[key];
                return (
                  <View key={key}>
                    <View style={[styles.row, styles.rowBorder]}>
                      <Text style={styles.rowLabel}>{label}</Text>
                      <Switch
                        value={event.enabled}
                        onValueChange={(v) => updateBasicEvent(key, { enabled: v })}
                        trackColor={{ false: colors.borderMid, true: colors.accent }}
                        thumbColor={colors.surfaceSolid}
                      />
                    </View>
                    {event.enabled && (
                      <View style={[styles.row, styles.rowBorder]}>
                        <Text style={styles.rowLabel}>Pattern</Text>
                        <TouchableOpacity
                          onPress={() => pickStyle((s) => updateBasicEvent(key, { style: s }), event.style)}
                          style={styles.timingChip}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.timingChipText}>{styleLabel(event.style)} ▾</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

        {hapticSettings.enabled && (
          <>
            <Text style={styles.sectionLabel}>COUNTDOWN WARNINGS</Text>

            <View style={styles.card}>
              {hapticSettings.countdownWarnings.map((warning, idx) => (
                <View key={String(warning.seconds)} style={[styles.countdownTag, idx > 0 && styles.rowBorder]}>
                  <Text style={styles.countdownTagText}>{warning.seconds}s before end</Text>
                  <TouchableOpacity
                    onPress={() => pickStyle((s) => updateCountdownWarningStyle(warning.seconds, s), warning.style)}
                    style={[styles.timingChip, { marginRight: 8 }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timingChipText}>{styleLabel(warning.style)} ▾</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCountdownWarning(warning.seconds)} style={styles.deleteBtn} hitSlop={8}>
                    <Text variant="caption" color="tertiary">✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {hapticSettings.countdownWarnings.length < COUNTDOWN_OPTIONS.length && (
                <TouchableOpacity
                  onPress={addCountdownWarning}
                  style={[styles.addTriggerRow, hapticSettings.countdownWarnings.length > 0 && styles.rowBorder]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18, color: colors.text.tertiary, lineHeight: 22 }}>+</Text>
                  <Text variant="body" color="tertiary">Add warning</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionLabel}>CONTEXTUAL ALERTS</Text>

            <View style={styles.card}>
              {(
                [
                  ['onLoadChange', 'Load change', 'Buzz when next exercise has different load'],
                  ['onSideChange', 'Side / bilateral change', 'Buzz when next exercise has different side'],
                  ['onVariationChange', 'Variation change', 'Buzz when next exercise has different variation'],
                ] as const
              ).map(([key, label, sublabel], idx) => {
                const event = hapticSettings[key];
                return (
                  <View key={key}>
                    <View style={[styles.row, idx > 0 && styles.rowBorder]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>{label}</Text>
                        <Text style={styles.rowSubLabel}>{sublabel}</Text>
                      </View>
                      <Switch
                        value={event.enabled}
                        onValueChange={(v) => updateContextualEvent(key, { enabled: v })}
                        trackColor={{ false: colors.borderMid, true: colors.accent }}
                        thumbColor={colors.surfaceSolid}
                      />
                    </View>
                    {event.enabled && (
                      <>
                        <View style={[styles.row, styles.rowBorder]}>
                          <Text style={styles.rowLabel}>When to alert</Text>
                          <TouchableOpacity onPress={() => pickTiming(key)} style={styles.timingChip} activeOpacity={0.7}>
                            <Text style={styles.timingChipText}>{timingLabel(event)} ▾</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.row, styles.rowBorder]}>
                          <Text style={styles.rowLabel}>Pattern</Text>
                          <TouchableOpacity
                            onPress={() => pickStyle((s) => updateContextualEvent(key, { style: s }), event.style)}
                            style={styles.timingChip}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.timingChipText}>{styleLabel(event.style)} ▾</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>TOUR</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={startTour} activeOpacity={0.7}>
            <Text style={styles.rowLabel}>View App Tour</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>TAGS</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/tags')} activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Manage Tags</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
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
      </View>

      <TabBar />
    </View>
  );
}
