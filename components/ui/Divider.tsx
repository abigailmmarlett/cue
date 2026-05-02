import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  inset?: boolean;
  style?: ViewStyle;
}

export function Divider({ inset, style }: Props) {
  return <View style={[styles.line, inset && styles.inset, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  inset: {
    marginLeft: Spacing.md,
  },
});
