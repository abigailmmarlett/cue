import { ScreenHeader } from '@/components/ScreenHeader';
import { TabBar } from '@/components/TabBar';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing } from '@/constants/theme';
import { THEME_PRESETS, useTheme, type ThemeId, type Mode } from '@/lib/contexts/ThemeContext';
import { usePreferences } from '@/lib/hooks/usePreferences';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  });
}

export default function PreferencesScreen() {
  const { top } = useSafeAreaInsets();
  const { themeId, setTheme, colors, mode, setMode } = useTheme();
  const { hapticsEnabled, setHapticsEnabled, showExerciseNotes, setShowExerciseNotes } = usePreferences();
  const styles = makeStyles(colors);

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
