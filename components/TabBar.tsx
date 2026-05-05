import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';

function SequencesIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Rect x="3" y="3" width="18" height="4" rx="1" />
      <Rect x="3" y="10" width="18" height="4" rx="1" />
      <Rect x="3" y="17" width="11" height="4" rx="1" />
    </Svg>
  );
}

function LibraryIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <Line x1="10" y1="8" x2="16" y2="8" />
      <Line x1="10" y1="12" x2="14" y2="12" />
    </Svg>
  );
}

function PreferencesIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Line x1="4" y1="6" x2="20" y2="6" />
      <Circle cx="9" cy="6" r="2" fill={color} stroke="none" />
      <Line x1="4" y1="12" x2="20" y2="12" />
      <Circle cx="15" cy="12" r="2" fill={color} stroke="none" />
      <Line x1="4" y1="18" x2="20" y2="18" />
      <Circle cx="9" cy="18" r="2" fill={color} stroke="none" />
    </Svg>
  );
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: c.nav.bg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
    },
    label: {
      fontSize: 10,
      fontWeight: '500',
      color: c.text.tertiary,
      letterSpacing: 0.6,
    },
  });
}

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const tabs = [
    {
      href: '/',
      label: 'SEQUENCES',
      Icon: SequencesIcon,
      match: (p: string) => p === '/',
    },
    {
      href: '/library',
      label: 'LIBRARY',
      Icon: LibraryIcon,
      match: (p: string) => p === '/library',
    },
    {
      href: '/preferences',
      label: 'SETTINGS',
      Icon: PreferencesIcon,
      match: (p: string) => p === '/preferences',
    },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: bottom + 4 }]}>
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const color = active ? colors.accent : colors.text.tertiary;
        return (
          <TouchableOpacity
            key={tab.href}
            style={styles.tab}
            onPress={() => router.replace(tab.href as any)}
            activeOpacity={0.7}
          >
            <tab.Icon color={color} />
            <Text style={[styles.label, active && { color: colors.accent, fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
