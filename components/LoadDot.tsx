import { View } from 'react-native';
import { Text } from './ui/Text';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface Props {
  color: string;
  size?: 'S' | 'M' | 'L' | null;
  diameter?: number;
}

export function LoadDot({ color, size, diameter = 14 }: Props) {
  const { colors } = useTheme();
  const isWhite = color.toUpperCase() === '#FFFFFF';
  return (
    <View
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: isWhite ? colors.borderMid : 'rgba(0,0,0,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!!size && (
        <Text
          style={{
            fontSize: Math.max(6, Math.floor(diameter * 0.42)),
            fontWeight: '800',
            color: isWhite ? '#555' : '#fff',
            lineHeight: diameter,
            textAlign: 'center',
          }}
        >
          {size}
        </Text>
      )}
    </View>
  );
}
