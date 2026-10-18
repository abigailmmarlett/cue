import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import { THEME_PRESETS, type Mode, type ThemeId } from '@/constants/themes';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSettingsStyles } from './styles';

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
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
      color: c.text.onFill,
    },
  });
}

/** Settings: the theme color and light/dark mode. */
export function AppearanceSection() {
  const { themeId, setTheme, colors, mode, setMode } = useTheme();
  const styles = { ...useSettingsStyles(), ...makeStyles(colors) };

  return (
    <>
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
                accessibilityRole="button"
                accessibilityLabel={`${preset.name} theme`}
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.swatch, { backgroundColor: preset.accent }, active && styles.swatchActive]}>
                  {active && <Text style={styles.swatchCheck}>✓</Text>}
                </View>
                <Text style={[styles.swatchName, active && { color: colors.accentText }]}>{preset.name}</Text>
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
              hitSlop={{ top: 6, bottom: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`${m.charAt(0).toUpperCase() + m.slice(1)} appearance`}
              accessibilityState={{ selected: active }}
              style={[styles.modeOption, active && { backgroundColor: colors.fill.primary }]}
            >
              <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}
