import Constants from 'expo-constants';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TabBar } from '@/components/TabBar';
import { Text } from '@/components/ui/Text';
import { AppearanceSection } from '@/components/preferences/AppearanceSection';
import { HapticsSection } from '@/components/preferences/HapticsSection';
import { LoadIconsSection } from '@/components/preferences/LoadIconsSection';
import { SizePicker } from '@/components/preferences/SizePicker';
import { useSettingsStyles } from '@/components/preferences/styles';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTour } from '@/lib/contexts/TourContext';
import { usePreferences } from '@/lib/hooks/usePreferences';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View, type ViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },
});

export default function PreferencesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { showTimerTags, setShowTimerTags, actionButtonSize, setActionButtonSize, textSize, setTextSize } =
    usePreferences();
  const styles = { ...useSettingsStyles(), ...screenStyles };

  const { registerTarget, unregisterTarget, startTour } = useTour();
  const contentRef = useRef<ViewInstance>(null);

  useEffect(() => {
    registerTarget('preferences-content', contentRef);
    return () => unregisterTarget('preferences-content');
  }, [registerTarget, unregisterTarget]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="settings" countLabel="set user preferences" safeTop={top} />

      <View ref={contentRef} style={styles.scroll}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <AppearanceSection />
          <LoadIconsSection />

          <Text style={styles.sectionLabel}>WORKOUT</Text>

          <View style={styles.card}>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Show Tags in Timer</Text>
              <Switch
                value={showTimerTags}
                onValueChange={setShowTimerTags}
                accessibilityLabel="Show tags in timer"
                trackColor={{ false: colors.borderMid, true: colors.accent }}
                thumbColor={colors.surfaceSolid}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>BUILDER</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Text size</Text>
              <SizePicker label="Text size" value={textSize} onChange={setTextSize} />
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Action button size</Text>
              <SizePicker label="Action button size" value={actionButtonSize} onChange={setActionButtonSize} />
            </View>
          </View>

          <HapticsSection />

          <Text style={styles.sectionLabel}>TOUR</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={startTour}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View app tour"
            >
              <Text style={styles.rowLabel}>View App Tour</Text>
              <Text style={styles.rowValue}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>TAGS</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/tags')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Manage tags"
            >
              <Text style={styles.rowLabel}>Manage Tags</Text>
              <Text style={styles.rowValue}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>ABOUT</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>{Constants.expoConfig?.version}</Text>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </View>

      <TabBar />
    </View>
  );
}
