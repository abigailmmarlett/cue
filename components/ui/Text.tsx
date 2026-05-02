import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption' | 'timer';
type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
}

export function Text({ variant = 'body', color = 'primary', style, ...props }: Props) {
  return (
    <RNText
      style={[styles.base, styles[variant], colorStyles[color], style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text.primary,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
  timer: {
    fontSize: FontSize.timer,
    fontWeight: FontWeight.light,
    letterSpacing: -4,
    fontVariant: ['tabular-nums'],
  },
});

const colorStyles = StyleSheet.create({
  primary: { color: Colors.text.primary },
  secondary: { color: Colors.text.secondary },
  tertiary: { color: Colors.text.tertiary },
  inverse: { color: Colors.text.inverse },
});
