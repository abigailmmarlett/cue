import { Alert, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { fireHaptic } from '@/lib/hooks/useHapticFeedback';
import {
  usePreferences,
  type BasicEvent,
  type CountdownEvent,
  type HapticSettings,
  type HapticStyle,
} from '@/lib/hooks/usePreferences';
import { useSettingsStyles } from './styles';

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
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'rigid', label: 'Rigid' },
  { value: 'soft', label: 'Soft' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

function styleLabel(style: HapticStyle): string {
  return HAPTIC_STYLES.find((s) => s.value === style)?.label ?? style;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
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
  });
}

/** Settings: haptic feedback, countdown warnings and contextual alerts. */
export function HapticsSection() {
  const { colors } = useTheme();
  const { hapticSettings, setHapticSettings } = usePreferences();
  const styles = { ...useSettingsStyles(), ...makeStyles(colors) };

  function updateHaptic(patch: Partial<HapticSettings>) {
    setHapticSettings({ ...hapticSettings, ...patch });
  }

  function updateBasicEvent(
    key: 'onExerciseTransition' | 'onSectionTransition' | 'onCompletion' | 'onMark',
    patch: Partial<BasicEvent>
  ) {
    setHapticSettings({ ...hapticSettings, [key]: { ...hapticSettings[key], ...patch } });
  }

  function updateContextualEvent(
    key: 'onLoadChange' | 'onSideChange' | 'onVariationChange',
    patch: Partial<CountdownEvent>
  ) {
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
          const updated = [...hapticSettings.countdownWarnings, { seconds: s, style: 'medium' as const }].sort(
            (a, b) => b.seconds - a.seconds
          );
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

  function pickStyle(onChange: (style: HapticStyle) => void, current: HapticStyle) {
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
      countdownWarnings: hapticSettings.countdownWarnings.map((w) => (w.seconds === seconds ? { ...w, style } : w)),
    });
  }
  return (
    <>
      <Text style={styles.sectionLabel}>HAPTICS</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Haptic Feedback</Text>
          <Switch
            value={hapticSettings.enabled}
            onValueChange={(v) => updateHaptic({ enabled: v })}
            accessibilityLabel="Haptic feedback"
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
                      accessibilityLabel={label}
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
                        hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}
                        accessibilityRole="button"
                        accessibilityLabel={`${label} pattern, ${styleLabel(event.style)}`}
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
                  hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${warning.seconds} second warning pattern, ${styleLabel(warning.style)}`}
                >
                  <Text style={styles.timingChipText}>{styleLabel(warning.style)} ▾</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeCountdownWarning(warning.seconds)}
                  style={styles.deleteBtn}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${warning.seconds} second warning`}
                >
                  <Text variant="caption" color="tertiary">
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {hapticSettings.countdownWarnings.length < COUNTDOWN_OPTIONS.length && (
              <TouchableOpacity
                onPress={addCountdownWarning}
                style={[styles.addTriggerRow, hapticSettings.countdownWarnings.length > 0 && styles.rowBorder]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add warning"
              >
                <Text style={{ fontSize: 18, color: colors.text.tertiary, lineHeight: 22 }}>+</Text>
                <Text variant="body" color="tertiary">
                  Add warning
                </Text>
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
                      accessibilityLabel={label}
                      trackColor={{ false: colors.borderMid, true: colors.accent }}
                      thumbColor={colors.surfaceSolid}
                    />
                  </View>
                  {event.enabled && (
                    <>
                      <View style={[styles.row, styles.rowBorder]}>
                        <Text style={styles.rowLabel}>When to alert</Text>
                        <TouchableOpacity
                          onPress={() => pickTiming(key)}
                          style={styles.timingChip}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}
                          accessibilityRole="button"
                          accessibilityLabel={`${label}: when to alert, ${timingLabel(event)}`}
                        >
                          <Text style={styles.timingChipText}>{timingLabel(event)} ▾</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.row, styles.rowBorder]}>
                        <Text style={styles.rowLabel}>Pattern</Text>
                        <TouchableOpacity
                          onPress={() => pickStyle((s) => updateContextualEvent(key, { style: s }), event.style)}
                          style={styles.timingChip}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}
                          accessibilityRole="button"
                          accessibilityLabel={`${label} pattern, ${styleLabel(event.style)}`}
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
    </>
  );
}
