import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

function SequencesIcon({ active }: { active: boolean }) {
  const color = active ? Colors.accent : Colors.text.tertiary;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Rect x="3" y="3" width="18" height="4" rx="1" />
      <Rect x="3" y="10" width="18" height="4" rx="1" />
      <Rect x="3" y="17" width="11" height="4" rx="1" />
    </Svg>
  );
}

function LibraryIcon({ active }: { active: boolean }) {
  const color = active ? Colors.accent : Colors.text.tertiary;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <Line x1="10" y1="8" x2="16" y2="8" />
      <Line x1="10" y1="12" x2="14" y2="12" />
    </Svg>
  );
}

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();

  const tabs = [
    { href: '/', label: 'SEQUENCES', Icon: SequencesIcon, match: (p: string) => p === '/' },
    { href: '/library', label: 'LIBRARY', Icon: LibraryIcon, match: (p: string) => p === '/library' },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: bottom + 4 }]}>
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <TouchableOpacity
            key={tab.href}
            style={styles.tab}
            onPress={() => router.replace(tab.href)}
            activeOpacity={0.7}
          >
            <tab.Icon active={active} />
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.nav.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    color: Colors.text.tertiary,
    letterSpacing: 0.6,
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
