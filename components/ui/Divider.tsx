import { View, StyleSheet, ViewStyle } from 'react-native';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface Props {
  inset?: boolean;
  style?: ViewStyle;
}

export function Divider({ inset, style }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: colors.border },
        inset && styles.inset,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
  },
  inset: {
    marginLeft: Spacing.md,
  },
});
