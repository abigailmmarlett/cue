import { View, ViewStyle } from 'react-native';
import { Text } from './ui/Text';
import { LoadDot } from './LoadDot';
import { useTheme } from '@/lib/contexts/ThemeContext';
import type { LoadIcon } from '@/lib/db/loadIcons';

interface Props {
  label: string;
  iconIds: string[];
  allIcons: LoadIcon[];
  dotDiameter?: number;
  style?: ViewStyle;
}

export function LoadDotRow({ label, iconIds, allIcons, dotDiameter = 14, style }: Props) {
  const { colors } = useTheme();
  if (iconIds.length === 0) return null;
  const iconMap = new Map(allIcons.map((i) => [i.id, i]));
  const visible = iconIds.filter((id) => iconMap.has(id));
  if (visible.length === 0) return null;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5 }, style]}>
      <Text
        style={{
          fontSize: 8,
          fontWeight: '800',
          letterSpacing: 0.8,
          color: colors.text.tertiary,
          width: 28,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
        {visible.map((id, idx) => {
          const icon = iconMap.get(id)!;
          return (
            <LoadDot key={`${id}-${idx}`} color={icon.color} size={icon.size} diameter={dotDiameter} />
          );
        })}
      </View>
    </View>
  );
}
